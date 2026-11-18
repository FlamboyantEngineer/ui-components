'use client';

import { useState } from 'react';
import { useStateFor } from '../../utils/use-state-for.js';
import {
  clampTime,
  fitRange,
  getDefaultCursors,
  normalizeDomain,
  type SignalCursors,
  type SignalTimeRange,
} from './signal-model.js';

interface SignalViewOptions {
  domain: SignalTimeRange;
  range?: SignalTimeRange | undefined;
  defaultRange?: SignalTimeRange | undefined;
  onRangeChange?: ((range: SignalTimeRange) => void) | undefined;
  cursors?: SignalCursors | undefined;
  defaultCursors?: SignalCursors | undefined;
  onCursorsChange?: ((cursors: SignalCursors) => void) | undefined;
}

export interface SignalView {
  /** The data window, ends in order. */
  domain: SignalTimeRange;
  /** The visible range, fitted to the window. */
  range: SignalTimeRange;
  /** The cursors, kept inside the window. */
  cursors: SignalCursors;
  setRange: (range: SignalTimeRange) => void;
  setCursors: (cursors: SignalCursors) => void;
}

const isSamePair = (a: readonly [number, number], b: readonly [number, number]) =>
  Object.is(a[0], b[0]) && Object.is(a[1], b[1]);

/**
 * Whether `windowKey` is still the window the view mounted with: once it changes, the defaults
 * no longer apply, also if the window later comes back.
 */
function useIsFirstWindow(windowKey: string): boolean {
  const [first] = useState(windowKey);
  const [hasMoved, setHasMoved] = useState(false);
  if (!hasMoved && windowKey !== first) setHasMoved(true);
  return !hasMoved && windowKey === first;
}

/**
 * The visible range and the cursors of signal traces, each controlled or held here. Held values
 * start from their defaults and start again from the whole window when the window changes.
 */
export function useSignalView(options: SignalViewOptions): SignalView {
  const domain = normalizeDomain(options.domain);
  const windowKey = `${String(domain[0])}:${String(domain[1])}`;
  const isFirst = useIsFirstWindow(windowKey);
  const initialRange = fitRange((isFirst ? options.defaultRange : undefined) ?? domain, domain);
  const [ownRange, setOwnRange] = useStateFor<SignalTimeRange | null>(windowKey, null);
  const range = fitRange(options.range ?? ownRange ?? initialRange, domain);
  const [ownCursors, setOwnCursors] = useStateFor<SignalCursors | null>(windowKey, null);
  const shown =
    options.cursors ??
    ownCursors ??
    (isFirst ? options.defaultCursors : undefined) ??
    getDefaultCursors(initialRange);
  const cursors: SignalCursors = [clampTime(shown[0], domain), clampTime(shown[1], domain)];
  const setRange = (next: SignalTimeRange) => {
    const fitted = fitRange(next, domain);
    if (isSamePair(fitted, range)) return;
    if (options.range === undefined) setOwnRange(fitted);
    options.onRangeChange?.(fitted);
  };
  const setCursors = (next: SignalCursors) => {
    const kept: SignalCursors = [clampTime(next[0], domain), clampTime(next[1], domain)];
    if (isSamePair(kept, cursors)) return;
    if (options.cursors === undefined) setOwnCursors(kept);
    options.onCursorsChange?.(kept);
  };
  return { domain, range, cursors, setRange, setCursors };
}
