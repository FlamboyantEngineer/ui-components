'use client';

// The open state of a hover card: React Aria's tooltip state, with its open and close delays, its
// warm-up (right after a card closes, a neighbouring one opens at once) and one open card at a time,
// but kept apart from React Aria's registry of tooltips. In that registry a card closes when a
// tooltip inside it opens, and reopening the card closes that tooltip.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useOverlayTriggerState } from '../primitives/index.js';
import { useLatest } from './use-latest.js';

/** The shape of React Aria's `TooltipTriggerState`, which `usePreviewTrigger` drives. */
export interface PreviewState {
  readonly isOpen: boolean;
  /** Whether it opens or closes without an animation, as when one card replaces another. */
  readonly shouldSkipAnimation: boolean;
  /** Whether this is the last open preview, including a controlled opening. */
  isCurrent(): boolean;
  /** Opens after the delay (at once right after a card closed, or when `immediate`). */
  open(immediate?: boolean): void;
  /** Closes after the close delay, or at once when `immediate`. */
  close(immediate?: boolean): void;
}

export interface PreviewStateOptions {
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** Milliseconds before it opens. */
  delay: number;
  /** Milliseconds before it closes. */
  closeDelay: number;
}

/** How long after a card closes the next one still opens at once, at the least. */
const COOLDOWN = 500;

/** The open cards, each with the function that closes it at once. */
const openCards = new Map<object, () => void>();
let isWarm = false;
let cooldown: ReturnType<typeof setTimeout> | null = null;

function warmUp() {
  isWarm = true;
  if (cooldown) clearTimeout(cooldown);
  cooldown = null;
}

function coolDown(closeDelay: number) {
  if (cooldown) clearTimeout(cooldown);
  cooldown = setTimeout(
    () => {
      cooldown = null;
      isWarm = false;
    },
    Math.max(COOLDOWN, closeDelay),
  );
}

export function usePreviewState({
  delay,
  closeDelay,
  ...openState
}: PreviewStateOptions): PreviewState {
  const overlay = useOverlayTriggerState(openState);
  const [isInstant, setInstant] = useState(false);
  const [card] = useState(() => ({}));
  const latest = useLatest({ overlay, delay, closeDelay });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      openCards.delete(card);
    },
    [card],
  );
  const { isOpen } = overlay;
  const state = useMemo<PreviewState>(() => {
    const cancel = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
    const hide = (instant: boolean) => {
      cancel();
      openCards.delete(card);
      // A card that opened without an animation leaves without one too: flipping the flag while it
      // leaves would stall its exit.
      if (instant) setInstant(true);
      latest.current.overlay.close();
      coolDown(latest.current.closeDelay);
    };
    const show = (instant: boolean) => {
      cancel();
      for (const [other, closeNow] of openCards) if (other !== card) closeNow();
      openCards.set(card, () => hide(true));
      setInstant(instant);
      warmUp();
      latest.current.overlay.open();
    };
    const schedule = (wait: number, run: () => void) => {
      cancel();
      if (wait <= 0) return run();
      timer.current = setTimeout(() => {
        timer.current = null;
        run();
      }, wait);
    };
    return {
      isOpen,
      shouldSkipAnimation: isInstant,
      isCurrent: () => Array.from(openCards.keys()).at(-1) === card,
      open(immediate) {
        if (isOpen) return cancel();
        if (immediate || isWarm) return show(isWarm && !immediate);
        schedule(latest.current.delay, () => show(false));
      },
      close(immediate) {
        if (!isOpen) return cancel();
        schedule(immediate ? 0 : latest.current.closeDelay, () => hide(false));
      },
    };
  }, [isOpen, isInstant, card, latest]);
  useEffect(() => {
    if (!isOpen) return;
    openCards.set(card, () => state.close(true));
    return () => {
      openCards.delete(card);
    };
  }, [isOpen, card, state]);
  return state;
}
