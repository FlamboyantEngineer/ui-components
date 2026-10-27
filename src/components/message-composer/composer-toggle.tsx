// A mode the reader turns on and off among the composer's controls, such as planning before acting
// (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-8).

import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Button } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import { useMessageComposerControls } from './composer-controls.js';
import { composerHooks as hooks } from './composer-hooks.js';

export interface MessageComposerToggleProps extends BaseProps {
  /** The mode's name: the button's label and accessible name. */
  label: string;
  /** Drawn before the label, and alone while the composer is compact. */
  icon: IconSource;
  /** Whether the mode is on, controlled. */
  isSelected?: boolean | undefined;
  /** Whether the mode is on at first, uncontrolled. */
  defaultSelected?: boolean | undefined;
  /** Called with the mode's new state when the reader turns it on or off. */
  onChange?: ((isSelected: boolean) => void) | undefined;
  /** Refuses presses; the composer's own disabled state does as well. */
  isDisabled?: boolean | undefined;
}

/**
 * A composer control that turns a mode on and off: a toggle button with its icon and label, or its
 * icon alone while the composer is compact.
 */
export function MessageComposerToggle({
  label,
  icon,
  isDisabled = false,
  ...props
}: MessageComposerToggleProps) {
  const composer = useMessageComposerControls();
  const button = {
    ...props,
    className: mergeClassNames(hooks.slotClass('toggle'), props.className),
    variant: 'ghost',
    size: 'sm',
    // Without either, a press would not flip the button.
    defaultSelected: props.isSelected === undefined ? (props.defaultSelected ?? false) : undefined,
    isDisabled: isDisabled || composer.isDisabled,
  } as const;
  return composer.isCompact ? (
    <Button {...button} icon={icon} label={label} tooltip={label} />
  ) : (
    <Button {...button} startIcon={icon}>
      {label}
    </Button>
  );
}
