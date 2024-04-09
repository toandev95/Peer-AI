import {
  AIMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { LangChainStream, StreamingTextResponse } from 'ai';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import _ from 'lodash';
import type { ServerRuntime } from 'next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { IChatMessage } from '@/types';

const PEER_AI_CONVERSATION_PROMPT = `You are Peer AI, a large language AI assistant built by Toan Doan. You are designed to chat and answer questions in many fields, especially in technology. You cannot directly access real-time data or gain knowledge from recent events in 2024.
REMEMBER: If you don't know information about something or don't know the answer to a specific question, avoid answering with something like "Hmm, I'm not sure." or "Try searching on search engines like Google.". Don't try to make up answers.

Trained model: {model}.
User language: {language}.`;

export async function POST(
  req: NextRequest,
): Promise<NextResponse | StreamingTextResponse> {
  const customApiKey = req.headers.get('x-custom-api-key');
  const customBaseUrl = req.headers.get('x-custom-base-url');

  const json = await req.json();

  const {
    messages,
    model: modelName,
    maxTokens,
    temperature,
    topP,
    frequencyPenalty,
    presencePenalty,
    language,
    streaming,
  } = json as {
    messages: Pick<IChatMessage, 'role' | 'content'>[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    language?: string;
    streaming?: boolean;
  };

  const previousMessages = _(messages)
    .slice(0, -1)
    .map((message) => {
      switch (message.role) {
        case 'system':
          return new SystemMessage(message.content);

        case 'assistant':
          return new AIMessage(message.content);

        case 'user':
          return new HumanMessage(message.content);

        default:
          return new ChatMessage(message);
      }
    })
    .value();
  const currentMessage = _.last(messages) as ChatMessage;

  const llm = new ChatOpenAI(
    {
      modelName,
      maxTokens,
      temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      streaming,
      openAIApiKey: customApiKey || process.env.OPENAI_API_KEY,
    },
    {
      baseURL: customBaseUrl || process.env.OPENAI_BASE_URL,
    },
  );

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', PEER_AI_CONVERSATION_PROMPT],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
  ]);

  const memory = new BufferMemory({
    chatHistory: new ChatMessageHistory(previousMessages),
    returnMessages: true,
    inputKey: 'input',
    memoryKey: 'chat_history',
  });

  const chain = new ConversationChain({ llm, prompt, memory });

  if (!streaming) {
    try {
      const { response } = await chain.invoke({
        input: currentMessage.content,
        model: modelName,
        language,
      });
      return new Response(response as string);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);

      return NextResponse.json(
        { error: 'UNABLE_TO_PROCESS_REQUEST' },
        { status: 502 },
      );
    }
  }

  const { stream, handlers } = LangChainStream();
  chain.invoke(
    {
      input: currentMessage.content,
      model: modelName,
      language,
    },
    { callbacks: [handlers] },
  );

  return new StreamingTextResponse(stream);
}

export const runtime: ServerRuntime = 'edge';
