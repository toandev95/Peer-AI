import TeX from '@matejmazur/react-katex';
import { isNil } from 'lodash';
import Markdown from 'markdown-to-jsx';
import type { ReactNode } from 'react';
import React from 'react';

import { CodeBlock } from './UI/CodeBlock';

export const SyntaxHighlightedCode = ({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) => {
  const match = /lang-(\w+)/.exec(className);

  if (isNil(match)) {
    return <code className={className}>{children}</code>;
  }

  return (
    <CodeBlock
      language={match[1]! || ''}
      value={String(children).replace(/\n$/, '')}
    />
  );
};

export const CustomizedMarkdown = ({ children }: { children: ReactNode }) => {
  return (
    <Markdown
      options={{
        overrides: {
          p: {
            component: 'p',
            props: {
              className: 'text-foreground mb-2 first:mt-0 last:mb-0',
            },
          },
          a: {
            component: 'a',
            props: {
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          },
          code: SyntaxHighlightedCode,
        },
        renderRule(next, node, _renderChildren, state) {
          if (node.type === '3' && node.lang === 'latex') {
            return (
              <TeX as="div" key={state.key}>{String.raw`${node.text}`}</TeX>
            );
          }

          return next();
        },
      }}
    >
      {children as string}
    </Markdown>
  );
};
