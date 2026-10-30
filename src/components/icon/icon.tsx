import { isValidElement, type ReactElement, type ReactNode } from 'react';
import type { GlyphComponent } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';

/** A fixed box size, or `inherit`: a 1em box that scales with the surrounding font. */
export type IconSize = Extract<Size, 'sm' | 'md' | 'lg'> | 'inherit';

/** An imported icon component or a rendered element. */
export type IconSource = GlyphComponent | ReactElement | null | undefined | false;

export interface IconProps extends BaseProps {
  /** An imported icon component. Built-in glyph components honor provider overrides. */
  icon?: GlyphComponent | undefined;
  /** Any icon node (an SVG element, an image), used when no `icon` is given. */
  children?: ReactNode;
  /** Box size; `inherit` follows the surrounding font size. Defaults to `md`. */
  size?: IconSize | undefined;
  /** Accessible name. Without one the icon is decorative and hidden from assistive technology. */
  label?: string | undefined;
}

const hooks = createHooks('icon', ['glyph']);

/** Image semantics for a drawing: an image named by `label`, or hidden from assistive technology. */
export function toImageProps(
  label: string | undefined,
): { role: 'img'; 'aria-label': string } | { 'aria-hidden': true } {
  return label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
}

/** Passes components as `icon` and rendered elements as `children`. */
export function toIconProps(source: IconSource): Pick<IconProps, 'icon' | 'children'> {
  return !source || isValidElement(source) ? { children: source } : { icon: source };
}

/** One icon box: an imported component or any icon node, decorative unless it has a label. */
export function Icon({ icon, children, size = 'md', label, className, ...rest }: IconProps) {
  return (
    <span
      {...rest}
      {...hooks.root({ className, data: { size, glyph: icon?.glyphName } })}
      {...toImageProps(label)}
    >
      {icon ? <Glyph icon={icon} className={hooks.slotClass('glyph')} /> : children}
    </span>
  );
}
