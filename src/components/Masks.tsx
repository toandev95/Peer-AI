'use client';

import { isNil, map } from 'lodash';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { RiChat3Line, RiCloseLine } from 'react-icons/ri';

import { useChatStore, useMaskStore } from '@/stores';
import type { IMask } from '@/types';

import { AppBar, AppBarIconButton } from './AppBar';
import { Button } from './UI/Button';
import { Card } from './UI/Card';
import { FadeIn } from './UI/FadeIn';

const MaskItem = ({ mask, onClick }: { mask: IMask; onClick: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="rounded-lg border bg-background px-1.5 py-0.5">
        {mask.emoji}
      </div>
      <div className="flex grow flex-col gap-0.5">
        <div className="font-medium">{mask.title}</div>
        <div className="text-xs text-muted-foreground">
          {t('masks.totalPrompts', { count: mask.messages.length })}
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={onClick}>
          <RiChat3Line size={16} />
          <span className="ml-1.5">{t('masks.chat')}</span>
        </Button>
      </div>
    </div>
  );
};

const Masks = () => {
  const { t } = useTranslation();

  const router = useRouter();

  const chatStore = useChatStore();
  const maskStore = useMaskStore();

  const handleAddChat = (mask?: IMask) => {
    const newChat = chatStore.addChat(t('masks.newChat'));

    if (!isNil(mask)) {
      chatStore.assignMaskToChat(newChat.id, mask);
      chatStore.updateChatTitle(newChat.id, mask.title);
    }

    router.push(`/${newChat.id}`);
  };

  return (
    <>
      <AppBar
        title={t('masks.title')}
        subtitle={t('masks.subtitle')}
        actions={
          <AppBarIconButton
            key={1}
            IconComponent={RiCloseLine}
            onClick={() => router.back()}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <FadeIn>
          <Card>
            <div className="divide-y">
              {map(maskStore.masks, (mask) => (
                <MaskItem
                  key={mask.id}
                  mask={mask}
                  onClick={() => handleAddChat(mask)}
                />
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>
    </>
  );
};

export default Masks;
