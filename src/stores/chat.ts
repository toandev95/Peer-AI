import { filter, find, head, isNil, map } from 'lodash';
import moment from 'moment';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { uuid } from '@/lib/helpers';
import { storage } from '@/lib/idb-storage';
import { StoreKey } from '@/lib/store-keys';
import type { IChat, IChatMessage, IChatSetting, IMask } from '@/types';

import { useConfigStore } from './config';

type ChatState = {
  currentChatId?: string;
  chats: IChat[];
};

type ChatAction = {
  setCurrentChatId: (id?: string) => void;
  updateChats: (chats: IChat[]) => void;
  addChat: (title: string) => IChat;
  getChatById: (id: string) => IChat;
  updateChatTitle: (id: string, title: string) => void;
  updateChatInput: (id: string, input?: string) => void;
  updateChatSettings: (id: string, settings: Partial<IChatSetting>) => void;
  updateChatSummary: (id: string, text?: string) => void;
  removeChat: (id: string) => void;
  syncMessages: (id: string, messages: IChatMessage[]) => void;
  addMessageToChat: (id: string, message: IChatMessage) => void;
  removeMessageFromChat: (id: string, messageId: string) => void;
  assignMaskToChat: (id: string, mask: IMask) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState & ChatAction>()(
  persist(
    (set, get) => ({
      chats: [],

      setCurrentChatId: (id) => set({ currentChatId: id }),

      updateChats: (chats) => set({ chats }),

      getChatById: (id) => find(get().chats, (chat) => chat.id === id) as IChat,

      addChat: (title) => {
        const config = useConfigStore.getState();

        set((state) => ({
          chats: [
            {
              id: uuid(),
              title,
              messages: [],
              settings: {
                model: config.defaultModel,
                maxTokens: config.maxTokens,
                temperature: config.temperature,
                topP: config.topP,
                frequencyPenalty: config.frequencyPenalty,
                presencePenalty: config.presencePenalty,
              },
              createdAt: moment().toISOString(),
            },
            ...state.chats,
          ],
        }));

        return head(get().chats) as IChat;
      },

      updateChatTitle: (id, title) =>
        set((state) => ({
          chats: map(state.chats, (chat) =>
            chat.id === id
              ? {
                  ...chat,
                  title,
                  isTitleGenerated: true,
                }
              : chat,
          ),
        })),

      updateChatInput: (id, input) =>
        set((state) => ({
          chats: map(state.chats, (chat) =>
            chat.id === id ? { ...chat, input } : chat,
          ),
        })),

      updateChatSettings: (id, newSettings: Partial<IChatSetting>) =>
        set((state) => ({
          chats: map(state.chats, (chat) => {
            if (chat.id === id) {
              const { settings } = chat;

              return {
                ...chat,
                settings: {
                  ...settings,
                  ...newSettings,
                },
              };
            }

            return chat;
          }),
        })),

      updateChatSummary: (id, text) =>
        set((state) => ({
          chats: map(state.chats, (chat) =>
            chat.id === id
              ? {
                  ...chat,
                  contextSummary: text,
                }
              : chat,
          ),
        })),

      removeChat: (id) =>
        set((state) => ({
          chats: filter(state.chats, (chat) => chat.id !== id),
        })),

      syncMessages: (id, messages) =>
        set((state) => ({
          chats: map(state.chats, (chat) =>
            chat.id === id ? { ...chat, messages } : chat,
          ),
        })),

      addMessageToChat: (id, message) =>
        set((state) => ({
          chats: map(state.chats, (chat) =>
            chat.id === id
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                }
              : chat,
          ),
        })),

      removeMessageFromChat: (id, messageId) =>
        set((state) => ({
          chats: map(state.chats, (chat) =>
            chat.id === id
              ? {
                  ...chat,
                  messages: filter(
                    chat.messages,
                    (msg) => messageId === msg.id,
                  ),
                }
              : chat,
          ),
        })),

      assignMaskToChat: (id, mask) =>
        set((state) => ({
          chats: map(state.chats, (chat) =>
            chat.id === id && isNil(chat.mask)
              ? {
                  ...chat,
                  messages: map(mask.messages, (message) => ({
                    id: uuid(),
                    role: message.role,
                    content: message.content,
                    createdAt: message.createdAt,
                  })),
                  mask,
                }
              : chat,
          ),
        })),

      clear: () => set({ chats: [] }),
    }),
    {
      name: StoreKey.Chat,
      version: 1.0,
      storage: createJSONStorage(() => storage),
    },
  ),
);
