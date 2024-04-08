'use client';

import { useMutation } from '@tanstack/react-query';
import _, { isEmpty, isNil, isNumber, map, sample } from 'lodash';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  RiArrowRightLine,
  RiBook2Line,
  RiCloseLine,
  RiLoader3Line,
  RiQuestionLine,
  RiSearch2Line,
} from 'react-icons/ri';
import { useEffectOnce } from 'react-use';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import i18n from '@/i18n';
import { cn, emptyToUndefined } from '@/lib/helpers';
import { useConfigStore } from '@/stores';

import { AppBar, AppBarIconButton } from './AppBar';
import { MemoizedReactMarkdown } from './Markdown';
import { Button } from './UI/Button';
import { CodeBlock } from './UI/CodeBlock';
import { Input } from './UI/Input';
import { Popover, PopoverContent, PopoverTrigger } from './UI/Popover';

type SearchResult = {
  url: string;
  iconUrl: string;
  title: string;
  description: string;
};

const CitePopover = ({
  children,
  source,
}: {
  children: ReactNode;
  source?: SearchResult;
}) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="relative z-10 inline px-2">
          <a className="absolute -left-0 -top-1.5 cursor-pointer rounded-full bg-foreground/[.2] px-[5px] py-0 text-[10px] no-underline">
            {children}
          </a>
        </span>
      </PopoverTrigger>
      {!isNil(source) && (
        <PopoverContent side="bottom" align="start" className="z-20">
          <div className="mb-2 truncate text-sm font-semibold">
            {source.title}
          </div>
          <div className="mb-2 text-xs">{source.description}</div>
          <div className="flex items-center justify-between gap-2">
            <a
              href={source.url}
              title={source.title}
              target="_blank"
              className="truncate text-xs text-primary"
            >
              {source.url}
            </a>
            <Image
              src={source.iconUrl}
              alt={new URL(source.url).host}
              width={16}
              height={16}
              className="size-[12px]"
            />
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};

const placeholder = sample([
  'What to eat when coming to Vietnam?',
  'Where to travel in Vietnam?',
  'Which hotel is good in Vietnam?',
  'Culinary culture in Vietnam?',
  'What is pho?',
]);

const Search = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const configStore = useConfigStore();

  const [isFirstSearch, setIsFirstSearch] = useState<boolean>(true);
  const [query, setQuery] = useState<string>(searchParams.get('q') || '');

  const {
    isPending,
    isSuccess,
    data,
    mutateAsync: requestSearch,
  } = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          language: i18n.language,
        }),
        headers: !isNil(emptyToUndefined(configStore.accessCode))
          ? { Authorization: `Bearer ${configStore.accessCode}` }
          : undefined,
      });

      if (!response.ok) {
        throw new Error('Something went wrong!');
      }

      const text = await response.text();
      const args = text.trim().split(/__LLM_RESPONSE__|__RELATED_QUESTIONS__/);

      const sources = JSON.parse(args[0]) as SearchResult[];
      const answer = args[1].trim();
      const questions = JSON.parse(args[2]) as string[];

      return {
        sources,
        answer,
        questions,
      };
    },
  });

  useEffectOnce(() => {
    if (isEmpty(query)) {
      return;
    }

    setIsFirstSearch(false);

    requestSearch(query);
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (!isEmpty(query)) {
      params.set('q', query);
    } else {
      params.delete('q');
    }

    if (params.toString() === searchParams.toString()) {
      return;
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, query, router, searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEmpty(query)) {
      return;
    }

    setIsFirstSearch(false);

    await requestSearch(query);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto scrollbar scrollbar-thumb-accent-foreground/30 scrollbar-thumb-rounded-full scrollbar-w-[3px]">
      <AppBar
        title="Search"
        subtitle="Analyze and provide more accurate answers by AI"
        actions={
          <AppBarIconButton
            key={1}
            IconComponent={RiCloseLine}
            onClick={() => router.back()}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {isFirstSearch && (
          <div className="flex size-full flex-col items-center justify-center">
            <div className="text-lg font-medium text-muted-foreground/60">
              Ask a question to get started.
            </div>
          </div>
        )}
        {isPending && (
          <>
            <div>
              <div className="mb-2 flex items-center gap-1">
                <RiBook2Line size={16} />
                <span className="underline">Answer:</span>
              </div>
              <div className="flex animate-pulse flex-col justify-start gap-1">
                {_(['w-full', 'w-8/12', 'w-full', 'w-6/12'])
                  .shuffle()
                  .map((w, index) => (
                    <div
                      key={index}
                      className={cn('h-3 rounded-sm bg-muted-foreground/20', w)}
                    />
                  ))
                  .value()}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1 underline">
                <RiSearch2Line size={16} />
                <span className="underline">Sources:</span>
              </div>
              <div className="grid animate-pulse grid-cols-4 gap-2">
                <div className="h-16 rounded-lg bg-muted-foreground/20" />
                <div className="h-16 rounded-lg bg-muted-foreground/20" />
                <div className="h-16 rounded-lg bg-muted-foreground/20" />
                <div className="h-16 rounded-lg bg-muted-foreground/20" />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1 underline">
                <RiQuestionLine size={16} />
                <span className="underline">Related Questions:</span>
              </div>
              <div className="flex animate-pulse flex-col items-start gap-2">
                {_(['w-80', 'w-60', 'w-96'])
                  .shuffle()
                  .map((w, index) => (
                    <div
                      key={index}
                      className={cn('h-6 rounded-lg bg-muted-foreground/20', w)}
                    />
                  ))
                  .value()}
              </div>
            </div>
          </>
        )}
        {isSuccess && (
          <>
            <div>
              <div className="mb-2 flex items-center gap-1">
                <RiBook2Line size={16} />
                <span className="underline">Answer:</span>
              </div>
              <MemoizedReactMarkdown
                className="prose prose-sm max-w-full select-text break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-img:my-0"
                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                components={{
                  p: (props) => {
                    return (
                      <p
                        {...props}
                        className="mb-2 text-foreground last:mb-0"
                      />
                    );
                  },
                  a: ({ children, href, ...props }) => {
                    if (
                      String(children) === 'citation' &&
                      !isNil(href) &&
                      isNumber(parseInt(href, 10))
                    ) {
                      const index = parseInt(href, 10);
                      const source = data.sources[index - 1];

                      return <CitePopover source={source}>{href}</CitePopover>;
                    }

                    return (
                      <a
                        {...props}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    );
                  },
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');

                    return !isNil(match) ? (
                      <CodeBlock
                        language={match[1]!}
                        value={String(children).replace(/\n$/, '')}
                      />
                    ) : (
                      <code {...props} className={className}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {data.answer.replace(
                  /\[citation:(.*?)\]/g,
                  (_m, x) => `[citation](${x})`,
                )}
              </MemoizedReactMarkdown>
            </div>
            {!isEmpty(data.sources) && (
              <div>
                <div className="mb-2 flex items-center gap-1 underline">
                  <RiSearch2Line size={16} />
                  <span className="underline">Sources:</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {map(data.sources, (source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      title={source.title}
                      target="_blank"
                      className="cursor-pointer rounded-lg border bg-background px-3 py-2 shadow-sm"
                    >
                      <div className="mb-1 truncate text-sm font-semibold">
                        {source.title}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-xs">{source.url}</div>
                        <Image
                          src={source.iconUrl}
                          alt={new URL(source.url).host}
                          width={16}
                          height={16}
                          className="size-[12px]"
                        />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {!isEmpty(data.questions) && (
              <div>
                <div className="mb-2 flex items-center gap-1 underline">
                  <RiQuestionLine size={16} />
                  <span className="underline">Related Questions:</span>
                </div>
                <div className="flex flex-col items-start gap-2">
                  {data.questions.map((question, index) => (
                    <div
                      className="cursor-pointer rounded-lg border bg-background px-3 py-2 shadow-sm"
                      key={index}
                      onClick={() => {
                        setQuery(question);
                        requestSearch(question);
                      }}
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-background/60 p-4 backdrop-blur">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            type="search"
            placeholder={`Ask "${placeholder}"`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isPending}
          />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            disabled={isPending || isEmpty(query)}
          >
            {isPending ? (
              <RiLoader3Line size={18} className="animate-spin" />
            ) : (
              <RiArrowRightLine size={18} />
            )}
          </Button>
        </form>
        <div className="text-center text-xs text-muted-foreground">
          Peer AI can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  );
};

export default Search;
