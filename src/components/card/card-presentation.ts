'use client';

// How much of an adaptive card shows, from the space its container gives it (UIC-CARD-7.1).

import { useState } from 'react';
import { useElementSize } from '../../utils/use-element-size.js';

/**
 * `full`: every region. `compact`: the leading content, title, summary and toggle, with the rest
 * behind the More button. `minimal`: a few characters of the title and the More button.
 */
export type CardPresentation = 'full' | 'compact' | 'minimal';

/** A size, in pixels, below which the card turns to a presentation: by width, height or either. */
export interface CardBreakpoint {
  width?: number | undefined;
  height?: number | undefined;
}

/**
 * The breakpoints the host sets for one card. There are no defaults: a presentation without a
 * breakpoint is never shown, and a card without any stays `full`.
 */
export interface CardPresentationSteps {
  compact?: CardBreakpoint | undefined;
  minimal?: CardBreakpoint | undefined;
}

/** How far past a breakpoint the card must grow before it shows more again, so it never flickers. */
const hysteresis = 8;

const order: readonly CardPresentation[] = ['minimal', 'compact', 'full'];

type Thresholds = Record<'compact' | 'minimal', number>;

/** The presentation for `size` along one axis, staying put inside the hysteresis band. */
function presentationFor(
  size: number,
  thresholds: Thresholds,
  current: CardPresentation,
): CardPresentation {
  const target: CardPresentation =
    size < thresholds.minimal ? 'minimal' : size < thresholds.compact ? 'compact' : 'full';
  if (order.indexOf(target) <= order.indexOf(current)) return target;
  // Growing: show more only once the size clears the breakpoint it is leaving by the band.
  const needed = current === 'minimal' ? thresholds.minimal : thresholds.compact;
  const next = order[order.indexOf(current) + 1] as CardPresentation;
  return size >= needed + hysteresis ? presentationFor(size, thresholds, next) : current;
}

const smaller = (a: CardPresentation, b: CardPresentation) =>
  order.indexOf(a) <= order.indexOf(b) ? a : b;

/** One axis's breakpoints; a missing one is never crossed. */
const thresholdsFor = (steps: CardPresentationSteps, axis: 'width' | 'height'): Thresholds => ({
  compact: steps.compact?.[axis] ?? -Infinity,
  minimal: steps.minimal?.[axis] ?? -Infinity,
});

/**
 * The presentation of a card from its border box against the host's breakpoints: the smaller of
 * what its width and its height call for. A card without breakpoints, or not measured yet, is
 * `full`. The card's size comes from its container, not its content, so a change of presentation
 * never changes the size it is measured by.
 */
export function useCardPresentation(
  element: HTMLElement | null,
  steps: CardPresentationSteps | undefined,
): CardPresentation {
  const isAdaptive = steps?.compact !== undefined || steps?.minimal !== undefined;
  const size = useElementSize(element, { box: 'border-box', enabled: isAdaptive });
  const [shown, setShown] = useState<CardPresentation>('full');
  if (!steps || !isAdaptive || !size) {
    if (shown !== 'full') setShown('full');
    return 'full';
  }
  const next = smaller(
    presentationFor(size.width, thresholdsFor(steps, 'width'), shown),
    presentationFor(size.height, thresholdsFor(steps, 'height'), shown),
  );
  if (next !== shown) setShown(next);
  return next;
}
