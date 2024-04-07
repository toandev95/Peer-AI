'use client';

import { isNil } from 'lodash';

import { useChatStore } from '@/stores';

import { ChatStart } from './ChatStart';
import { ChatWindow } from './ChatWindow';

export const ChatUI = ({ id }: { id?: string }) => {
  const currentChat = useChatStore((state) => state.getChatById(id || ''));

  if (isNil(id) || isNil(currentChat)) {
    return <ChatStart />;
  }

  return <ChatWindow id={currentChat.id} />;
};
