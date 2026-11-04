'use client';

import { ProseMirror } from '@handlewithcare/react-prosemirror';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { type RefObject, useCallback, useMemo } from 'react';
import { useLatest } from '../../../utils/use-latest.js';
import {
  decoratePlaceholder,
  domSelectionEvents,
  useEditable,
  useSyncedEditorState,
} from '../../rich-text-editor/rich-text-editor.js';
import { composerHooks as hooks } from '../composer-hooks.js';
import type { ComposerKeys } from '../composer-keys.js';
import { isSameMessage, type MessageComposerMessage } from '../composer-message.js';
import type { ComposerState } from '../use-composer-state.js';
import { attachPastedFiles } from '../use-file-drop.js';
import { createComposerPlugins, createComposerState, pastePlainText } from './composer-commands.js';
import { replaceShownMessage } from './composer-edits.js';
import { parseComposerMessage, serializeComposerDocument } from './composer-markdown.js';
import { createPendingPastePlugin, pasteThroughHost } from './composer-paste.js';
import { composerNodeViews, ComposerPillContext } from './composer-pill.js';
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
  /** Reads or edits through the mounted editor's view. */
  withView: <T>(run: (view: EditorView) => T) => T;
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
 * with a fresh history and the caret at the end. Another owner of the message (draft key, storage
 * or edit) starts a fresh history too, even when its text is the same.
 */
function useComposerEditorState({
  value,
  setValue: onChange,
  owner,
}: Pick<ComposerState<MessageComposerMessage>, 'value' | 'setValue' | 'owner'>) {
  const plugins = useMemo(
    () => [...createComposerPlugins(composerSchema), createPendingPastePlugin()],
    [],
  );
  const parse = (message: MessageComposerMessage) =>
    createComposerState(parseComposerMessage(message), plugins);
  return useSyncedEditorState({
    schema: composerSchema,
    value,
    onChange,
    parse,
    serialize: serializeComposerDocument,
    isEqual: isSameMessage,
    // A value from outside keeps the selection's place in the text (UIC-MESSAGE-COMPOSER-4.11).
    replace: (current, message) => replaceShownMessage(current, parse(message)),
    owner,
  });
}

/**
 * Pasted files go to `onAttach`; pasted text goes to the host's `onPaste` first, then in as plain
 * text, keeping its spacing.
 */
function usePasteHandlers(
  props: RichMessageComposerProps,
  state: ComposerState<MessageComposerMessage>,
) {
  const latest = useLatest({ props, state });
  const handlePaste = useCallback(
    (view: EditorView, event: ClipboardEvent) => {
      const { isDisabled, onAttach, onPaste } = latest.current.props;
      if (attachPastedFiles(event, isDisabled ? undefined : onAttach)) return true;
      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (!text) return false;
      const { owner } = latest.current.state;
      // A late answer edits only the draft it was pasted into, while the composer still takes edits.
      const isCurrent = () => {
        const now = latest.current;
        return now.state.owner === owner && !now.props.isDisabled && !now.state.isSubmitting;
      };
      if (onPaste && pasteThroughHost(view, text, { onPaste, isCurrent })) return true;
      pastePlainText(view, text);
      return true;
    },
    [latest],
  );
  // Dropped files are the composer's to attach; the document keeps only dropped text.
  const handleDrop = useCallback(
    (_view: EditorView, event: DragEvent) =>
      Boolean(latest.current.props.onAttach) && (event.dataTransfer?.files.length ?? 0) > 0,
    [latest],
  );
  return { handlePaste, handleDrop };
}

/** The rich composer's ProseMirror editor, in step with the composer's message. */
export function RichComposerEditor(editor: RichComposerEditorProps) {
  const { props, state } = editor;
  const isEditable = !props.isDisabled;
  const synced = useComposerEditorState(state);
  const paste = usePasteHandlers(props, state);
  const editable = useEditable(isEditable);
  const { placeholder } = props;
  const decorations = useCallback(
    (current: EditorState) => decoratePlaceholder(current, placeholder, placeholderClass),
    [placeholder],
  );
  const pills = useMemo(
    () => ({ getReference: props.getReference, isEditable, triggers: props.triggers }),
    [props.getReference, isEditable, props.triggers],
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
        handleDOMEvents={domSelectionEvents}
      >
        <RichComposerContent {...editor} />
      </ProseMirror>
    </ComposerPillContext>
  );
}
