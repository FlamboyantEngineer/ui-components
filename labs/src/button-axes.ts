// The variant, size and state axes every Button matrix in the lab shares.

import type { ButtonVariant } from '../../src/components/button/button.js';

export const buttonVariants: ButtonVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'danger',
  'ghost',
  'accent',
  'chip',
  'link',
  'bare',
];
export const buttonSizes = ['xs', 'sm', 'md', 'lg'] as const;
export const buttonStates = [
  'default',
  'selected',
  'disabled',
  'focusable disabled',
  'pending',
] as const;
