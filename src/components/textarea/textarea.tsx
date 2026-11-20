'use client';

import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, RefProps } from '../../core/props.js';
import { TextArea } from '../../primitives/index.js';

export interface TextareaProps
  extends
    BaseProps,
    RefProps<HTMLTextAreaElement>,
    Omit<ContainerProps<'textarea'>, 'children' | 'ref'> {}

const hooks = createHooks('textarea');

/** A native multiline input with interaction and styling hooks. Supply an accessible name. */
export function Textarea({ className, ...props }: TextareaProps) {
  return <TextArea {...props} {...hooks.root({ className, props })} />;
}
