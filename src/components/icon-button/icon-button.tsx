import { Button as AriaButton } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import {
  ButtonSpinner,
  toAriaButtonProps,
  withTooltip,
  type ButtonProps,
} from '../button/button.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';

export interface IconButtonProps extends Omit<
  ButtonProps,
  'children' | 'content' | 'align' | 'startIcon' | 'endIcon' | 'fullWidth' | 'aria-label'
> {
  /** The icon the button shows. */
  icon: IconSource;
  /** The accessible name. Required: the button shows no text. */
  label: string;
}

const hooks = createHooks('icon-button', ['icon', 'spinner']);

/** An icon-only command button, named by `label`, with Button's states. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  tooltip,
  className,
  ...rest
}: IconButtonProps) {
  if (!label.trim()) throw new Error('IconButton requires a non-empty label.');
  return withTooltip(
    <AriaButton
      {...toAriaButtonProps(rest)}
      {...hooks.root({
        className,
        props: rest,
        data: { variant, size, selected: rest.isSelected },
      })}
      aria-label={label}
    >
      {rest.isPending ? (
        <ButtonSpinner className={hooks.slotClass('spinner')} label={rest.pendingLabel} />
      ) : (
        <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} />
      )}
    </AriaButton>,
    tooltip,
  );
}
