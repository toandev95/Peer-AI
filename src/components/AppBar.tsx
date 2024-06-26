'use client';

import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

import { cn } from '@/lib/helpers';

import type { ButtonProps } from './UI/Button';
import { Button } from './UI/Button';

export const AppBar = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) => (
  <div className="sticky top-0 z-20 flex items-center border-b bg-background/60 px-4 py-3 backdrop-blur">
    <div className="flex-1">
      <div className="mb-0.5 text-lg font-bold">{title}</div>
      <div className="text-muted-foreground">{subtitle}</div>
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

export const AppBarIconButton = ({
  IconComponent,
  onClick,
  className,
  ...props
}: ButtonProps & { IconComponent: IconType }) => (
  <Button
    variant="outline"
    size="icon"
    className={cn(className, 'shadow-none')}
    onClick={onClick}
    {...props}
  >
    <IconComponent size={18} />
  </Button>
);
