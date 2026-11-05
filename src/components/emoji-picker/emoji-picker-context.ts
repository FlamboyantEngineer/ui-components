'use client';

import { createContext, useContext } from 'react';
import { useStoreValue } from '../../utils/use-store-value.js';
import { type EmojiSelection, toEmojiSelection } from './emoji-catalog.js';
import type { EmojiPickerState } from './emoji-picker-state.js';

/** The state an `EmojiPicker` shares with its parts. */
export const EmojiPickerContext = createContext<EmojiPickerState | null>(null);

/**
 * How an `EmojiPickerTrigger` closes its popover once its picker reports a choice. A picker outside
 * one closes nothing, not even an overlay around it.
 */
export const EmojiPickerDismissContext = createContext<(() => void) | null>(null);

/** The state of the enclosing `EmojiPicker`, for one of its parts. */
export function useEmojiPickerContext(): EmojiPickerState {
  const state = useContext(EmojiPickerContext);
  if (!state) throw new Error('Emoji picker parts must be rendered inside an EmojiPicker.');
  return state;
}

/**
 * The emoji last hovered or focused in the enclosing `EmojiPicker`, as the selection choosing it
 * would report in the current skin tone, or `null` before any.
 */
export function useActiveEmoji(): EmojiSelection | null {
  const { activeEmoji, tone } = useEmojiPickerContext();
  const active = useStoreValue(activeEmoji);
  return active ? toEmojiSelection(active, tone) : null;
}
