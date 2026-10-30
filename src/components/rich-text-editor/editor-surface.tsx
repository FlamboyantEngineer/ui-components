'use client';

import { ProseMirror, ProseMirrorDoc } from '@handlewithcare/react-prosemirror';
import type { Schema } from 'prosemirror-model';
import { redo, redoDepth, undo, undoDepth } from 'prosemirror-history';
import type { EditorState, Transaction } from 'prosemirror-state';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FieldControlProps, FieldState } from '../field/field.js';
import {
  createEditorPlugins,
  createEditorState,
  decoratePlaceholder,
  replaceDocument,
  toRichTextJson,
} from './editor-state.js';
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

/**
 * The engine state, kept in step with the field's value: an edit reports the new document, and a
 * value that differs from the shown document (a controlled change, a restore, a clear) replaces it.
 * The reported documents share every part an edit leaves alone (`toRichTextJson`).
 */
export function useSyncedEditorState(
  schema: Schema,
  value: RichTextDocument,
  onChange: (value: RichTextDocument) => void,
): SyncedEditor {
  const plugins = useMemo(() => createEditorPlugins(schema), [schema]);
  const [state, setState] = useState(() => createEditorState(schema, value, plugins));
  const [shown, setShown] = useState(value);
  if (state.schema !== schema) {
    setState(createEditorState(schema, value, plugins));
  } else if (value !== shown) {
    setShown(value);
    setState(replaceDocument(state, value));
  }
  const dispatchTransaction = useCallback(
    (tr: Transaction) => {
      setState((current: EditorState) => current.apply(tr));
      if (!tr.docChanged) return;
      const next = toRichTextJson(tr.doc) as RichTextDocument;
      setShown(next);
      onChange(next);
    },
    [onChange],
  );
  return { state, dispatchTransaction };
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
  const placeholderClass = hooks.slotClass('placeholder');
  const decorations = useCallback(
    (current: EditorState) => decoratePlaceholder(current, placeholder, placeholderClass),
    [placeholder, placeholderClass],
  );
  return (
    <ProseMirror
      state={state}
      dispatchTransaction={dispatchTransaction}
      editable={() => isEditable}
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
