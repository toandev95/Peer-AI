import emojiData from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { Button } from './UI/Button';

export const EmojiPickerButton = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState<boolean>(false);

  const { theme, systemTheme } = useTheme();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="z-10">
          <Button variant="outline" size="icon" className="text-xl shadow-none">
            {value}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="z-20">
        <Picker
          theme={theme || systemTheme}
          data={emojiData}
          onEmojiSelect={(data: { native: string }) => {
            onChange(data.native);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
