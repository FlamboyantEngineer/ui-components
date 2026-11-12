'use client';

import { createContext, type ReactNode, use, useLayoutEffect, useRef, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import type { FieldChangeLayout } from './field-parts.js';
import { FieldRestoreButton } from './field-restore-button.js';

export interface FieldPreviousValueProps extends RefProps<HTMLSpanElement>, BaseProps {
  /** The value the edit replaced or removed: text, or an icon with its label. */
  children: ReactNode;
  /** Puts this one value back. Without it the marker only shows the value. */
  onRestore?: (() => void) | undefined;
  /** Names the restore button (`Restore <restoreLabel>`); defaults to the text content of `children`. */
  restoreLabel?: string | undefined;
  /** The field is locked: the restore button is disabled. */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('field-previous-value', ['value']);

/** The `changeLayout` of the field whose control renders inside it; `hidden` draws no marker. */
export const FieldChangeLayoutContext = createContext<FieldChangeLayout>('inline');

/**
 * Whether the field around the marker draws restore buttons (`showRestoreButton`). Outside a field,
 * a caller that passes `onRestore` asks for the button itself.
 */
export const FieldRestoreContext = createContext(true);

/**
 * Marks a value that differs from the field's committed value: the previous value in a `<del>`
 * element, and, when the control can put that one value back, a restore button.
 */
export function FieldPreviousValue({
  ref,
  children,
  onRestore,
  restoreLabel,
  isDisabled,
  className,
  id,
  ...rest
}: FieldPreviousValueProps) {
  const valueRef = useRef<HTMLModElement>(null);
  // Content that is not plain text (an icon and its label) is named by the text it renders.
  const [text, setText] = useState(typeof children === 'string' ? children : '');
  useLayoutEffect(() => setText(valueRef.current?.textContent?.trim() ?? ''), [children]);
  const label = restoreLabel ?? text;
  const showsRestore = use(FieldRestoreContext);
  // A field that hides what its edits replaced draws no marker, for sighted and assistive readers.
  if (use(FieldChangeLayoutContext) === 'hidden') return null;
  return (
    <span ref={ref} {...hooks.root({ className, props: rest })} id={id}>
      <del {...hooks.slot('value')} ref={valueRef}>
        {children}
      </del>
      {showsRestore && onRestore && label ? (
        <FieldRestoreButton label={label} size="sm" isDisabled={isDisabled} onPress={onRestore} />
      ) : null}
    </span>
  );
}
