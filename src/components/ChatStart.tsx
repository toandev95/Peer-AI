'use client';

import _, { isEmpty, isNil, map } from 'lodash';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RiChat3Line, RiSearch2Line } from 'react-icons/ri';

import { useBreakpoint } from '@/hooks';
import { useChatStore, useMaskStore } from '@/stores';
import type { IMask } from '@/types';

import { Button } from './UI/Button';
import { FadeIn } from './UI/FadeIn';

export const ChatStart = () => {
  const { t } = useTranslation();

  const router = useRouter();
  const pathname = usePathname();

  const chatStore = useChatStore();
  const maskStore = useMaskStore();

  const breakpoint = useBreakpoint();

  const chuckSize = useMemo(() => {
    switch (breakpoint) {
      case 'desktop':
      case 'laptopL':
        return 12;
      case 'laptop':
      case 'tablet':
        return 6;
      default:
        return 4;
    }
  }, [breakpoint]);

  const handleAddChat = (mask?: IMask) => {
    const newChat = chatStore.addChat(t('chatStart.newChat'));

    if (!isNil(mask)) {
      chatStore.assignMaskToChat(newChat.id, mask);
      chatStore.updateChatTitle(newChat.id, mask.title);
    }

    chatStore.setCurrentChatId(newChat.id);

    if (pathname !== '/') {
      router.push('/');
    }
  };

  const masks = useMemo(() => {
    const results: IMask[] = [];

    if (!isEmpty(maskStore.masks)) {
      while (results.length < 112) {
        // eslint-disable-next-line no-restricted-syntax
        for (const item of maskStore.masks) {
          if (results.length < 112) {
            results.push(item);
          } else {
            break;
          }
        }
      }
    }

    return results;
  }, [maskStore.masks]);

  return (
    <div className="flex h-full flex-col items-stretch overflow-hidden bg-background">
      <FadeIn
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{ opacity: 1, x: 0, y: 20 }}
        className="flex h-[65vh] min-h-[340px] flex-col content-center items-center justify-center pb-4 pt-6"
      >
        <div className="flex pb-6 text-2xl">
          <div className="-rotate-12 rounded-xl border bg-background px-3 py-5 shadow-sm">
            😎
          </div>
          <div className="z-10 -translate-y-2 rounded-xl border bg-background px-3 py-5 shadow-sm">
            🤖
          </div>
          <div className="rotate-12 rounded-xl border bg-background px-3 py-5 shadow-sm">
            🙀
          </div>
        </div>
        <div className="mb-2 text-2xl font-bold">{t('chatStart.title')}</div>
        <div className="text-base">{t('chatStart.subtitle')}</div>
        <div className="mt-10 flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/masks">
              <RiSearch2Line size={18} />
              <span className="ml-2">{t('chatStart.findMore')}</span>
            </Link>
          </Button>
          <Button variant="default" onClick={() => handleAddChat()}>
            <RiChat3Line size={18} />
            <span className="ml-2">{t('chatStart.justStart')}</span>
          </Button>
        </div>
      </FadeIn>
      {!isEmpty(masks) && (
        <FadeIn
          className="grow overflow-y-auto overflow-x-hidden scrollbar scrollbar-thumb-accent-foreground/30 scrollbar-thumb-rounded-full scrollbar-w-[3px]"
          style={{
            maskImage: `linear-gradient(180deg, transparent, #000000, transparent)`,
            WebkitMaskImage: `linear-gradient(180deg, transparent, #000000, transparent)`,
          }}
        >
          <div className="-mx-20 flex flex-col items-center gap-3 p-4">
            {_(masks)
              .take(chuckSize * 10)
              .chunk(chuckSize)
              .map((chunks, k) => (
                <div
                  key={`mc_${k.toString()}`}
                  className="flex gap-3 [&:nth-child(odd)]:ml-24"
                >
                  {map(chunks, (mask, i) => (
                    <button
                      key={`mc_${k.toString()}_${i.toString()}`}
                      type="button"
                      className="flex w-[160px] cursor-pointer items-center rounded-xl border px-3 py-2.5 shadow-sm transition-all hover:scale-110 hover:border-primary hover:shadow-lg"
                      onClick={() => handleAddChat(mask)}
                    >
                      <div className="rounded-lg border bg-background px-1.5 py-0.5">
                        {mask.emoji}
                      </div>
                      <span className="ml-2 grow truncate text-center">
                        {mask.title}
                      </span>
                    </button>
                  ))}
                </div>
              ))
              .value()}
          </div>
        </FadeIn>
      )}
    </div>
  );
};
