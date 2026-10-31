'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { listAnimations } from './list-animations.js';

/** Where an element is in its life: entering and exiting last while its animations run. */
type EnterExitPhase = 'closed' | 'entering' | 'open' | 'exiting';

export interface EnterExitState {
  /** Render the element: true while open and through its exit animations. */
  isMounted: boolean;
  /** The element has just appeared and its enter animations are running; publish `data-entering`. */
  isEntering: boolean;
  /** The element is closing and its exit animations are running; publish `data-exiting`. */
  isExiting: boolean;
}

function resolvePhase(phase: EnterExitPhase, isOpen: boolean): EnterExitPhase {
  if (isOpen) return phase === 'closed' ? 'entering' : phase === 'exiting' ? 'open' : phase;
  return phase === 'entering' || phase === 'open' ? 'exiting' : phase;
}

/** Calls `onEnd` once the element's running animations finish, or at once when it has none. */
function waitForAnimations(element: Element | null, onEnd: () => void): () => void {
  const animations = listAnimations(element);
  if (animations.length === 0) {
    onEnd();
    return () => {};
  }
  let isCancelled = false;
  const finish = () => {
    // Commit at once, so the element never paints in its unanimated state after an exit.
    if (!isCancelled) flushSync(onEnd);
  };
  Promise.all(animations.map((animation) => animation.finished)).then(finish, finish);
  return () => {
    isCancelled = true;
  };
}

/**
 * Keeps an element mounted through its exit and reports when it is entering or exiting, so a
 * stylesheet can animate `data-entering` and `data-exiting` as it does for React Aria overlays.
 * Each phase lasts until the CSS animations and transitions running on the element finish; with
 * none, it ends before the browser paints.
 */
export function useEnterExit(ref: RefObject<Element | null>, isOpen: boolean): EnterExitState {
  const [phase, setPhase] = useState<EnterExitPhase>(isOpen ? 'entering' : 'closed');
  const current = resolvePhase(phase, isOpen);
  if (current !== phase) setPhase(current);

  useLayoutEffect(() => {
    if (current !== 'entering' && current !== 'exiting') return undefined;
    const next = current === 'entering' ? 'open' : 'closed';
    return waitForAnimations(ref.current, () => {
      setPhase((latest) => (latest === current ? next : latest));
    });
  }, [current, ref]);

  return {
    isMounted: current !== 'closed',
    isEntering: current === 'entering',
    isExiting: current === 'exiting',
  };
}
