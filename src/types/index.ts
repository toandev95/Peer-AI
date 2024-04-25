import type { Message } from 'ai';

export enum SendKeys {
  Enter = 'Enter',
  CtrlEnter = 'Ctrl + Enter',
}

export type IChatMessage = Message & {
  role: 'system' | 'assistant' | 'user';
};

export type IChatSetting = {
  model?: 'gpt-4' | 'gpt-3.5-turbo';
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  summarizedIds?: IChatMessage['id'][];
};

export type IPrompt = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  builtIn: boolean;
};

export type IMask = {
  id: string;
  emoji: string;
  title: string;
  messages: IChatMessage[] & { id?: string };
  createdAt: string;
  builtIn: boolean;
};

export type IChat = {
  id: string;
  title: string;
  createdAt: string;
  messages: IChatMessage[];
  settings: IChatSetting;
  input?: string;
  mask?: IMask;
  isTitleGenerated?: boolean;
  contextSummary?: string;
};

export type ISearchResult = {
  url: string;
  iconUrl: string;
  title: string;
  description: string;
};
