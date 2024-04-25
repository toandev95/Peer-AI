'use client';

import { isEmpty, isNil } from 'lodash';
import moment from 'moment';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { IoTrashOutline } from 'react-icons/io5';
import {
  RiCheckLine,
  RiClipboardLine,
  RiEdit2Line,
  RiRefreshLine,
  RiVolumeOffVibrateLine,
  RiVolumeUpLine,
} from 'react-icons/ri';
import { BeatLoader } from 'react-spinners';
import TextareaAutosize from 'react-textarea-autosize';
import { useTts } from 'tts-react';

import { useCopyToClipboard } from '@/hooks';
import i18n from '@/i18n';
import { cn } from '@/lib/helpers';
import type { IChatMessage } from '@/types';

import { CustomizedMarkdown } from './Markdown';
import { Button } from './UI/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './UI/Dialog';
import { FadeIn } from './UI/FadeIn';

const ChatBubbleButton = ({
  IconComponent,
  size = 14,
  className,
  onClick,
}: {
  IconComponent: IconType;
  size?: number;
  className?: string;
  onClick?: () => void;
}) => (
  <Button
    variant="outline"
    size="icon"
    className={cn('h-6 w-8 text-muted-foreground shadow-none', className)}
    onClick={onClick}
  >
    <IconComponent size={size} />
  </Button>
);

const EditChatMessageButton = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (newContent: string) => void;
}) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState<boolean>(false);
  const [newContent, setNewContent] = useState<string>(value);

  const handleSubmit = (ev: ChangeEvent<HTMLFormElement>) => {
    ev.preventDefault();

    onChange(newContent);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <ChatBubbleButton IconComponent={RiEdit2Line} />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('chatWindow.editMessageContent.title')}</DialogTitle>
          <DialogDescription>
            {t('chatWindow.editMessageContent.subtitle')}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col items-end gap-4" onSubmit={handleSubmit}>
          <TextareaAutosize
            defaultValue={newContent}
            placeholder={t('chatWindow.editMessageContent.placeholder')}
            className="block w-full resize-none overscroll-contain rounded-lg border bg-background px-3 py-2.5 outline-none scrollbar scrollbar-thumb-accent-foreground/30 scrollbar-thumb-rounded-full scrollbar-w-[3px] placeholder:text-foreground"
            spellCheck={false}
            minRows={3}
            maxRows={6}
            onChange={(ev) => setNewContent(ev.currentTarget.value.trim())}
          />
          <Button
            type="submit"
            disabled={isEmpty(newContent)}
            onClick={() => onChange(newContent)}
          >
            {t('chatWindow.editMessageContent.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ChatBubble = ({
  emoji,
  message,
  allowCopy = true,
  allowTextToSpeech,
  onChange,
  onRegenerate,
  onRemove,
}: {
  emoji: string;
  message: IChatMessage;
  allowCopy?: boolean;
  allowTextToSpeech?: boolean;
  onChange?: (newContent: string) => void;
  onRegenerate?: () => void;
  onRemove?: () => void;
}) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const { state, play, stop } = useTts({
    children: message.content,
    markTextAsSpoken: true,
    lang: i18n.language,
  });

  return (
    <FadeIn
      className={cn(
        'group flex-col flex',
        message.role === 'user' ? 'items-end' : 'items-start',
      )}
    >
      <div
        className={cn(
          'mb-1.5 flex items-end gap-2',
          message.role === 'user' && 'flex-row-reverse',
        )}
      >
        <div className="rounded-lg border bg-background px-1.5 py-0.5">
          {emoji}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!isNil(onChange) && message.role === 'user' && (
            <EditChatMessageButton
              value={message.content}
              onChange={onChange}
            />
          )}
          {!isNil(onRegenerate) && message.role !== 'system' && (
            <ChatBubbleButton
              IconComponent={RiRefreshLine}
              onClick={onRegenerate}
            />
          )}
          {allowCopy && (
            <ChatBubbleButton
              IconComponent={isCopied ? RiCheckLine : RiClipboardLine}
              size={14}
              onClick={() => copyToClipboard(message.content)}
            />
          )}
          {allowTextToSpeech && (
            <ChatBubbleButton
              IconComponent={
                state.isPlaying ? RiVolumeOffVibrateLine : RiVolumeUpLine
              }
              onClick={() => (state.isPlaying ? stop() : play())}
            />
          )}
          {!isNil(onRemove) && message.role !== 'system' && (
            <ChatBubbleButton
              IconComponent={IoTrashOutline}
              onClick={onRemove}
            />
          )}
        </div>
      </div>
      <div className="max-w-[75%]">
        <div
          className={cn(
            'rounded-lg bg-background px-3 py-2.5 shadow border border-transparent dark:border-inherit transition-colors',
            message.role === 'user' && 'bg-primary/[.08] dark:bg-primary/5',
          )}
        >
          {message.role === 'assistant' && isEmpty(message.content) && (
            <BeatLoader color="#3c83f6" size={6} />
          )}
          {!isEmpty(message.content) && (
            <div className="prose prose-sm select-text break-words dark:prose-invert prose-p:leading-relaxed prose-img:my-0">
              <CustomizedMarkdown>{message.content}</CustomizedMarkdown>
            </div>
          )}
        </div>
      </div>
      {message.createdAt && (
        <div className="mt-1 text-xs text-muted-foreground">
          {moment(message.createdAt).format('lll')}
        </div>
      )}
    </FadeIn>
  );
};
