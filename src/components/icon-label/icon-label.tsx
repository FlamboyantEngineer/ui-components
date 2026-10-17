import { isValidElement, type ReactNode } from 'react';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { Icon, type IconSize } from '../icon/icon.js';

export interface IconLabelProps {
  /** A built-in glyph name or any icon node. The icon is decorative; the label names it. */
  icon: GlyphName | ReactNode;
  label: ReactNode;
  /** Icon box size; the host stylesheet sizes the gap from it. Defaults to `md`. */
  size?: IconSize | undefined;
  /** Keep the label on one line and let the stylesheet ellipsize it. The full text stays in the DOM. */
  truncate?: boolean | undefined;
  /** Take the available width of the host row. */
  grow?: boolean | undefined;
  /** Hide the label text (for collapsed navigation); the host control supplies the accessible name. */
  hideLabel?: boolean | undefined;
  /** Mark the label text as one the stylesheet may hide in narrow containers. */
  collapsible?: boolean | undefined;
  hidden?: boolean | undefined;
  id?: string | undefined;
  /** Announce label changes. Quiet by default. */
  live?: 'polite' | 'assertive' | undefined;
  className?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('icon-label', ['icon', 'label']);

function isGlyphName(icon: IconLabelProps['icon']): icon is GlyphName {
  return typeof icon === 'string' && !isValidElement(icon);
}

/** A decorative leading icon followed by text, inheriting the host's typography. */
export function IconLabel({
  icon,
  label,
  size = 'md',
  truncate,
  grow,
  hideLabel,
  collapsible,
  hidden,
  id,
  live,
  className,
  ...rest
}: IconLabelProps) {
  return (
    <span
      {...hooks.root({ className, props: rest, data: { size, truncate, grow, collapsible } })}
      id={id}
      hidden={hidden}
      aria-live={live}
    >
      {isGlyphName(icon) ? (
        <Icon glyph={icon} size={size} className={hooks.slotClass('icon')} />
      ) : (
        <Icon size={size} className={hooks.slotClass('icon')}>
          {icon}
        </Icon>
      )}
      <span {...hooks.slot('label')} hidden={hideLabel}>
        {label}
      </span>
    </span>
  );
}
