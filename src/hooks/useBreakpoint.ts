import { createBreakpoint } from 'react-use';

export type Breakpoint = 'desktop' | 'laptopL' | 'laptop' | 'tablet' | 'mobile';

export const useBreakpoint = createBreakpoint({
  desktop: 1536,
  laptopL: 1280,
  laptop: 1024,
  tablet: 768,
  mobile: 640,
}) as () => Breakpoint;
