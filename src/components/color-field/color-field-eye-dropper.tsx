'use client';

import { EyeDropperGlyph } from '../../core/glyphs.js';
import { useContext } from 'react';
import { ColorPickerStateContext, parseColor } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';

// The EyeDropper API (https://wicg.github.io/eyedropper-api/), which the DOM typings do not have yet.
interface EyeDropperSample {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open(): Promise<EyeDropperSample>;
}

type EyeDropperConstructor = new () => EyeDropperInstance;

const hooks = createHooks('color-field', ['eye-dropper']);

function findEyeDropper(): EyeDropperConstructor | null {
  if (typeof window === 'undefined' || !('EyeDropper' in window)) return null;
  return (window as unknown as { EyeDropper: EyeDropperConstructor }).EyeDropper;
}

/**
 * Samples a colour from the screen with the browser's eye dropper and sets it on the picker. It
 * draws nothing where the browser has no eye dropper; a cancelled sample changes nothing.
 */
export function ColorFieldEyeDropper() {
  const strings = useUiStrings();
  const picker = useContext(ColorPickerStateContext);
  const EyeDropper = findEyeDropper();
  if (!EyeDropper || !picker) return null;
  const sample = async () => {
    try {
      const { sRGBHex } = await new EyeDropper().open();
      picker.setColor(parseColor(sRGBHex));
    } catch {
      // The reader dismissed the eye dropper.
    }
  };
  return (
    <Button
      className={hooks.slotClass('eye-dropper')}
      icon={EyeDropperGlyph}
      label={strings.pickScreenColor}
      variant="ghost"
      size="sm"
      onPress={() => void sample()}
    />
  );
}
