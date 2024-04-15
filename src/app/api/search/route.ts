import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { OpenAI } from '@langchain/openai';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import _, { isEmpty, isNil, map, pick } from 'lodash';
import type { ServerRuntime } from 'next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '@/lib/env.mjs';

const RAG_QUERY_PROMPT = `You are a helpful assistant that helps users answer questions from contextual data provided by Google search results. Based on specific search results, answer the user's specific question as accurately as possible.
Use available sources to write complete but concise answers. Avoid repeating information and maintain a neutral and journalistic tone. Synthesize information from search results into a coherent answer.
Prefer to answer using the user's language or in the same language as the original question and contextual data, answers should use MARKDOWN syntax. Please cite the exact context with a reference number in the [citation:$number] format. If a sentence comes from multiple contexts, please list all applicable citations, like [citation:3][citation:5].
REMEMBER: If there is no relevant information in the context, simply say "Hmm, it seems there is no answer to your question.", don't attempt to fabricate an answer.

Here is the context set:
{context}

User question:
{question}

User language:
{language}

Helpful answer:`;

const RELATED_QUESTIONS_PROMPT = `You are a helpful assistant who aids users in asking relevant follow-up questions, based on the relevant context and the user's initial question. Identify topics that are worthy of potential subsequent inquiries and formulate questions that do not exceed 20 words each.
Ensure that specific details, such as events, names, and locations, are incorporated into the follow-up questions so they can be posed independently. For instance, if the original question pertains to the "Manhattan project", in the subsequent question, don't merely refer to it as the "project" but use the full term "Manhattan project". Questions must be in the same language as the user's language or the same language as the original question.
REMEMBER: Propose approximately two to three such follow-up questions based on the initial question and related context. Do not duplicate the original question. Each related question must not exceed 20 words. Number each question "1.". Since this is a purely keyword question, don't use too many special characters. If the context yields no results, respond with "NO_RELATED_QUESTIONS".

Here is the context set:
{context}

Here is the original question:
{question}

Your answer:
{answer}

User language:
{language}

Related questions would be:`;

export async function POST(req: NextRequest): Promise<Response> {
  const customApiKey = req.headers.get('x-custom-api-key');
  const customBaseUrl = req.headers.get('x-custom-base-url');

  const { query, language } = (await req.json()) as {
    query: string;
    language: string;
  };

  if (isNil(query) || isEmpty(query)) {
    return NextResponse.json({ error: 'Missing query!' }, { status: 400 });
  }

  const results = [];

  try {
    const response = await fetch('https://browserless.idex.vn/function', {
      method: 'POST',
      body: JSON.stringify({
        // eslint-disable-next-line no-template-curly-in-string
        code: 'module.exports=async({page:e,context:t})=>{let{query:i}=t;await e.setUserAgent("Mozilla/5.0 (Windows Mobile 10; Android 10.0; Microsoft; Lumia 950XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.81 Mobile Safari/537.36 Edge/40.15254.603"),await e.goto(`https://www.google.com/search?q=${i}&hl=en`,{waitUntil:"networkidle2"});let a=await e.evaluate(()=>{let e=document.querySelectorAll(\'#main div[data-hveid] > .xpd > div:first-child > a[href*="/url?q="][data-ved]\'),t=[];return e.forEach(e=>{if(!e.querySelector("h3"))return;let i=e.getAttribute("href").match(/q=(.*?)&sa/);if(i.length<2)return;let a=decodeURIComponent(i[1]);let l=e.querySelector("h3").textContent.trim(),r=e.parentNode.nextSibling.textContent.trim();t.push({url:a,title:l,description:r})}),t});return{type:"application/json",data:a}};',
        context: { query: encodeURIComponent(query) },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();

    results.push(...data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  const sources = _(results)
    .map<{
      url: string;
      title: string;
      description: string;
    }>((args) => {
      return {
        ...pick(args, ['url', 'title', 'description']),
        iconUrl: `https://www.google.com/s2/favicons?domain=${args.url}&sz=16`,
      };
    })
    .take(8)
    .value();

  const docs = map(sources, (item) => {
    return new Document({
      pageContent: item.description,
      metadata: {
        title: item.title,
        source: item.url,
      },
    });
  });

  const llm = new OpenAI(
    {
      temperature: 0.7,
      maxTokens: 1024,
      // modelName: 'gpt-4',
      streaming: true,
      openAIApiKey: customApiKey || env.OPENAI_API_KEY,
    },
    { baseURL: customBaseUrl || env.OPENAI_BASE_URL },
  );

  const ragChain = await createStuffDocumentsChain({
    llm,
    prompt: ChatPromptTemplate.fromTemplate(RAG_QUERY_PROMPT),
    outputParser: new StringOutputParser(),
  });
  const relatedQuestionsChain = await createStuffDocumentsChain({
    llm,
    prompt: ChatPromptTemplate.fromTemplate(RELATED_QUESTIONS_PROMPT),
    outputParser: new StringOutputParser(),
  });

  const ragResponse = await ragChain.invoke({
    question: query,
    context: docs,
    language,
  });
  const relatedQuestionsResponse = await relatedQuestionsChain.invoke({
    question: query,
    answer: ragResponse,
    context: docs,
    language,
  });

  let relatedQuestions = _(relatedQuestionsResponse.split('\n'))
    .map((question) => question.replace(/^\d+\.\s/, '').trim())
    .filter((question) => !question.startsWith('NO_RELATED_QUESTIONS'))
    .value();
  if (relatedQuestions.length < 2) {
    relatedQuestions = [];
  }

  const answer = `${JSON.stringify(sources)}\n\n__LLM_RESPONSE__\n${ragResponse}\n\n__RELATED_QUESTIONS__\n${JSON.stringify(relatedQuestions)}`;
  return new Response(answer);
}

export const runtime: ServerRuntime = 'edge';
