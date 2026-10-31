'use client';

import { EyeDropperGlyph } from '../../core/glyphs.js';
import { useContext, useEffect, useRef } from 'react';
import { ColorPickerStateContext, parseColor } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';

// The EyeDropper API (https://wicg.github.io/eyedropper-api/), which the DOM typings do not have yet.
interface EyeDropperSample {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open(options?: { signal?: AbortSignal }): Promise<EyeDropperSample>;
}

type EyeDropperConstructor = new () => EyeDropperInstance;

const hooks = createHooks('color-field', ['eye-dropper']);

// Whether to draw the button is decided in render, before there is an element, so support is read
// from the script's own window.
/* eslint-disable no-restricted-globals */
function findEyeDropper(): EyeDropperConstructor | null {
  if (typeof window === 'undefined' || !('EyeDropper' in window)) return null;
  return (window as unknown as { EyeDropper: EyeDropperConstructor }).EyeDropper;
}
/* eslint-enable no-restricted-globals */

/**
 * The running sample's abort controller. A new sample aborts the one before, and unmounting (the
 * picker closing, or the field turning read-only or disabled, which closes it) aborts the last.
 */
function useSampleScope() {
  const current = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      current.current?.abort();
      current.current = null;
    },
    [],
  );
  return () => {
    current.current?.abort();
    current.current = new AbortController();
    return current.current.signal;
  };
}

/**
 * Samples a colour from the screen with the browser's eye dropper and sets it on the picker. It
 * draws nothing where the browser has no eye dropper; a cancelled sample changes nothing. A sample
 * belongs to the open picker: a newer sample, or the picker closing, aborts it through the API's
 * signal, and its colour is ignored should it arrive anyway.
 */
export function ColorFieldEyeDropper() {
  const strings = useUiStrings();
  const picker = useContext(ColorPickerStateContext);
  const startSample = useSampleScope();
  const EyeDropper = findEyeDropper();
  if (!EyeDropper || !picker) return null;
  const sample = async () => {
    const signal = startSample();
    try {
      const { sRGBHex } = await new EyeDropper().open({ signal });
      if (!signal.aborted) picker.setColor(parseColor(sRGBHex));
    } catch {
      // The reader dismissed the eye dropper, or the sample was aborted.
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
