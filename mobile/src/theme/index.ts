export * from './colors';
export * from './spacing';
export * from './typography';
export * from './shadows';
export * from './gradients';
export * from './fonts';
export * from './gradientUtils';

import { colors } from './colors';
import { spacing, borderRadius, borderWidth } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';
import { gradients } from './gradients';

export const theme = {
  colors,
  spacing,
  borderRadius,
  borderWidth,
  typography,
  shadows,
  gradients,
};

export type Theme = typeof theme;
