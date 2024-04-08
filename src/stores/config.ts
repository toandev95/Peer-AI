import { isEqual, some } from 'lodash';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { StoreKey } from '@/lib/store-keys';
import type { IChatSetting } from '@/types';
import { SendKeys } from '@/types';

export type ConfigState = {
  emoji: string;
  sendKey: SendKeys;
  sendPreviewBubble: boolean;
  autoGenerateTitle: boolean;
  accessCode?: string;
  customApiKeys?: string;
  customBaseUrl?: string;
  models: IChatSetting['model'][];
  defaultModel?: IChatSetting['model'];
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  isMaximized: boolean;
  sidebarWidth: number;
  paginationSize: number;
  messageCompressionThreshold: number;
};

type ConfigAction = {
  updateConfig: (config: Partial<ConfigState & ConfigAction>) => void;
  clear: () => void;
};

const initialState: ConfigState = {
  emoji: '😁',
  sendKey: SendKeys.Enter,
  sendPreviewBubble: true,
  autoGenerateTitle: true,
  accessCode: '123456',
  customApiKeys: undefined,
  customBaseUrl: undefined,
  models: [],
  defaultModel: undefined,
  maxTokens: 2048,
  temperature: 0.3,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  isMaximized: false,
  sidebarWidth: 320,
  paginationSize: 8,
  messageCompressionThreshold: 2048,
};

export const useConfigStore = create<ConfigState & ConfigAction>()(
  persist(
    (set) => ({
      ...initialState,

      updateConfig: (config: Partial<ConfigState & ConfigAction>) =>
        set((state) => {
          const shouldUpdate = some(
            config,
            (value, key: keyof typeof state) => !isEqual(value, state[key]),
          );

          return shouldUpdate ? { ...state, ...config } : state;
        }),

      clear: () => set(initialState),
    }),
    {
      name: StoreKey.Config,
      version: 1.0,
    },
  ),
);
