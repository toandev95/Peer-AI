'use client';

import { useMutation } from '@tanstack/react-query';
import { useChat } from 'ai/react';
import { encodeChat } from 'gpt-tokenizer';
import _, {
  cloneDeep,
  filter,
  find,
  has,
  includes,
  isEmpty,
  isEqual,
  isNil,
  last,
  lastIndexOf,
  map,
  startsWith,
  takeWhile,
} from 'lodash';
import moment from 'moment';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RiArrowDownLine,
  RiFullscreenExitLine,
  RiFullscreenLine,
  RiLoader3Line,
  RiMagicLine,
  RiPencilLine,
  RiSendPlane2Line,
  RiSettings4Line,
} from 'react-icons/ri';
import { VscClearAll } from 'react-icons/vsc';
import TextareaAutosize from 'react-textarea-autosize';
import { useDebounce, useEffectOnce, useToggle } from 'react-use';

import { useChatScrollAnchor, useEnterSubmit } from '@/hooks';
import i18n from '@/i18n';
import { env } from '@/lib/env.mjs';
import { getModelNameByModelID, uuid } from '@/lib/helpers';
import { useChatStore, useConfigStore, usePromptStore } from '@/stores';
import type { IChat, IChatMessage, IChatSetting, IPrompt } from '@/types';

import { AppBar, AppBarIconButton } from './AppBar';
import { ChatBubble } from './ChatBubble';
import { ToolbarIconButton, ToolbarSettingItem } from './ChatToolbar';
import { useConfirmDialog } from './Providers/ConfirmDialogProvider';
import { Button } from './UI/Button';
import { ConfirmDialog } from './UI/ConfirmDialog';
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
import { SliderInput } from './UI/Slider';

const GENERATE_TITLE_PROMPT = `Based on our conversation, create a 2-10 word title that describes the main topic of the conversation. For example 'OpenAI Docs'.
The title SHOULD NOT contain introductions, punctuation, quotation marks, periods, symbols, or additional text.`;
const SUMMARIZE_CONTEXT_PROMPT = `Summarize the provided conversation lines in about 200 words, retaining the main points of the conversation and the user's requests.
It will be used as context for future conversation lines.`;

