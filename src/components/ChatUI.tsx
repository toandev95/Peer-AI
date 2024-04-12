'use client';

import { isNil } from 'lodash';

import { useChatStore } from '@/stores';

import { ChatStart } from './ChatStart';
import { ChatWindow } from './ChatWindow';

export const ChatUI = () => {
  const currentChatId = useChatStore((state) => state.currentChatId);
  const currentChat = useChatStore((state) =>
    state.getChatById(currentChatId || ''),
  );

  if (isNil(currentChat)) {
    return <ChatStart />;
  }

  return <ChatWindow id={currentChat.id} />;
};
