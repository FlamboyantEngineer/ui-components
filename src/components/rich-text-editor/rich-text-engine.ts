// The contract every rich-text engine keeps, rendered or headless: one editor state, the
// transactions it gates and the commits it reports. Types only, so a server reads it too.

import type { EditorState, Selection, Transaction } from 'prosemirror-state';
import type { EditorProps, EditorView } from 'prosemirror-view';

/** The two ways a dispatch body commits; a body that calls neither drops the transaction. */
export interface RichTextEngineCommit {
  /** Commits the current state with the transaction applied, or with `override` instead. */
  applyDefault: (override?: Transaction) => void;
  /** Commits a state the body computed, such as one with several transactions applied. */
  applyState: (next: EditorState) => void;
}

/**
 * What every engine takes beside its state: the view props its plugins and handlers read, the
 * body every transaction passes through and the notifications of each commit.
 */
export interface RichTextEngineEvents {
  /** View props beside the plugins' own: `editable`, `attributes`, `handleTextInput` and others. */
  props?: Readonly<EditorProps> | undefined;
  /**
   * Receives every transaction and decides what commits. Defaults to `applyDefault()`, so every
   * transaction commits.
   */
  dispatchTransaction?:
    ((tr: Transaction, view: EditorView, commit: RichTextEngineCommit) => void) | undefined;
  /** Sees every transaction before the dispatch body, committed or not. */
  onTransaction?: ((tr: Transaction, view: EditorView) => void) | undefined;
  /** A committed transaction moved the selection. */
  onSelectionChange?: ((selection: Selection, view: EditorView) => void) | undefined;
  /** A transaction committed; `view.state` is the new state. Never fires for `replaceState`. */
  onUpdated?: ((view: EditorView, previous: EditorState) => void) | undefined;
  /** Any state committed: the first one, a transaction's or a replacement. */
  afterCommit?: ((view: EditorView) => void) | undefined;
  /** The view exists, once, after its first commit. */
  onMounted?: ((view: EditorView) => void) | undefined;
  /** The view and its plugin views are destroyed, once. */
  onUnmounted?: (() => void) | undefined;
}

/** A headless engine: its first state, with every plugin it runs, and its events. */
export interface RichTextEngineOptions extends RichTextEngineEvents {
  state: EditorState;
}

/** A running engine. */
export interface RichTextEngineHandle {
  /** The engine's view; plugins and commands take it as they take a rendered view. */
  readonly view: EditorView;
  /** The view, or null once the engine is destroyed. */
  getView(): EditorView | null;
  /** Replaces the whole state; settles once it is committed. Never fires `onUpdated`. */
  replaceState(next: EditorState): Promise<void>;
  /** Destroys the view and its plugin views. */
  destroy(): void;
  /** Settles once the view and its plugin views are destroyed. */
  whenDestroyed(): Promise<void>;
}
