'use client';

// A card grid item's selection checkbox, which the card it holds draws at the start of its header
// row so the checkbox takes its own room there instead of lying over the header's controls.

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface CardSelectionSlot {
  /** The checkbox, for the card that claimed it. */
  checkbox: ReactNode;
  /** The card that draws the checkbox, if one claimed it. */
  claimant: string | null;
  /** Claims the checkbox for a card; the returned function gives it back. */
  claim: (card: string) => () => void;
}

/** The selection checkbox a grid item offers the card it holds; `null` outside one. */
export const CardSelectionContext = createContext<CardSelectionSlot | null>(null);

/**
 * The grid item's side: the context value offering `checkbox`, and whether a card claimed it. An
 * item whose content is no card draws the checkbox itself.
 */
export function useCardSelectionSlot(checkbox: ReactNode) {
  const [claimant, setClaimant] = useState<string | null>(null);
  const claim = useCallback((card: string) => {
    setClaimant((current) => current ?? card);
    return () => setClaimant((current) => (current === card ? null : current));
  }, []);
  const slot = useMemo(() => ({ checkbox, claimant, claim }), [checkbox, claimant, claim]);
  return { slot, isClaimed: claimant !== null };
}

/**
 * The card's side: claims the checkbox of the grid item holding it, before paint, and returns it
 * once claimed. Only the item's first card claims it; nested cards are outside the context.
 */
export function useClaimedSelection(): ReactNode {
  const slot = useContext(CardSelectionContext);
  const card = useId();
  const claim = slot?.claim;
  useLayoutEffect(() => claim?.(card), [claim, card]);
  return slot?.claimant === card ? slot.checkbox : null;
}
