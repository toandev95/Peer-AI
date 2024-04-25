'use client';

import { includes } from 'lodash';
import type { FC } from 'react';
import { memo } from 'react';
import { browserName } from 'react-device-detect';
import { RiCheckLine, RiClipboardLine } from 'react-icons/ri';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { useCopyToClipboard } from '@/hooks';

export const CodeBlock: FC<{ language: string; value: string }> = memo(
  ({ language, value }) => {
    const { isCopied, copyToClipboard } = useCopyToClipboard();

    const showLineNumbers = !includes(['Safari', 'WebKit'], browserName);

    return (
      <div className="relative -mx-3 -my-2 text-sm">
        <div className="flex select-none items-center justify-between px-3 py-1.5">
          <span className="text-xs lowercase">{language}</span>
          <button
            type="submit"
            className="p-0.5"
            onClick={() => copyToClipboard(value)}
          >
            {isCopied ? (
              <RiCheckLine size={14} />
            ) : (
              <RiClipboardLine size={14} />
            )}
          </button>
        </div>
        <SyntaxHighlighter
          language={language}
          showLineNumbers={showLineNumbers}
          PreTag="div"
          customStyle={{ margin: 0, width: '100%' }}
          style={coldarkDark}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    );
  },
);
CodeBlock.displayName = 'CodeBlock';
