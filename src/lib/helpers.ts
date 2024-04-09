import type { ClassValue } from 'clsx';
import clsx from 'clsx';
import { encodeChat } from 'gpt-tokenizer';
import type { ModelName } from 'gpt-tokenizer/mapping';
import { isEmpty, map } from 'lodash';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

import type { IChatMessage } from '@/types';

export const uuid = uuidv4;

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const emptyToUndefined = <T>(value?: T): T | undefined =>
  isEmpty(value) ? undefined : value;

export const truncate = (str: string, maxLength: number): string => {
  if (!str || maxLength < 1 || str.length <= maxLength) {
    return str;
  }

  if (maxLength === 1) {
    return `${str.charAt(0)}...`;
  }

  const midpoint = Math.floor(str.length / 2);
  const charsToRemove = str.length - maxLength - 3;
  const leftRemove = Math.ceil(charsToRemove / 2);
  const rightRemove = charsToRemove - leftRemove;

  const leftStr = str.slice(0, midpoint - leftRemove);
  const rightStr = str.slice(midpoint + rightRemove);

  return `${leftStr}...${rightStr}`;
};

export const getModelNameByModelID = (id: string): string => {
  switch (id) {
    case 'gpt-4':
      return 'GPT-4';

    case 'gpt-4-0314':
      return 'GPT-4 (0314)';

    case 'gpt-4-0613':
      return 'GPT-4 (0613)';

    case 'gpt-3.5-turbo-0613':
      return 'GPT-3.5 Turbo (0613)';

    case 'gpt-3.5-turbo-16k-0613':
      return 'GPT-3.5 Turbo (0613, 16k)';

    case 'gpt-3.5-turbo-0301':
      return 'GPT-3.5 Turbo (0301)';

    case 'gpt-3.5-turbo':
      return 'GPT-3.5 Turbo';

    default: {
      if (id.includes('/')) {
        return id.split('/').pop() as string;
      }

      return id.toUpperCase();
    }
  }
};

export const tokenizer = (
  messages: IChatMessage[],
  modelName: string = 'gpt-3.5-turbo',
): number => {
  const tokens = encodeChat(
    map(messages || [], (message) => ({
      role: message.role as 'system' | 'assistant' | 'user',
      content: message.content,
    })),
    modelName as ModelName,
  );

  return tokens.length;
};
