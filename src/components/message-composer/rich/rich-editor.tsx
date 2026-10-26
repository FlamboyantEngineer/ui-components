import { ProseMirror } from '@handlewithcare/react-prosemirror';
import type { EditorState, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { useCallback, useMemo, useState, type RefObject } from 'react';
import { useLatest } from '../../../utils/use-latest.js';
import { composerHooks as hooks } from '../composer-hooks.js';
import { isSameMessage, type MessageComposerMessage } from '../composer-message.js';
import type { MessageComposerSubmitShortcut } from '../message-composer.js';
import type { ComposerState } from '../use-composer-state.js';
import { attachPastedFiles } from '../use-file-drop.js';
import { createComposerPlugins, createComposerState, pastePlainText } from './composer-commands.js';
import { parseComposerMessage, serializeComposerDocument } from './composer-markdown.js';
import { composerSchema, type PillAttributes } from './composer-schema.js';
import { RichComposerContent } from './rich-content.js';
import type { RichMessageComposerProps } from './rich-message-composer.js';

/** What the frame's tools call on the editor. */
export interface RichEditorHandle {
  insertText: (text: string) => void;
  insertPill: (pill: PillAttributes) => void;
  focus: () => void;
}

export interface RichComposerEditorProps {
  props: RichMessageComposerProps;
  state: ComposerState<MessageComposerMessage>;
  shortcut: MessageComposerSubmitShortcut;
  rootRef: RefObject<HTMLDivElement | null>;
  handleRef: RefObject<RichEditorHandle | null>;
}

const placeholderClass = hooks.slotClass('placeholder');

/** Marks the empty document's only line with the placeholder text. */
function decoratePlaceholder(state: EditorState, placeholder: string | undefined): DecorationSet {
  const { doc } = state;
  const first = doc.firstChild;
  const isEmpty = doc.childCount === 1 && first?.isTextblock && first.content.size === 0;
  if (!placeholder || !first || !isEmpty) return DecorationSet.empty;
  const attrs = { class: placeholderClass, 'data-placeholder': placeholder };
  return DecorationSet.create(doc, [Decoration.node(0, first.nodeSize, attrs)]);
}

/**
 * The engine state, kept in step with the composer's message: an edit reports the new message, and
 * a message that differs from the shown document (sent, recalled, edited, restored) replaces it
 * with a fresh history and the caret at the end.
 */
function useSyncedEditorState(
  value: MessageComposerMessage,
  onEdit: (value: MessageComposerMessage) => void,
) {
  const plugins = useMemo(() => createComposerPlugins(composerSchema), []);
  const [state, setState] = useState(() =>
    createComposerState(parseComposerMessage(value), plugins),
  );
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    if (!isSameMessage(value, serializeComposerDocument(state.doc))) {
      setState(createComposerState(parseComposerMessage(value), plugins));
    }
  }
  const latestEdit = useLatest(onEdit);
  const dispatchTransaction = useCallback(
    (tr: Transaction) => {
      setState((current) => current.apply(tr));
      if (!tr.docChanged) return;
      const next = serializeComposerDocument(tr.doc);
      setShown(next);
      latestEdit.current(next);
    },
    [latestEdit],
  );
  return { state, dispatchTransaction };
}

/** Pasted files go to `onAttach`; pasted text goes in as plain text, keeping its spacing. */
function usePasteHandlers(props: RichMessageComposerProps) {
  const latest = useLatest(props);
  const handlePaste = useCallback(
    (view: EditorView, event: ClipboardEvent) => {
      const { isDisabled, onAttach } = latest.current;
      if (attachPastedFiles(event, isDisabled ? undefined : onAttach)) return true;
      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (!text) return false;
      pastePlainText(view, text);
      return true;
    },
    [latest],
  );
  // Dropped files are the composer's to attach; the document keeps only dropped text.
  const handleDrop = useCallback(
    (_view: EditorView, event: DragEvent) =>
      Boolean(latest.current.onAttach) && (event.dataTransfer?.files.length ?? 0) > 0,
    [latest],
  );
  return { handlePaste, handleDrop };
}

/** The rich composer's ProseMirror editor, in step with the composer's message. */
export function RichComposerEditor(editor: RichComposerEditorProps) {
  const { props, state } = editor;
  const isEditable = !props.isDisabled;
  const synced = useSyncedEditorState(state.value, state.setValue);
  const paste = usePasteHandlers(props);
  const { placeholder } = props;
  const decorations = useCallback(
    (current: EditorState) => decoratePlaceholder(current, placeholder),
    [placeholder],
  );
  return (
    <ProseMirror
      state={synced.state}
      dispatchTransaction={synced.dispatchTransaction}
      editable={() => isEditable}
      decorations={decorations}
      handlePaste={paste.handlePaste}
      handleDrop={paste.handleDrop}
    >
      <RichComposerContent {...editor} />
    </ProseMirror>
  );
}
