'use client';

// Interceptable paste in the rich composer: a host may take pasted text, answer with a message
// fragment at once or later, or refuse it (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-4.12).

import { Plugin, PluginKey, type EditorState, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { isThenable } from '../../../utils/is-thenable.js';
import type { MessageComposerMessage } from '../composer-message.js';
import {
  readTextSelection,
  replaceMessageRange,
  type MessageComposerRange,
} from './composer-edits.js';
import { toTextOffset } from './composer-offsets.js';
import { createPlainPaste } from './composer-commands.js';

/** What a host's `onPaste` hears: the pasted text and the range of the message it replaces. */
export interface MessageComposerPaste {
  text: string;
  range: MessageComposerRange;
}

/**
 * What `onPaste` answers: nothing for the composer's own plain-text paste; `null` to refuse the
 * paste; a fragment to paste in its place; or a promise of one, while the plain text goes in at
 * once and the fragment later replaces it.
 */
export type MessageComposerPasteResult =
  MessageComposerMessage | null | undefined | Promise<MessageComposerMessage | null | undefined>;

/** Pasted text waiting for the host's answer: where it lies now and what it read when pasted. */
interface PendingPaste {
  from: number;
  to: number;
  text: string;
}

type PendingPastes = ReadonlyMap<number, PendingPaste>;

interface PendingMeta {
  add?: { id: number; paste: PendingPaste };
  remove?: number;
}

const pendingKey = new PluginKey<PendingPastes>('composerPendingPaste');

function mapPending(pastes: PendingPastes, tr: Transaction, meta: PendingMeta | undefined) {
  const next = new Map<number, PendingPaste>();
  for (const [id, paste] of pastes) {
    if (id === meta?.remove) continue;
    const from = tr.mapping.mapResult(paste.from, 1);
    const to = tr.mapping.mapResult(paste.to, -1);
    if (from.deletedAcross || to.deletedAcross || from.pos > to.pos) continue;
    next.set(id, { ...paste, from: from.pos, to: to.pos });
  }
  if (meta?.add) next.set(meta.add.id, meta.add.paste);
  return next;
}

/**
 * Keeps each pasted text that waits for an answer mapped through later edits. A fresh state
 * (another draft owner, a sent or recalled message, a value from outside) starts with none, so a
 * late answer finds nothing to replace.
 */
export function createPendingPastePlugin(): Plugin<PendingPastes> {
  return new Plugin<PendingPastes>({
    key: pendingKey,
    state: {
      init: () => new Map(),
      apply(tr, pastes) {
        const meta = tr.getMeta(pendingKey) as PendingMeta | undefined;
        return tr.docChanged || meta ? mapPending(pastes, tr, meta) : pastes;
      },
    },
  });
}

let nextPasteId = 1;

/** The pasted text's range now, if it still reads as it did when pasted. */
function findPending(state: EditorState, id: number): PendingPaste | null {
  const paste = pendingKey.getState(state)?.get(id);
  if (!paste) return null;
  return state.doc.textBetween(paste.from, paste.to, '\n', '\n') === paste.text ? paste : null;
}

/** Pastes the plain text at once and keeps its range for the host's answer; returns its id. */
function pasteWhilePending(view: EditorView, text: string): number {
  const id = nextPasteId++;
  const { selection } = view.state;
  const tr = createPlainPaste(view.state, text);
  const from = tr.mapping.map(selection.from, -1);
  const to = tr.mapping.map(selection.to, 1);
  const paste = { from, to, text: tr.doc.textBetween(from, to, '\n', '\n') };
  view.dispatch(tr.setMeta(pendingKey, { add: { id, paste } } satisfies PendingMeta));
  return id;
}

/** Puts the host's later answer in place of the pasted text, as an undo step of its own. */
function settlePending(
  view: EditorView,
  id: number,
  fragment: MessageComposerMessage | null | undefined,
) {
  if (view.isDestroyed) return;
  const paste = findPending(view.state, id);
  if (!paste) return;
  const { state } = view;
  if (!fragment) {
    view.dispatch(state.tr.setMeta(pendingKey, { remove: id } satisfies PendingMeta));
    return;
  }
  const range = {
    start: toTextOffset(state.doc, paste.from),
    end: toTextOffset(state.doc, paste.to),
  };
  const tr = replaceMessageRange(state, { range, fragment, keepSelection: true });
  view.dispatch(tr.setMeta(pendingKey, { remove: id } satisfies PendingMeta));
}

/** What a paste needs from the composer. */
interface HostPasteOptions {
  onPaste: (paste: MessageComposerPaste) => MessageComposerPasteResult;
  /** Whether a late answer may still edit: the same draft owner, editable and not sending. */
  isCurrent: () => boolean;
}

/**
 * Hands pasted text to the host's `onPaste` and acts on its answer. Returns `false` when the
 * composer pastes the plain text itself, as it does when the handler answers nothing or throws.
 */
export function pasteThroughHost(
  view: EditorView,
  text: string,
  options: HostPasteOptions,
): boolean {
  const range = readTextSelection(view.state);
  let result: MessageComposerPasteResult;
  try {
    result = options.onPaste({ text, range });
  } catch {
    return false;
  }
  if (result === undefined) return false;
  if (result === null) return true;
  if (!isThenable(result)) {
    view.dispatch(replaceMessageRange(view.state, { range, fragment: result }));
    return true;
  }
  const id = pasteWhilePending(view, text);
  const settle = (fragment: MessageComposerMessage | null | undefined) =>
    settlePending(view, id, options.isCurrent() ? fragment : null);
  result.then(settle, () => settle(null));
  return true;
}
