'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Icon, type IconSize, type IconSource } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';

export interface IconLabelProps extends BaseProps, Pick<HTMLAttributes<HTMLSpanElement>, 'hidden'> {
  /** An imported icon component or rendered element. The icon is decorative; the label names it. */
  icon: IconSource;
  /** The text after the icon. */
  label: ReactNode;
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

const hooks = createHooks('icon-label', ['icon', 'label']);

/** A decorative leading icon followed by text, inheriting the host's typography. */
export function IconLabel({
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
}: IconLabelProps) {
  return (
    <span
      {...rest}
      {...hooks.root({ className, data: { size, truncate, grow, collapsible } })}
      aria-live={live}
    >
      <Icon {...toIconProps(icon)} size={size} className={hooks.slotClass('icon')} />
      {truncate ? (
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
