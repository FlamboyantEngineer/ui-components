'use client';

import { useId } from 'react';
import type { GlyphComponent } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { parseColor, useLocale } from '../../primitives/index.js';
import { Button, type ButtonProps } from '../button/button.js';
import { ColorSwatch, isSwatchColor } from './color-swatch.js';

export interface ColorSwatchButtonProps
  extends
    BaseProps,
    Pick<
      ButtonProps,
      'ref' | 'variant' | 'size' | 'isDisabled' | 'onPress' | 'tooltip' | 'shortcut'
    > {
  /** The glyph drawn above the swatch bar, such as `FontColorGlyph` or `BackgroundColorGlyph`. */
  icon: GlyphComponent;
  /** Names the button, such as `Text color`. */
  label: string;
  /**
   * The colour the bar shows, as a hex, `rgb()`, `hsl()` or `hsb()` string. Nothing, empty text or
   * another notation shows an empty bar.
   */
  color?: string | null | undefined;
  /** Names the colour instead of its name in the locale. */
  colorName?: string | undefined;
}

const hooks = createHooks('color-swatch-button', ['swatch']);

/**
 * An icon button whose glyph sits over a bar of the colour it applies, as a text or fill colour
 * command shows the colour a press would set. The colour's name is the button's description.
 */
export function ColorSwatchButton({
  icon,
  color,
  colorName,
  className,
  ...rest
}: ColorSwatchButtonProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const descriptionId = useId();
  // Named as the swatch is, in text: a description reads text, not a referenced image's label.
  const description = isSwatchColor(color)
    ? (colorName ?? parseColor(color).getColorName(locale))
    : strings.noColor;
  return (
    <Button
      {...rest}
      {...hooks.root({ className, props: rest })}
      aria-describedby={descriptionId}
      icon={
        <>
          <Glyph icon={icon} />
          <ColorSwatch className={hooks.slotClass('swatch')} color={color} colorName={colorName} />
          <span id={descriptionId} hidden>
            {description}
          </span>
        </>
      }
    />
  );
}
