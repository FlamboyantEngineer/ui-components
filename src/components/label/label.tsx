'use client';

import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Icon, type IconSize, type IconSource, toIconProps } from '../icon/icon.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';

export interface LabelProps
  extends BaseProps, RefProps<HTMLSpanElement>, Pick<NativeProps<'span'>, 'hidden'> {
  /**
   * An imported icon component or rendered element before the label. The icon is decorative: the
   * label names it, or, without one, the host does. Omit it for text alone.
   */
  icon?: IconSource;
  /** The text, after the icon. Omit it for an icon alone, which the host names. */
  label?: ReactNode;
  /** Icon box size; the host stylesheet sizes the gap from it. Defaults to `md`. */
  size?: Exclude<IconSize, 'inherit'> | undefined;
  /**
   * Keep the label on one line and let the stylesheet ellipsize it. The full text stays in the DOM
   * and shows in a tooltip while it is cut.
   */
  truncate?: boolean | undefined;
  /** Take the available width of the host row. */
  grow?: boolean | undefined;
  /** Hide the label text (for collapsed navigation); the host control supplies the accessible name. */
  hideLabel?: boolean | undefined;
  /** Mark the label text as one the stylesheet may hide in narrow containers. */
  collapsible?: boolean | undefined;
  /** Announce label changes. Quiet by default. */
  live?: 'polite' | 'assertive' | undefined;
}

const hooks = createHooks('label', ['icon', 'label']);

/**
 * Text with an optional decorative leading icon, or an icon alone, inheriting the host's typography.
 * An empty icon or label draws no slot.
 */
export function Label({
  icon,
  label,
  size = 'md',
  truncate,
  grow,
  hideLabel,
  collapsible,
  live,
  className,
  ...rest
}: LabelProps) {
  return (
    <span
      {...rest}
      {...hooks.root({ className, data: { size, truncate, grow, collapsible } })}
      aria-live={live}
    >
      {icon ? (
        <Icon {...toIconProps(icon)} size={size} className={hooks.slotClass('icon')} />
      ) : null}
      {isEmptyNode(label) ? null : truncate ? (
        <TruncationTooltip className={hooks.slotClass('label')} hidden={hideLabel}>
          {label}
        </TruncationTooltip>
      ) : (
        <span {...hooks.slot('label')} hidden={hideLabel}>
          {label}
        </span>
      )}
    </span>
  );
}