export const AppBarEditTitleButton = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (newTitle: string) => void;
}) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>(value);

  const handleSubmit = (ev: ChangeEvent<HTMLFormElement>) => {
    ev.preventDefault();

    onChange(newTitle);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <AppBarIconButton IconComponent={RiPencilLine} />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('chatWindow.editTitle.title')}</DialogTitle>
          <DialogDescription>
            {t('chatWindow.editTitle.subtitle')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col items-end gap-4">
          <Input
            type="text"
            defaultValue={value}
            placeholder={t('chatWindow.editTitle.placeholder')}
            onChange={(ev) => setNewTitle(ev.currentTarget.value.trim())}
          />
          <Button
            type="submit"
            disabled={isEmpty(newTitle)}
            onClick={() => onChange(newTitle)}
          >
            {t('chatWindow.editTitle.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ChatWindow = ({ id }: { id: IChat['id'] }) => {
  const { NEXT_PUBLIC_APP_URL } = env;

  const { t } = useTranslation();

  const confirm = useConfirmDialog(ConfirmDialog);

  const promptStore = usePromptStore();
  const configStore = useConfigStore();

  const getChatById = useChatStore((state) => state.getChatById);
  const updateChatTitle = useChatStore((state) => state.updateChatTitle);
  const updateChatInput = useChatStore((state) => state.updateChatInput);
  const updateChatSettings = useChatStore((state) => state.updateChatSettings);
  const updateChatSummary = useChatStore((state) => state.updateChatSummary);
  const syncMessages = useChatStore((state) => state.syncMessages);

  const currentChat = getChatById(id);

  const [endIndex, setEndIndex] = useState<number>(configStore.paginationSize);
  const [isShowToolbarPrompt, setIsShowToolbarPrompt] = useToggle(false);

  const { formRef, onKeyDown } = useEnterSubmit(configStore.sendKey);

  const { mutateAsync: requestChat } = useMutation({
    mutationFn: async (messages: Pick<IChatMessage, 'role' | 'content'>[]) => {
      const response = await fetch(`${NEXT_PUBLIC_APP_URL || ''}/api/chat`, {
        method: 'POST',
        body: JSON.stringify({
          messages,
          stream: false,
          language: i18n.language,
        }),
        headers: {
          'Content-Type': 'text/plain',
          ...(!isNil(configStore.customApiKey)
            ? { 'X-Custom-Api-Key': configStore.customApiKey }
            : {}),
          ...(!isNil(configStore.customBaseUrl)
            ? { 'X-Custom-Base-Url': configStore.customBaseUrl }
            : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Something went wrong!');
      }

      return response.text().then((text) => text.trim());
    },
  });

  const cleanedMessages = useMemo(() => {
    return _(currentChat.messages)
      .orderBy((message) => moment(message.createdAt).valueOf(), 'desc')
      .value();
  }, [currentChat.messages]);

  const summarizedMessages = useMemo(() => {
    const summarizedIds = currentChat.settings.summarizedIds || [];

    return filter(
      currentChat.messages,
      (message) => !includes(summarizedIds, message.id),
    );
  }, [currentChat.messages, currentChat.settings.summarizedIds]);

  const paginatedMessages = useMemo(() => {
    return _(cleanedMessages)
      .slice(0, endIndex + configStore.paginationSize)
      .value();
  }, [cleanedMessages, configStore.paginationSize, endIndex]);

  const handleGenerateTitle = async () => {
    if (!configStore.autoGenerateTitle) {
      return;
    }

    const { isTitleGenerated, messages } = getChatById(id);
    if (isTitleGenerated || messages.length <= 2) {
      return;
    }

    const response = await requestChat([
      ...messages,
      {
        role: 'user',
        content: GENERATE_TITLE_PROMPT,
      },
    ]);
    if (isEmpty(response)) {
      return;
    }

    updateChatTitle(id, response);
  };

  const handleGenerateSummary = async () => {
    const { messages, contextSummary, settings } = getChatById(id);

    const filteredMessages = filter(
      messages,
      (message) => !includes(settings.summarizedIds, message.id),
    );

    const encodeModel = startsWith(settings.model, 'gpt-')
      ? settings.model
      : 'gpt-3.5-turbo';
    const tokens = encodeChat(filteredMessages, encodeModel);
    if (tokens.length < configStore.messageCompressionThreshold) {
      return;
    }

    const response = await requestChat([
      ...(!isNil(contextSummary)
        ? [
            {
              role: 'system' as IChatMessage['role'],
              content: contextSummary as string,
            },
          ]
        : []),
      ...map(filteredMessages, ({ role, content }) => ({ role, content })),
      {
        role: 'user',
        content: SUMMARIZE_CONTEXT_PROMPT,
      },
    ]);
    if (isEmpty(response)) {
      return;
    }

    updateChatSummary(id, response);
    updateChatSettings(id, {
      summarizedIds: [
        ...(settings.summarizedIds || []),
        ..._(filteredMessages)
          .filter((message) => message.role !== 'system')
          .map((message) => message.id)
          .slice(0, -2)
          .value(),
      ],
    });
  };

  const {
    isLoading,
    input,
    setInput,
    messages,
    setMessages,
    handleInputChange: onInputChange,
    handleSubmit: onSubmit,
    stop,
    reload,
    error,
  } = useChat({
    api: `${NEXT_PUBLIC_APP_URL || ''}/api/chat`,
    id: currentChat.id,
    initialInput: currentChat.input,
    initialMessages: currentChat.messages,
    body: {
      // ...omit(currentChat.settings, 'summarizedIds'),
      messages: [
        ...(!isNil(currentChat.contextSummary)
          ? [
              {
                role: 'system',
                content: currentChat.contextSummary,
              },
            ]
          : []),
        ...map(summarizedMessages, ({ role, content }) => ({ role, content })),
        ...(!isNil(currentChat.input) && !isEmpty(currentChat.input)
          ? [
              {
                role: 'user',
                content: currentChat.input,
              },
            ]
          : []),
      ],
      model: currentChat.settings.model,
      max_tokens: currentChat.settings.maxTokens,
      temperature: currentChat.settings.temperature,
      top_p: currentChat.settings.topP,
      frequency_penalty: currentChat.settings.frequencyPenalty,
      presence_penalty: currentChat.settings.presencePenalty,
      stream: true,
      language: i18n.language,
    },
    headers: {
      'Content-Type': 'text/plain',
      ...(!isNil(configStore.customApiKey)
        ? { 'X-Custom-Api-Key': configStore.customApiKey }
        : {}),
      ...(!isNil(configStore.customBaseUrl)
        ? { 'X-Custom-Base-Url': configStore.customBaseUrl }
        : {}),
    },
    onFinish: () => {
      handleGenerateTitle();
      handleGenerateSummary();
    },
  });

  const { scrollRef, isBottom, setIsBottom, scrollToBottom } =
    useChatScrollAnchor([cleanedMessages, input]);

  useEffectOnce(() => {
    setTimeout(scrollToBottom, 0);
  });

  useEffect(() => {
    if (!isNil(currentChat.settings.model) || isNil(configStore.defaultModel)) {
      return;
    }

    updateChatSettings(currentChat.id, { model: configStore.defaultModel });
  }, [
    configStore.defaultModel,
    currentChat.id,
    currentChat.settings.model,
    updateChatSettings,
  ]);

  useDebounce(
    () => {
      syncMessages(currentChat.id, messages as IChatMessage[]);
    },
    50,
    [currentChat.id, messages, syncMessages],
  );

  const isShowPrompt = useMemo(() => {
    if (isEmpty(promptStore.prompts)) {
      return false;
    }

    return isEqual(input, '/') || isShowToolbarPrompt;
  }, [input, isShowToolbarPrompt, promptStore.prompts]);

  const isEnableChatConfig = useMemo(() => {
    return _(cleanedMessages)
      .filter((message) => message.role !== 'system')
      .isEmpty();
  }, [cleanedMessages]);

  const getEmojiFromRole = (role: IChatMessage['role']) => {
    if (role === 'system') {
      if (!isNil(currentChat.mask)) {
        return currentChat.mask.emoji;
      }

      return '🔏';
    }

    if (role === 'assistant') {
      return '🤖';
    }

    if (role === 'user') {
      return configStore.emoji;
    }

    return '🧑‍💻';
  };

  const handleScroll = (ev: HTMLDivElement) => {
    if (ev.scrollTop > 20) {
      return;
    }

    const lastIndex = lastIndexOf(paginatedMessages, last(paginatedMessages));
    if (lastIndex >= cleanedMessages.length - 1) {
      return;
    }

    setEndIndex(lastIndex);
  };

  const handleChoosePrompt = (prompt: IPrompt) => {
    setIsShowToolbarPrompt(false);

    setInput(prompt.content);
  };

  const handleClearHistory = () => {
    confirm({
      message: t('chatWindow.confirm.clearHistory'),
      onConfirmAction: () => {
        const newMessages = filter(
          messages,
          (message) => message.role === 'system',
        );
        setMessages(newMessages);

        updateChatSummary(id);
        updateChatSettings(id, { summarizedIds: [] });

        setIsBottom(true);
      },
    });
  };

  const handleChangeMessage = (message: IChatMessage, newContent: string) => {
    const newMessages = cloneDeep(currentChat.messages);

    const targetMessage = find(newMessages, (msg) => msg.id === message.id);
    if (!isNil(targetMessage)) {
      targetMessage.content = newContent;
    }

    setMessages(newMessages);
  };

  const handleRegenerateMessage = async (message: IChatMessage) => {
    const newMessages = takeWhile(
      cloneDeep(currentChat.messages),
      (msg) => msg.id !== message.id,
    );

    if (message.role === 'user') {
      newMessages.push(message);
    }

    setMessages(newMessages);

    setTimeout(reload, 100);
  };

  const handleRemoveMessage = (message: IChatMessage) => {
    const newMessages = filter(messages, (msg) => msg.id !== message.id);
    setMessages(newMessages);
  };

  const handleInputChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(ev);

    updateChatInput(currentChat.id, ev.currentTarget.value);
  };

  const handleSubmit = (ev: ChangeEvent<HTMLFormElement>) => {
    onSubmit(ev);

    updateChatInput(currentChat.id);
  };

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col overflow-y-auto scrollbar scrollbar-thumb-accent-foreground/30 scrollbar-thumb-rounded-full scrollbar-w-[3px]"
      onScrollCapture={(ev) => handleScroll(ev.currentTarget)}
    >
      <AppBar
        title={currentChat.title}
        subtitle={t('chatWindow.totalMessages', {
          count: cleanedMessages.length,
        })}
        actions={
          <>
            <AppBarEditTitleButton
              key={1}
              value={currentChat.title}
              onChange={(newTitle) => updateChatTitle(currentChat.id, newTitle)}
            />
            {!has(window, '__TAURI_INTERNALS__') && (
              <AppBarIconButton
                key={3}
                IconComponent={
                  configStore.isMaximized
                    ? RiFullscreenExitLine
                    : RiFullscreenLine
                }
                className="hidden lg:flex"
                onClick={() => {
                  configStore.updateConfig({
                    isMaximized: !configStore.isMaximized,
                  });
                }}
              />
            )}
          </>
        }
      />
      <div className="flex flex-1 flex-col-reverse gap-5 p-4">
        {configStore.sendPreviewBubble &&
          !isEmpty(input) &&
          !isEqual(input, '/') && (
            <ChatBubble
              emoji={configStore.emoji}
              message={{
                id: uuid(),
                role: 'user',
                content: input,
                createdAt: moment().toDate(),
              }}
            />
          )}
        {!isNil(error) && (
          <ChatBubble
            emoji={getEmojiFromRole('assistant')}
            message={{
              id: uuid(),
              role: 'assistant',
              content:
                error.message || 'Something went wrong, please try again.',
              createdAt: moment().toDate(),
            }}
          />
        )}
        {map(paginatedMessages, (message) => (
          <ChatBubble
            key={message.id}
            emoji={getEmojiFromRole(message.role)}
            message={message}
            onChange={(newContent) => handleChangeMessage(message, newContent)}
            onRegenerate={() => handleRegenerateMessage(message)}
            onRemove={() => handleRemoveMessage(message)}
            allowTextToSpeech
            allowCopy
          />
        ))}
        {isEmpty(paginatedMessages) &&
          (!configStore.sendPreviewBubble || isEmpty(input)) &&
          isNil(error) && (
            <div className="flex size-full flex-col items-center justify-center">
              <div className="text-lg font-medium text-muted-foreground/60">
                {t('chatWindow.emptyChat')}
              </div>
            </div>
          )}
      </div>
      <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-background/60 px-4 py-3 backdrop-blur">
        {isShowPrompt && (
          <FadeIn className="flex max-h-[20vh] flex-col divide-y overflow-y-auto overscroll-contain rounded-lg border bg-background text-xs scrollbar scrollbar-thumb-accent-foreground/30 scrollbar-thumb-rounded-full scrollbar-w-[3px]">
            {map(promptStore.prompts, (prompt) => (
              <div
                key={prompt.id}
                className="flex cursor-pointer flex-col gap-0.5 px-2.5 py-2 transition-colors hover:bg-accent"
                onClickCapture={() => handleChoosePrompt(prompt)}
              >
                <div className="font-medium">{prompt.title}</div>
                <div className="truncate">{prompt.content}</div>
              </div>
            ))}
          </FadeIn>
        )}
        <div className="flex gap-1.5 overflow-x-hidden">
          <ToolbarIconButton
            IconComponent={RiMagicLine}
            label={t('chatWindow.toolbar.prompts')}
            onClick={() => setIsShowToolbarPrompt()}
          />
          <Dialog>
            <DialogTrigger asChild>
              <div className="z-10">
                <ToolbarIconButton
                  IconComponent={RiSettings4Line}
                  label={t('chatWindow.toolbar.settings')}
                />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('chatWindow.settings.title')}</DialogTitle>
                <DialogDescription>
                  {t('chatWindow.settings.subtitle')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <ToolbarSettingItem
                  title={t('chatWindow.settings.model.title')}
                >
                  {isEnableChatConfig ? (
                    <Select
                      dir="ltr"
                      value={
                        !isEmpty(configStore.models)
                          ? currentChat.settings.model
                          : undefined
                      }
                      disabled={isEmpty(configStore.models)}
                      onValueChange={(model) => {
                        updateChatSettings(currentChat.id, {
                          model: model as IChatSetting['model'],
                        });
                      }}
                    >
                      <SelectTrigger className="min-w-[180px] truncate">
                        <SelectValue
                          placeholder={t(
                            'chatWindow.settings.model.placeholder',
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {map(configStore.models, (model) => (
                            <SelectItem key={model} value={model as string}>
                              {getModelNameByModelID(model as string)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={
                        !isNil(currentChat.settings.model)
                          ? getModelNameByModelID(currentChat.settings.model)
                          : ''
                      }
                      spellCheck={false}
                      disabled
                    />
                  )}
                </ToolbarSettingItem>
                <ToolbarSettingItem
                  title={t('chatWindow.settings.maxTokens.title')}
                  tooltip={t('chatWindow.settings.maxTokens.tooltip')}
                >
                  <Input
                    type="number"
                    className="w-[120px] text-center"
                    value={currentChat.settings.maxTokens}
                    min={500}
                    max={4096}
                    autoComplete="off"
                    disabled={!isEnableChatConfig}
                    onChange={(ev) => {
                      updateChatSettings(currentChat.id, {
                        maxTokens: Number(ev.currentTarget.value) || 0,
                      });
                    }}
                  />
                </ToolbarSettingItem>
                <ToolbarSettingItem
                  title={t('chatWindow.settings.temperature.title')}
                  tooltip={t('chatWindow.settings.temperature.tooltip')}
                >
                  <SliderInput
                    value={[currentChat.settings.temperature]}
                    min={0}
                    max={2}
                    step={0.1}
                    disabled={!isEnableChatConfig}
                    onValueChange={(values) => {
                      updateChatSettings(currentChat.id, {
                        temperature: values[0] || 0,
                      });
                    }}
                  />
                </ToolbarSettingItem>
                <ToolbarSettingItem
                  title={t('chatWindow.settings.topP.title')}
                  tooltip={t('chatWindow.settings.topP.tooltip')}
                >
                  <SliderInput
                    value={[currentChat.settings.topP]}
                    min={0.1}
                    max={1}
                    step={0.1}
                    disabled={!isEnableChatConfig}
                    onValueChange={(values) => {
                      updateChatSettings(currentChat.id, {
                        topP: values[0] || 0,
                      });
                    }}
                  />
                </ToolbarSettingItem>
                <ToolbarSettingItem
                  title={t('chatWindow.settings.frequencyPenalty.title')}
                  tooltip={t('chatWindow.settings.frequencyPenalty.tooltip')}
                >
                  <SliderInput
                    value={[currentChat.settings.frequencyPenalty]}
                    min={-2.0}
                    max={2.0}
                    step={0.1}
                    disabled={!isEnableChatConfig}
                    onValueChange={(values) => {
                      updateChatSettings(currentChat.id, {
                        frequencyPenalty: values[0] || 0,
                      });
                    }}
                  />
                </ToolbarSettingItem>
                <ToolbarSettingItem
                  title={t('chatWindow.settings.presencePenalty.title')}
                  tooltip={t('chatWindow.settings.presencePenalty.tooltip')}
                >
                  <SliderInput
                    value={[currentChat.settings.presencePenalty]}
                    min={-2.0}
                    max={2.0}
                    step={0.1}
                    disabled={!isEnableChatConfig}
                    onValueChange={(values) => {
                      updateChatSettings(currentChat.id, {
                        presencePenalty: values[0] || 0,
                      });
                    }}
                  />
                </ToolbarSettingItem>
              </div>
            </DialogContent>
          </Dialog>
          <div className="ml-auto flex gap-1.5">
            {!isBottom && (
              <FadeIn initial={{ opacity: 0, x: 0, y: 0 }}>
                <ToolbarIconButton
                  IconComponent={RiArrowDownLine}
                  label={t('chatWindow.toolbar.scrollToBottom')}
                  onClick={() => scrollToBottom()}
                />
              </FadeIn>
            )}
            <ToolbarIconButton
              IconComponent={VscClearAll}
              label={t('chatWindow.toolbar.clearHistory')}
              onClick={handleClearHistory}
            />
          </div>
        </div>
        <form ref={formRef} className="relative" onSubmit={handleSubmit}>
          <TextareaAutosize
            value={input}
            placeholder={t('chatWindow.message.placeholder')}
            className="block w-full resize-none overscroll-contain rounded-lg border bg-background px-3 py-2.5 pr-[140px] outline-none scrollbar scrollbar-thumb-accent-foreground/30 scrollbar-thumb-rounded-full scrollbar-w-[3px] placeholder:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            spellCheck={false}
            minRows={3}
            maxRows={6}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            disabled={isLoading || isNil(currentChat.settings.model)}
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            {isLoading ? (
              <Button type="submit" variant="outline" onClick={() => stop()}>
                <RiLoader3Line size={18} className="animate-spin" />
                <span className="ml-2">
                  {t('chatWindow.message.stopGenerating')}
                </span>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isNil(currentChat.settings.model)}
              >
                <span className="mr-2">{t('chatWindow.message.send')}</span>
                <RiSendPlane2Line size={14} />
              </Button>
            )}
          </div>
        </form>
        <div className="text-center text-xs text-muted-foreground">
          Peer AI can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  );
};
