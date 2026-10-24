import { ProseMirror, ProseMirrorDoc } from '@handlewithcare/react-prosemirror';
import type { Schema } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FieldControlProps } from '../field/field.js';
import {
  createEditorPlugins,
  createEditorState,
  decoratePlaceholder,
  replaceDocument,
} from './editor-state.js';
import type { RichTextDocument } from './rich-text-document.js';
import {
  RichTextEditorContext,
  richTextEditorHooks as hooks,
  type RichTextEditorContextValue,
} from './rich-text-context.js';
import { TaskItemView } from './task-item-view.js';

export interface EditorSurfaceProps {
  control: FieldControlProps;
  schema: Schema;
  value: RichTextDocument;
  onChange: (value: RichTextDocument) => void;
  placeholder: string | undefined;
  toolbar: ReactNode;
  children: ReactNode;
}

type ContentAttributes = Readonly<Record<string, string | undefined>>;

const nodeViewComponents = { taskItem: TaskItemView };

/**
 * The engine state, kept in step with the field's value: an edit reports the new document, and a
 * value that differs from the shown document (a controlled change, a restore, a field undo)
 * replaces it.
 */
function useSyncedEditorState(
  schema: Schema,
  value: RichTextDocument,
  onChange: (value: RichTextDocument) => void,
) {
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
      const next = tr.doc.toJSON() as RichTextDocument;
      setShown(next);
      onChange(next);
    },
    [onChange],
  );
  return { state, dispatchTransaction };
}

/** The editable document inside the field: its toolbar, the content and the floating chrome. */
export function EditorSurface(props: EditorSurfaceProps) {
  const { control, schema, placeholder } = props;
  const { state, dispatchTransaction } = useSyncedEditorState(schema, props.value, props.onChange);
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
