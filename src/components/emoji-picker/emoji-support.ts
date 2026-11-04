'use client';

import { type RefObject, useLayoutEffect, useState } from 'react';
import { getOwnerWindow } from '../../utils/owner-window.js';

/** What the platform draws, as far as a canvas can tell. */
interface EmojiSupport {
  /** The newest Emoji version the platform draws, or `undefined` when it cannot tell. */
  version: number | undefined;
  /** Whether it draws country flags rather than their letters. */
  countryFlags: boolean;
}

type ProbeContext = Pick<
  OffscreenCanvasRenderingContext2D,
  'clearRect' | 'fillText' | 'getImageData' | 'measureText' | 'fillStyle'
>;

/** One emoji each Emoji version introduced, newest first. */
const versionProbes: ReadonlyArray<readonly [number, string]> = [
  [17, '\u{1FAEA}'],
  [16, '\u{1FAE9}'],
  [15.1, '\u{1F642}‍↔️'],
  [15, '\u{1FAE8}'],
  [14, '\u{1FAE0}'],
  [13.1, '\u{1F636}‍\u{1F32B}️'],
  [13, '\u{1F972}'],
  [12.1, '\u{1F9D1}‍\u{1F9B0}'],
  [12, '\u{1F971}'],
  [11, '\u{1F970}'],
  [5, '\u{1F929}'],
  [4, '\u{1F471}‍♀️'],
  [3, '\u{1F923}'],
  [2, '\u{1F5E8}️'],
  [1, '\u{1F600}'],
];
const flagProbe = '\u{1F1EB}\u{1F1F7}';
const probeSize = 16;
const unknownSupport: EmojiSupport = { version: undefined, countryFlags: true };
const measured = new Map<string, EmojiSupport>();

function drawProbe(context: ProbeContext, glyph: string, colour: string): Uint8ClampedArray {
  context.clearRect(0, 0, probeSize * 2, probeSize);
  context.fillStyle = colour;
  context.fillText(glyph, 0, 0);
  return context.getImageData(0, 0, probeSize * 2, probeSize).data;
}

/**
 * Whether `glyph` draws as one colour emoji: something is drawn, the fill colour does not change it
 * (a missing glyph or plain letters take the fill colour), and it is no wider than one emoji (an
 * unknown sequence draws as its parts side by side).
 */
function isDrawn(context: ProbeContext, glyph: string, emojiWidth: number): boolean {
  const red = drawProbe(context, glyph, '#ff0000');
  const blue = drawProbe(context, glyph, '#0000ff');
  if (!red.some((value) => value > 0)) return false;
  if (red.some((value, index) => value !== blue[index])) return false;
  return context.measureText(glyph).width <= emojiWidth * 1.5;
}

/**
 * What a canvas measures in `fontFamily`, or `null` when it cannot measure: no 2D context, or a
 * canvas the browser refuses to build or read back, as with readback denied by policy.
 */
function measureSupport(fontFamily: string): EmojiSupport | null {
  try {
    const canvas = new OffscreenCanvas(probeSize * 2, probeSize);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.font = `${probeSize}px ${fontFamily || 'sans-serif'}`;
    context.textBaseline = 'top';
    const emojiWidth = context.measureText('\u{1F600}').width;
    const newest = versionProbes.find(([, glyph]) => isDrawn(context, glyph, emojiWidth));
    // Without even the oldest emoji there is no colour emoji font to judge by.
    if (!newest) return unknownSupport;
    return { version: newest[0], countryFlags: isDrawn(context, flagProbe, emojiWidth) };
  } catch {
    return null;
  }
}

/**
 * What the platform draws in a font, measured once per font family on a canvas. A platform without
 * a canvas, or one that fails to measure, counts as unknown support, which leaves nothing out; a
 * failure is not kept, so the next picker measures again.
 */
export function detectEmojiSupport(fontFamily: string): EmojiSupport {
  if (typeof OffscreenCanvas === 'undefined') return unknownSupport;
  const known = measured.get(fontFamily);
  if (known) return known;
  const support = measureSupport(fontFamily);
  if (!support) return unknownSupport;
  measured.set(fontFamily, support);
  return support;
}

/**
 * What the platform draws in the font of the element in `ref`, measured before the first paint, or
 * `null` until then. Without `isEnabled` nothing is measured and nothing is left out.
 */
export function useEmojiSupport(
  ref: RefObject<HTMLElement | null>,
  isEnabled: boolean,
): EmojiSupport | null {
  const [support, setSupport] = useState<EmojiSupport | null>(null);
  useLayoutEffect(() => {
    if (!isEnabled) return;
    const element = ref.current;
    const font = element ? getOwnerWindow(element).getComputedStyle(element).fontFamily : '';
    setSupport(detectEmojiSupport(font));
  }, [isEnabled, ref]);
  return isEnabled ? support : unknownSupport;
}
