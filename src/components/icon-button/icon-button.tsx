import { Button as AriaButton, Link as AriaLink } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import {
  ButtonSpinner,
  toAriaButtonProps,
  toAriaLinkProps,
  useButtonSelection,
  withTooltip,
  type ButtonProps,
} from '../button/button.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { useDetectedPlatform } from '../shortcut/shortcut.js';

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

/**
 * An icon-only command button, named by `label`, with Button's states, or an icon link with
 * `href`. A `tooltip` that repeats the label names the button rather than describing it.
 */
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
  const selection = useButtonSelection(rest);
  const isLink = rest.href !== undefined;
  const isPending = !isLink && rest.isPending;
  // The button shows no text, so a shortcut's tooltip names the command too.
  const hint = tooltip ?? (rest.shortcut ? label : undefined);
  const options = {
    isTooltipName: hint === label && !rest.shortcut,
    platform: useDetectedPlatform(),
  };
  const hookProps = hooks.root({
    className,
    props: rest,
    data: { variant, size, selected: !isLink && selection.isSelected },
  });
  const content = isPending ? (
    <ButtonSpinner className={hooks.slotClass('spinner')} label={rest.pendingLabel} />
  ) : (
    <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} />
  );
  const element = isLink ? (
    <AriaLink {...toAriaLinkProps(rest, options)} {...hookProps} aria-label={label}>
      {content}
    </AriaLink>
  ) : (
    <AriaButton
      {...toAriaButtonProps({ ...rest, ...selection }, options)}
      {...hookProps}
      aria-label={label}
    >
      {content}
    </AriaButton>
  );
  return withTooltip(element, { tooltip: hint, shortcut: rest.shortcut });
}

export { ScrollStripButton } from './scroll-strip-button.js';
