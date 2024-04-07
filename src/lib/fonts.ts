import {
  IBM_Plex_Mono as IBMPlexMono,
  IBM_Plex_Sans as IBMPlexSans,
} from 'next/font/google';

export const fontSans = IBMPlexSans({
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['vietnamese'],
  variable: '--font-sans',
  preload: false,
});

export const fontMono = IBMPlexMono({
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['vietnamese'],
  variable: '--font-mono',
  preload: false,
});
