'use client';

import _, { isEmpty, isNil, map, toNumber } from 'lodash';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCloseLine } from 'react-icons/ri';

import i18n, { supportedLanguages } from '@/i18n';
import { getModelNameByModelID } from '@/lib/helpers';
import {
  useChatStore,
  useConfigStore,
  useMaskStore,
  usePromptStore,
} from '@/stores';
import type { IChatSetting } from '@/types';
import { SendKeys } from '@/types';

import { AppBar, AppBarIconButton } from './AppBar';
import { EmojiPickerButton } from './EmojiPickerButton';
import { useConfirmDialog } from './Providers/ConfirmDialogProvider';
import { Button } from './UI/Button';
import { Card } from './UI/Card';
import { ConfirmDialog } from './UI/ConfirmDialog';
import { FadeIn } from './UI/FadeIn';
import { DebouncedInput, Input } from './UI/Input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './UI/Select';
import { SliderInput } from './UI/Slider';
import { Switch } from './UI/Switch';

const BoxItem = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex flex-1 flex-col gap-0.5">
      <div className="font-medium">{title}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
    <div className="flex shrink-0">{children}</div>
  </div>
);

export const Settings = () => {
  const { t } = useTranslation();
  const { theme, systemTheme, setTheme } = useTheme();

  const confirm = useConfirmDialog(ConfirmDialog);

  const router = useRouter();

  const configStore = useConfigStore();
  const chatStore = useChatStore();
  const maskStore = useMaskStore();
  const promptStore = usePromptStore();

  const updateConfig = useConfigStore((state) => state.updateConfig);

  const handleResetSettings = () => {
    confirm({
      message: t('settings.confirm.reset'),
      onConfirmAction: () => {
        configStore.clear();

        localStorage.removeItem('i18nextLng');

        i18n.changeLanguage();
        setTheme(systemTheme || 'light');
      },
    });
  };

  const handleDeleteAll = () => {
    confirm({
      message: t('settings.confirm.deleteAll'),
      onConfirmAction: () => {
        configStore.clear();
        chatStore.clear();
        maskStore.clear();
        promptStore.clear();

        localStorage.removeItem('i18nextLng');

        i18n.changeLanguage();
        setTheme(systemTheme || 'light');
      },
    });
  };

  return (
    <>
      <AppBar
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
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
              <BoxItem
                title={t('settings.theme.title')}
                subtitle={t('settings.theme.subtitle')}
              >
                <Select value={theme} onValueChange={(key) => setTheme(key)}>
                  <SelectTrigger className="w-[180px] truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="system">
                        {t('settings.theme.system')}
                      </SelectItem>
                      <SelectItem value="light">
                        {t('settings.theme.light')}
                      </SelectItem>
                      <SelectItem value="dark">
                        {t('settings.theme.dark')}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </BoxItem>
              <BoxItem title={t('settings.avatar.title')}>
                <EmojiPickerButton
                  value={configStore.emoji}
                  onChange={(value) => {
                    configStore.updateConfig({ emoji: value });
                  }}
                />
              </BoxItem>
              <BoxItem
                title={t('settings.language.title')}
                subtitle={t('settings.language.subtitle')}
              >
                <Select
                  value={i18n.language}
                  onValueChange={(key) => {
                    i18n.changeLanguage(key);
                  }}
                >
                  <SelectTrigger className="w-[180px] truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {map(supportedLanguages, (lng, key) => (
                        <SelectItem key={key} value={key}>
                          {lng}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </BoxItem>
              <BoxItem
                title={t('settings.sendKey.title')}
                subtitle={
                  configStore.sendKey === SendKeys.Enter
                    ? t('settings.sendKey.subtitle1')
                    : t('settings.sendKey.subtitle2')
                }
              >
                <Select
                  value={configStore.sendKey}
                  onValueChange={(key: SendKeys) => {
                    configStore.updateConfig({ sendKey: key });
                  }}
                >
                  <SelectTrigger className="w-[180px] truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {_(SendKeys)
                        .valuesIn()
                        .map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))
                        .value()}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </BoxItem>
              <BoxItem
                title={t('settings.sendPreviewBubble.title')}
                subtitle={t('settings.sendPreviewBubble.subtitle')}
              >
                <Switch
                  checked={configStore.sendPreviewBubble}
                  onCheckedChange={(checked) => {
                    configStore.updateConfig({ sendPreviewBubble: checked });
                  }}
                />
              </BoxItem>
              <BoxItem
                title={t('settings.autoGenerateTitle.title')}
                subtitle={t('settings.autoGenerateTitle.subtitle')}
              >
                <Switch
                  checked={configStore.autoGenerateTitle}
                  onCheckedChange={(checked) => {
                    configStore.updateConfig({ autoGenerateTitle: checked });
                  }}
                />
              </BoxItem>
            </div>
          </Card>
        </FadeIn>
        <FadeIn>
          <Card>
            <div className="divide-y">
              <BoxItem title="Custom API Key">
                <DebouncedInput
                  type="password"
                  placeholder="API Key"
                  className="text-center"
                  value={configStore.customApiKey || ''}
                  autoComplete="off"
                  onDebounceChange={(raw) => {
                    if (isNil(raw)) {
                      return;
                    }

                    const value = raw.toString().trim();
                    updateConfig({
                      customApiKey: !isEmpty(value) ? value : undefined,
                    });
                  }}
                />
              </BoxItem>
              <BoxItem title="Custom Base URL">
                <DebouncedInput
                  type="url"
                  placeholder="Base URL"
                  className="text-center"
                  value={configStore.customBaseUrl || ''}
                  autoComplete="off"
                  onDebounceChange={(raw) => {
                    if (isNil(raw)) {
                      return;
                    }

                    const value = raw.toString().trim();
                    updateConfig({
                      customBaseUrl: !isEmpty(value) ? value : undefined,
                    });
                  }}
                />
              </BoxItem>
              <BoxItem
                title={t('settings.model.title')}
                subtitle={t('settings.model.subtitle')}
              >
                <Select
                  value={configStore.defaultModel}
                  disabled={isEmpty(configStore.models)}
                  onValueChange={(model) => {
                    configStore.updateConfig({
                      defaultModel: model as IChatSetting['model'],
                    });
                  }}
                >
                  <SelectTrigger className="min-w-[180px] truncate">
                    <SelectValue
                      placeholder={t('settings.model.placeholder')}
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
              </BoxItem>
              <BoxItem
                title="Max Tokens"
                subtitle="The maximum number of tokens to return."
              >
                <Input
                  type="number"
                  className="w-[120px] text-center"
                  value={configStore.maxTokens || 1000}
                  onChange={(ev) => {
                    updateConfig({
                      maxTokens: toNumber(ev.currentTarget.value) || undefined,
                    });
                  }}
                />
              </BoxItem>
              <BoxItem
                title="Temperature"
                subtitle="Controls the randomness of the returned text; lower is less random."
              >
                <SliderInput
                  value={[configStore.temperature]}
                  min={0}
                  max={2}
                  step={0.1}
                  onValueChange={(values) => {
                    updateConfig({ temperature: values[0] || 0 });
                  }}
                />
              </BoxItem>
              <BoxItem
                title="Top P"
                subtitle="The cumulative probability of the most likely tokens to return."
              >
                <SliderInput
                  value={[configStore.topP]}
                  min={0.1}
                  max={1}
                  step={0.1}
                  onValueChange={(values) => {
                    updateConfig({ topP: values[0] || 0 });
                  }}
                />
              </BoxItem>
              <BoxItem
                title="Frequency Penalty"
                subtitle="How much to penalize tokens based on their frequency in the text so far."
              >
                <SliderInput
                  value={[configStore.frequencyPenalty]}
                  min={-2.0}
                  max={2.0}
                  step={0.1}
                  onValueChange={(values) => {
                    updateConfig({ frequencyPenalty: values[0] || 0 });
                  }}
                />
              </BoxItem>
              <BoxItem
                title="Presence Penalty"
                subtitle="How much to penalize tokens based on if they have appeared in the text so far."
              >
                <SliderInput
                  value={[configStore.presencePenalty]}
                  min={-2.0}
                  max={2.0}
                  step={0.1}
                  onValueChange={(values) => {
                    updateConfig({ presencePenalty: values[0] || 0 });
                  }}
                />
              </BoxItem>
            </div>
          </Card>
        </FadeIn>
        <FadeIn>
          <Card>
            <div className="divide-y">
              <BoxItem
                title={t('settings.messageCompressionThreshold.title')}
                subtitle={t('settings.messageCompressionThreshold.subtitle')}
              >
                <Input
                  type="number"
                  className="w-[120px] text-center"
                  value={configStore.messageCompressionThreshold}
                  max={2048}
                  onChange={(ev) => {
                    updateConfig({
                      messageCompressionThreshold:
                        toNumber(ev.currentTarget.value) || undefined,
                    });
                  }}
                />
              </BoxItem>
            </div>
          </Card>
        </FadeIn>
        <FadeIn>
          <Card>
            <div className="divide-y">
              <BoxItem
                title={t('settings.reset.title')}
                subtitle={t('settings.reset.subtitle')}
              >
                <Button
                  variant="destructive"
                  className="bg-destructive/20 text-destructive hover:text-destructive-foreground dark:bg-destructive/40 dark:text-destructive-foreground dark:hover:bg-destructive/80"
                  size="sm"
                  onClick={handleResetSettings}
                >
                  {t('settings.reset.button')}
                </Button>
              </BoxItem>
              <BoxItem
                title={t('settings.deleteAll.title')}
                subtitle={t('settings.deleteAll.subtitle')}
              >
                <Button
                  variant="destructive"
                  className="bg-destructive/20 text-destructive hover:text-destructive-foreground dark:bg-destructive/40 dark:text-destructive-foreground dark:hover:bg-destructive/80"
                  size="sm"
                  onClick={handleDeleteAll}
                >
                  {t('settings.deleteAll.button')}
                </Button>
              </BoxItem>
            </div>
          </Card>
        </FadeIn>
      </div>
    </>
  );
};
