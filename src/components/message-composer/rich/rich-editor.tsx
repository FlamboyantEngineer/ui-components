'use client';

import { ProseMirror } from '@handlewithcare/react-prosemirror';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useCallback, useMemo, type RefObject } from 'react';
import { useLatest } from '../../../utils/use-latest.js';
import {
  decoratePlaceholder,
  useEditable,
  useSyncedEditorState,
} from '../../rich-text-editor/rich-text-editor.js';
import { composerHooks as hooks } from '../composer-hooks.js';
import { isSameMessage, type MessageComposerMessage } from '../composer-message.js';
import type { ComposerKeys } from '../composer-keys.js';
import type { ComposerState } from '../use-composer-state.js';
import { attachPastedFiles } from '../use-file-drop.js';
import { createComposerPlugins, createComposerState, pastePlainText } from './composer-commands.js';
import { parseComposerMessage, serializeComposerDocument } from './composer-markdown.js';
import { ComposerPillContext, composerNodeViews } from './composer-pill.js';
import { composerSchema, type PillAttributes } from './composer-schema.js';
import { RichComposerContent } from './rich-content.js';
import type { RichMessageComposerProps } from './rich-message-composer.js';

/** What the frame's tools call on the editor. */
export interface RichEditorHandle {
  insertText: (text: string) => void;
  insertPill: (pill: PillAttributes) => void;
  /** Adds a pill at the caret, or after the selection, as its own undo step. */
  addPill: (pill: PillAttributes) => void;
  focus: () => void;
}

export interface RichComposerEditorProps {
  props: RichMessageComposerProps;
  state: ComposerState<MessageComposerMessage>;
  keys: ComposerKeys;
  rootRef: RefObject<HTMLDivElement | null>;
  handleRef: RefObject<RichEditorHandle | null>;
}

const placeholderClass = hooks.slotClass('placeholder');

/**
 * The engine state, kept in step with the composer's message: an edit reports the new message, and
 * a message that differs from the shown document (sent, recalled, edited, restored) replaces it
 * with a fresh history and the caret at the end.
 */
function useComposerEditorState(
  value: MessageComposerMessage,
  onChange: (value: MessageComposerMessage) => void,
) {
  const plugins = useMemo(() => createComposerPlugins(composerSchema), []);
  return useSyncedEditorState({
    schema: composerSchema,
    value,
    onChange,
    parse: (message) => createComposerState(parseComposerMessage(message), plugins),
    serialize: serializeComposerDocument,
    isEqual: isSameMessage,
  });
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
  const synced = useComposerEditorState(state.value, state.setValue);
  const paste = usePasteHandlers(props);
  const editable = useEditable(isEditable);
  const { placeholder } = props;
  const decorations = useCallback(
    (current: EditorState) => decoratePlaceholder(current, placeholder, placeholderClass),
    [placeholder],
  );
  const pills = useMemo(
    () => ({ getReference: props.getReference, isEditable }),
    [props.getReference, isEditable],
  );
  return (
    <ComposerPillContext value={pills}>
      <ProseMirror
        nodeViewComponents={composerNodeViews}
        state={synced.state}
        dispatchTransaction={synced.dispatchTransaction}
        editable={editable}
        decorations={decorations}
        handlePaste={paste.handlePaste}
        handleDrop={paste.handleDrop}
      >
        <RichComposerContent {...editor} />
      </ProseMirror>
    </ComposerPillContext>
  );
}
