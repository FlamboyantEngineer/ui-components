import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { FieldRestoreButton } from './field-restore-button.js';

export interface FieldPreviousValueProps extends BaseProps {
  /** The value the edit replaced or removed: text, or an icon with its label. */
  children: ReactNode;
  /** Puts this one value back. Without it the marker only shows the value. */
  onRestore?: (() => void) | undefined;
  /** Names the restore button (`Restore <restoreLabel>`); defaults to the text of `children`. */
  restoreLabel?: string | undefined;
  /** The field is locked: the restore button is disabled. */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('field-previous-value', ['value']);

/**
 * Marks a value that differs from the field's committed value: the previous value in a `<del>`
 * element, and, when the control can put that one value back, a restore button.
 */
export function FieldPreviousValue({
  children,
  onRestore,
  restoreLabel,
  isDisabled,
  className,
  id,
  ...rest
}: FieldPreviousValueProps) {
  const label = restoreLabel ?? (typeof children === 'string' ? children : '');
  return (
    <span {...hooks.root({ className, props: rest })} id={id}>
      <del {...hooks.slot('value')}>{children}</del>
      {onRestore && label ? (
        <FieldRestoreButton label={label} size="sm" isDisabled={isDisabled} onPress={onRestore} />
      ) : null}
    </span>
  );
}
