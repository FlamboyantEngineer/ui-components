'use client';

import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, RefProps } from '../../core/props.js';
import { Input as AriaInput } from '../../primitives/index.js';

export interface InputProps
  extends
    BaseProps,
    RefProps<HTMLInputElement>,
    Omit<ContainerProps<'input'>, 'children' | 'ref'> {}

const hooks = createHooks('input', [], { root: 'input' });

/** A native single-line input with interaction and styling hooks. Supply an accessible name. */
export function Input({ className, ...props }: InputProps) {
  return <AriaInput {...props} {...hooks.root({ className, props })} />;
}
