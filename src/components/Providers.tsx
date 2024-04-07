'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from '@/i18n';
import { StoreKey } from '@/lib/store-keys';

import NoSSR from './NoSSR';
import { ConfirmDialogProvider } from './Providers/ConfirmDialogProvider';
import { TooltipProvider } from './UI/Tooltip';

const queryClient = new QueryClient();

export const Providers = ({ children }: { children: ReactNode }) => (
  <NoSSR>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n} defaultNS="translation">
        <ThemeProvider
          attribute="class"
          storageKey={StoreKey.Theme}
          defaultTheme="system"
          enableSystem
        >
          <ConfirmDialogProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ConfirmDialogProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  </NoSSR>
);
