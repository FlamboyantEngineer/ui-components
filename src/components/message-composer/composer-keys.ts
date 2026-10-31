'use client';

// The composer's own keys: the send, queue and send-now chords, Escape in edit mode and the arrows
// that recall.

import { useSyncExternalStore } from 'react';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { formatAriaKeyShortcuts, matchesChord, type ShortcutChord } from '../shortcut/shortcut.js';
import type { MessageComposerChords, MessageComposerShortcuts } from './message-composer.js';
import type { RecallDirection } from './use-composer-state.js';

/** What the composer reads from a native key event. */
type ComposerKey = Pick<
  KeyboardEvent,
  'key' | 'code' | 'keyCode' | 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'isComposing'
>;

/** The chords the composer answers to in its current state. */
export interface ComposerKeys {
  /** Sends: `send`'s chords while idle or editing, `queue`'s while a reply runs. The first shows on the button. */
  submit: readonly ShortcutChord[];
  /** Sends at once while a reply runs: `sendNow`'s chords. */
  submitNow: readonly ShortcutChord[];
}

/** What the composer does with its keys. */
export interface ComposerKeyActions {
  keys: ComposerKeys;
  submit: () => void;
  submitNow: () => void;
  isEditing: boolean;
  onCancel: (() => void) | undefined;
  recall: (direction: RecallDirection) => boolean;
}

interface ComposerKeyState {
  /** A reply is running. */
  isPending: boolean;
  isEditing: boolean;
}

const defaultShortcuts = {
  send: ['Enter', 'Ctrl+Enter'],
  queue: ['Enter'],
  sendNow: ['Ctrl+Enter'],
} as const satisfies Required<MessageComposerShortcuts>;

/** What sends on a touch screen once the bare Enter is a line break and nothing else sends. */
const touchSend: readonly ShortcutChord[] = ['Ctrl+Enter'];

const coarsePointer = '(pointer: coarse)';

// The pointer is the device's, the same in every window, and it is read in render before there is
// an element, so it is asked of the script's own window.
/* eslint-disable no-restricted-globals */
function readCoarsePointer(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(coarsePointer).matches;
}

function subscribeToPointer(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(coarsePointer);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
/* eslint-enable no-restricted-globals */

function isChordList(chords: MessageComposerChords): chords is readonly ShortcutChord[] {
  return Array.isArray(chords);
}

function toChordList(chords: MessageComposerChords): readonly ShortcutChord[] {
  return isChordList(chords) ? chords : [chords];
}

function isBareEnter(chord: ShortcutChord): boolean {
  return formatAriaKeyShortcuts(chord) === 'Enter';
}

function matchesAny(event: ComposerKey, chords: readonly ShortcutChord[]): boolean {
  return chords.some((chord) => matchesChord(event, chord));
}

function toRecallDirection(event: ComposerKey): RecallDirection | null {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) {
    return null;
  }
  if (event.key === 'ArrowUp') return 'older';
  return event.key === 'ArrowDown' ? 'newer' : null;
}

/** Whether the primary pointer is coarse (a touch screen), followed as it changes. */
function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribeToPointer, readCoarsePointer, () => false);
}

/**
 * The chords for the composer's state: `send`'s while idle or editing, `queue`'s and `sendNow`'s
 * while a reply runs, each defaulting on its own. On a touch screen a bare Enter breaks the line,
 * and Ctrl+Enter sends when that leaves nothing to send with.
 */
function resolveComposerKeys(
  shortcuts: MessageComposerShortcuts | undefined,
  { isPending, isEditing }: ComposerKeyState,
  isCoarsePointer: boolean,
): ComposerKeys {
  const pick = (chords: MessageComposerChords) => {
    const list = toChordList(chords);
    return isCoarsePointer ? list.filter((chord) => !isBareEnter(chord)) : list;
  };
  if (!isPending || isEditing) {
    const submit = pick(shortcuts?.send ?? defaultShortcuts.send);
    return { submit: submit.length === 0 && isCoarsePointer ? touchSend : submit, submitNow: [] };
  }
  return {
    submit: pick(shortcuts?.queue ?? defaultShortcuts.queue),
    submitNow: pick(shortcuts?.sendNow ?? defaultShortcuts.sendNow),
  };
}

/** The chords for the composer's state, on this device. */
export function useComposerKeys(
  shortcuts: MessageComposerShortcuts | undefined,
  state: ComposerKeyState,
): ComposerKeys {
  return resolveComposerKeys(shortcuts, state, useCoarsePointer());
}

/**
 * Runs the composer's own key: a chord that sends or sends now (the sending chords come first),
 * Escape to cancel an edit, and the arrows that recall earlier messages; returns whether it used
 * the key. A key that belongs to an input method composition never sends.
 */
export function runComposerKey(event: ComposerKey, actions: ComposerKeyActions): boolean {
  if (!isComposingKey(event)) {
    if (matchesAny(event, actions.keys.submit)) {
      actions.submit();
      return true;
    }
    if (matchesAny(event, actions.keys.submitNow)) {
      actions.submitNow();
      return true;
    }
  }
  if (event.key === 'Escape' && actions.isEditing && !event.isComposing) {
    actions.onCancel?.();
    return true;
  }
  const direction = toRecallDirection(event);
  return direction ? actions.recall(direction) : false;
}
