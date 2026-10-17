import type { ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { ButtonIcon, ButtonSpinner, domPassThrough, type ButtonProps } from '../button/button.js';

export interface IconButtonProps extends Omit<
  ButtonProps,
  'children' | 'content' | 'align' | 'startIcon' | 'endIcon' | 'fullWidth' | 'aria-label'
> {
  /** A built-in glyph name or icon node. */
  icon: GlyphName | ReactNode;
  /** The accessible name. Required: the button shows no text. */
  label: string;
}

const hooks = createHooks('icon-button', ['icon', 'spinner']);

/** An icon-only command button, named by `label`. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  isSelected = false,
  isDisabled = false,
  isPending = false,
  pendingLabel,
  focusableWhenDisabled = false,
  className,
  onPress,
  type = 'button',
  role,
  'aria-checked': ariaChecked,
  'aria-selected': ariaSelected,
  ...rest
}: IconButtonProps) {
  if (!label.trim()) throw new Error('IconButton requires a non-empty label.');
  const focusableDisabled = isDisabled && focusableWhenDisabled;
  const statesToggle =
    rest['aria-pressed'] !== undefined || ariaChecked !== undefined || role !== undefined;

  return (
    <AriaButton
      {...rest}
      {...hooks.root({ className, props: rest, data: { variant, size, selected: isSelected } })}
      aria-label={label}
      type={focusableDisabled ? 'button' : type}
      isDisabled={isDisabled && !focusableWhenDisabled}
      isPending={isPending}
      onPress={focusableDisabled ? undefined : onPress}
      {...(isSelected && !statesToggle ? { 'aria-pressed': true } : {})}
      {...(focusableDisabled ? { 'aria-disabled': true } : {})}
      {...domPassThrough(
        { role, 'aria-checked': ariaChecked, 'aria-selected': ariaSelected },
        focusableDisabled,
      )}
    >
      {isPending ? (
        <ButtonSpinner className={hooks.slotClass('spinner')} label={pendingLabel} />
      ) : (
        <ButtonIcon icon={icon} className={hooks.slotClass('icon')} />
      )}
    </AriaButton>
  );
}
