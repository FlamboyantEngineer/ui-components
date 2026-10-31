'use client';

import { ProseMirror, ProseMirrorDoc } from '@handlewithcare/react-prosemirror';
import type { Node, Schema } from 'prosemirror-model';
import { redo, redoDepth, undo, undoDepth } from 'prosemirror-history';
import type { EditorState, Transaction } from 'prosemirror-state';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import type { FieldControlProps, FieldState } from '../field/field.js';
import { decoratePlaceholder } from './editor-state.js';
import type { RichTextDocument } from './rich-text-document.js';
import {
  RichTextEditorContext,
  richTextEditorHooks as hooks,
  type RichTextEditorContextValue,
} from './rich-text-context.js';
import { TaskItemView } from './task-item-view.js';

/** The engine state behind an editor and the function that applies its transactions. */
export interface SyncedEditor {
  state: EditorState;
  dispatchTransaction: (tr: Transaction) => void;
}

interface EditorSurfaceProps {
  control: FieldControlProps;
  editor: SyncedEditor;
  placeholder: string | undefined;
  toolbar: ReactNode;
  children: ReactNode;
}

type ContentAttributes = Readonly<Record<string, string | undefined>>;

const nodeViewComponents = { taskItem: TaskItemView };

export interface SyncedEditorOptions<T> {
  /** The engine schema: a new one starts a fresh state. */
  schema: Schema;
  /** The value the document shows. */
  value: T;
  /** Reports the value of each edit. */
  onChange: (value: T) => void;
  /** A fresh state, with an empty history, showing `value`. */
  parse: (value: T) => EditorState;
  /** The value of a document. */
  serialize: (doc: Node) => T;
  /** Whether a new value is what the document already shows. Defaults to `Object.is`. */
  isEqual?: ((value: T, shown: T) => boolean) | undefined;
  /** The state once a new value replaces the shown document. Defaults to a fresh `parse`. */
  replace?: ((state: EditorState, value: T) => EditorState) | undefined;
}

/**
 * The engine state, kept in step with a value: an edit reports the new value, and a value that
 * differs from the shown document (a controlled change, a restore, a clear, a sent message) replaces
 * it, by `replace`. The rich-text editor and the rich composer share it, each with its own value.
 */
export function useSyncedEditorState<T>(options: SyncedEditorOptions<T>): SyncedEditor {
  const { schema, value, parse, serialize, isEqual = Object.is } = options;
  const [state, setState] = useState(() => parse(value));
  const [shown, setShown] = useState(value);
  if (state.schema !== schema) {
    setState(parse(value));
  } else if (value !== shown) {
    setShown(value);
    if (!isEqual(value, serialize(state.doc))) {
      setState(options.replace ? options.replace(state, value) : parse(value));
    }
  }
  const latest = useLatest(options);
  const dispatchTransaction = useCallback(
    (tr: Transaction) => {
      setState((current: EditorState) => current.apply(tr));
      if (!tr.docChanged) return;
      const next = latest.current.serialize(tr.doc);
      setShown(next);
      latest.current.onChange(next);
    },
    [latest],
  );
  return { state, dispatchTransaction };
}

/** The `editable` prop of an editor, which keeps its identity while `isEditable` does. */
export function useEditable(isEditable: boolean): () => boolean {
  return useCallback(() => isEditable, [isEditable]);
}

/**
 * The field state with the editor's history as its undo and redo (UIC-RICH-TEXT-EDITOR-3.4): the
 * field keeps no history of its own, so its shortcuts, `getFieldUndo` and the editor's commands
 * all step through the one history.
 */
export function withEditorHistory(
  field: FieldState<RichTextDocument>,
  { state, dispatchTransaction }: SyncedEditor,
): FieldState<RichTextDocument> {
  const isLocked = field.isReadOnly || field.isDisabled;
  return {
    ...field,
    canUndo: !isLocked && undoDepth(state) > 0,
    canRedo: !isLocked && redoDepth(state) > 0,
    undo: () => (isLocked ? undefined : undo(state, dispatchTransaction)),
    redo: () => (isLocked ? undefined : redo(state, dispatchTransaction)),
  };
}

/** The editable document inside the field: its toolbar, the content and the floating chrome. */
export function EditorSurface(props: EditorSurfaceProps) {
  const { control, placeholder } = props;
  const { state, dispatchTransaction } = props.editor;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [contentAttributes, setContentAttributes] = useState<ContentAttributes>({});
  const isEditable = !control.readOnly && !control.disabled;
  const context = useMemo<RichTextEditorContextValue>(
    () => ({ isEditable, surfaceRef, setContentAttributes }),
    [isEditable],
  );
  const editable = useEditable(isEditable);
  const placeholderClass = hooks.slotClass('placeholder');
  const decorations = useCallback(
    (current: EditorState) => decoratePlaceholder(current, placeholder, placeholderClass),
    [placeholder, placeholderClass],
  );
  return (
    <ProseMirror
      state={state}
      dispatchTransaction={dispatchTransaction}
      editable={editable}
      decorations={decorations}
      nodeViewComponents={nodeViewComponents}
    >
      <RichTextEditorContext value={context}>
        <div {...hooks.slot('frame')}>
          {props.toolbar ? <div {...hooks.slot('toolbar')}>{props.toolbar}</div> : null}
          <div {...hooks.slot('surface')} ref={surfaceRef} style={{ position: 'relative' }}>
            <ProseMirrorDoc
              {...contentAttributes}
              {...hooks.slot('content', { readonly: control.readOnly, disabled: control.disabled })}
              ref={control.ref}
              id={control.id}
              role="textbox"
              aria-multiline="true"
              aria-label={control['aria-label']}
              aria-labelledby={control['aria-labelledby']}
              aria-describedby={control['aria-describedby']}
              aria-errormessage={control['aria-errormessage']}
              aria-invalid={control['aria-invalid']}
              aria-required={control['aria-required']}
              aria-readonly={control.readOnly || undefined}
              aria-disabled={control.disabled || undefined}
              aria-placeholder={placeholder}
              tabIndex={control.readOnly && !control.disabled ? 0 : undefined}
            />
            {props.children}
          </div>
        </div>
      </RichTextEditorContext>
    </ProseMirror>
  );
}
