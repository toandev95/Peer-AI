import { isNil } from 'lodash';
import type { FC } from 'react';
import { memo } from 'react';
import type { Options } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { CodeBlock } from './UI/CodeBlock';

export const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);

export const CustomizedReactMarkdown = (props: Readonly<Readonly<Options>>) => {
  return (
    <MemoizedReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
      components={{
        p: ({ children }) => {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        a: ({ children, ...props }) => {
          return (
            <a {...props} target="_blank" rel="noopener noreferrer">
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
      {...props}
    />
  );
};
