'use client';

import { nanoid } from 'ai';
import _, { capitalize, filter, isEmpty, isNil, map, merge } from 'lodash';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RiAddCircleLine,
  RiChat3Line,
  RiCloseCircleLine,
  RiCloseLine,
  RiDeleteBin4Line,
} from 'react-icons/ri';
import TextareaAutosize from 'react-textarea-autosize';

import { uuid } from '@/lib/helpers';
import { useChatStore, useMaskStore } from '@/stores';
import type { IChatMessage, IMask } from '@/types';

import { AppBar, AppBarIconButton } from './AppBar';
import { EmojiPickerButton } from './EmojiPickerButton';
import { Button } from './UI/Button';
import { Card } from './UI/Card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './UI/Dialog';
import { FadeIn } from './UI/FadeIn';
import { Input } from './UI/Input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './UI/Select';

type AddNewMaskFormData = Pick<IMask, 'title' | 'emoji'> & {
  messages: Pick<IChatMessage, 'id' | 'role' | 'content' | 'createdAt'>[];
};

const AddNewMaskButton = () => {
  const maskStore = useMaskStore();

  const [open, setOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState<AddNewMaskFormData>({
    title: '',
    emoji: '👌',
    messages: [],
  });

  const handleAddNewMessage = () => {
    setFormData({
      ...formData,
      messages: merge(formData.messages, [
        {
          id: nanoid(),
          role: 'system',
          content: '',
          createdAt: new Date(),
        },
      ]),
    });
  };

  const handleSubmit = () => {
    if (
      isEmpty(formData.title) ||
      isEmpty(formData.emoji) ||
      isEmpty(formData.messages)
    ) {
      return;
    }

    maskStore.addMask({
      ...formData,
      id: uuid(),
      createdAt: new Date().toISOString(),
      builtIn: false,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <AppBarIconButton key={1} IconComponent={RiAddCircleLine} />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Mask</DialogTitle>
          <DialogDescription>
            Create a new mask to use in your conversations.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex w-full gap-3">
            <EmojiPickerButton
              value={formData.emoji}
              onChange={(emoji) => {
                setFormData({ ...formData, emoji });
              }}
            />
            <Input
              value={formData.title}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  title: e.target.value,
                });
              }}
              placeholder="Title"
              maxLength={50}
            />
          </div>
          <div className="flex w-full flex-col gap-2">
            <div className="font-semibold">Messages:</div>
            {map(formData.messages, (message, index) => (
              <div key={index} className="flex gap-3">
                <Select
                  value={message.role}
                  onValueChange={(role: IChatMessage['role']) => {
                    setFormData({
                      ...formData,
                      messages: map(formData.messages, (m) =>
                        m.id === message.id ? { ...m, role } : m,
                      ),
                    });
                  }}
                >
                  <SelectTrigger className="w-[180px] truncate">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {map(['system', 'assistant', 'user']).map(
                        (role, index) => (
                          <SelectItem key={index} value={role}>
                            {capitalize(role)}
                          </SelectItem>
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <TextareaAutosize
                  value={message.content}
                  placeholder="Message"
                  className="block w-full resize-none overscroll-contain rounded-lg border bg-background px-3 py-2.5 pr-[140px] outline-none scrollbar scrollbar-thumb-accent-foreground/30 scrollbar-thumb-rounded-full scrollbar-w-[3px] placeholder:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  spellCheck={false}
                  minRows={1}
                  maxRows={4}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      messages: map(formData.messages, (m) => {
                        return m.id === message.id
                          ? { ...m, content: e.target.value }
                          : m;
                      }),
                    });
                  }}
                />
                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        messages: filter(
                          formData.messages,
                          (m) => m.id === message.id,
                        ),
                      });
                    }}
                  >
                    <RiCloseCircleLine size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {formData.messages.length <= 3 && (
            <Button variant="outline" onClick={() => handleAddNewMessage()}>
              Add Message
            </Button>
          )}
          <div className="text-end">
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MaskItem = ({
  mask,
  onClick,
  onDelete,
}: {
  mask: IMask;
  onClick: () => void;
  onDelete: () => void;
}) => {
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
        {!mask.builtIn && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <RiDeleteBin4Line size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default function Masks() {
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

    router.push(`/conversations/${newChat.id}`);
  };

  return (
    <>
      <AppBar
        title={t('masks.title')}
        subtitle={t('masks.subtitle')}
        actions={[
          <AddNewMaskButton key={1} />,
          <AppBarIconButton
            key={2}
            IconComponent={RiCloseLine}
            onClick={() => router.back()}
          />,
        ]}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <FadeIn>
          <Card>
            <div className="divide-y">
              {_(maskStore.masks)
                .orderBy((mask) => mask.createdAt, 'desc')
                .map((mask) => (
                  <MaskItem
                    key={mask.id}
                    mask={mask}
                    onClick={() => handleAddChat(mask)}
                    onDelete={() => maskStore.deleteMask(mask.id)}
                  />
                ))
                .value()}
            </div>
          </Card>
        </FadeIn>
      </div>
    </>
  );
}
