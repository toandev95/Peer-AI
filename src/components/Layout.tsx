'use client';

import 'moment/locale/vi';

import { useQuery } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { has, isArray, isNil, map } from 'lodash';
import moment from 'moment';
import type { ModelsPage } from 'openai/resources/models.mjs';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import i18n from '@/i18n';
import { env } from '@/lib/env.mjs';
import { cn } from '@/lib/helpers';
import { useConfigStore, useMaskStore, usePromptStore } from '@/stores';
import type { IChatSetting, IMask, IPrompt } from '@/types';

import { Sidebar } from './Sidebar';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { NEXT_PUBLIC_APP_URL } = env;

  const configStore = useConfigStore();

  const updateConfig = useConfigStore((state) => state.updateConfig);
  const updateBuiltInMasks = useMaskStore((state) => state.updateBuiltInMasks);
  const updateBuiltInPrompts = usePromptStore(
    (state) => state.updateBuiltInPrompts,
  );

  i18n.on('languageChanged', (lng) => {
    moment.locale(lng);
  });

  const { data: masks } = useQuery({
    queryKey: ['masks'],
    queryFn: async () => {
      const response = await fetch('/masks.json');
      return response.json() as Promise<IMask[]>;
    },
  });

  const { data: prompts } = useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      const response = await fetch('/prompts.json');
      return response.json() as Promise<IPrompt[]>;
    },
  });

  const { data: models, refetch } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await fetch(`${NEXT_PUBLIC_APP_URL || ''}/api/models`, {
        headers: {
          'Content-Type': 'application/json',
          ...(!isNil(configStore.customApiKey)
            ? { 'X-Custom-Api-Key': configStore.customApiKey }
            : {}),
          ...(!isNil(configStore.customBaseUrl)
            ? { 'X-Custom-Base-Url': configStore.customBaseUrl }
            : {}),
        },
      });
      return response.json() as Promise<ModelsPage>;
    },
  });

  const isMaximized = useMemo(
    () => configStore.isMaximized || has(window, '__TAURI_INTERNALS__'),
    [configStore.isMaximized],
  );

  useEffect(() => {
    refetch();
  }, [configStore.customApiKey, configStore.customBaseUrl, refetch]);

  useEffect(() => {
    if (!isNil(models) && isArray(models.data)) {
      updateConfig({
        models: map(
          models.data,
          (model) => model.id,
        ) as IChatSetting['model'][],
      });
    }
  }, [models, updateConfig]);

  useEffect(() => {
    updateConfig({
      defaultModel: configStore.defaultModel || configStore.models[0],
    });
  }, [configStore.defaultModel, configStore.models, updateConfig]);

  useEffect(() => {
    if (!isNil(masks) && isArray(masks)) {
      updateBuiltInMasks(masks);
    }
  }, [masks, updateBuiltInMasks]);

  useEffect(() => {
    if (!isNil(prompts) && isArray(prompts)) {
      updateBuiltInPrompts(prompts);
    }
  }, [prompts, updateBuiltInPrompts]);

  return (
    <>
      <div className="min-h-screen">
        <div className="h-screen lg:flex lg:items-center lg:justify-center">
          <div
            className={cn(
              'flex overflow-hidden transition-all w-full h-full',
              !isMaximized &&
                'lg:h-[90vh] lg:max-h-[850px] lg:min-h-[370px] lg:w-[90vw] lg:min-w-[680px] lg:max-w-[1400px] lg:rounded-2xl lg:border lg:shadow-[50px_50px_100px_10px_rgba(0,0,0,.1)]',
            )}
          >
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-y-auto bg-foreground/[.03] scrollbar scrollbar-thumb-accent-foreground/30 scrollbar-thumb-rounded-full scrollbar-w-[3px]">
              {children}
            </div>
          </div>
        </div>
      </div>
      {!has(window, '__TAURI_INTERNALS__') && <Analytics />}
    </>
  );
};
