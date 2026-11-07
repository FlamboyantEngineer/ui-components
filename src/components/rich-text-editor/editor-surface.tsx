'use client';

import { ProseMirror, ProseMirrorDoc } from '@handlewithcare/react-prosemirror';
import { redo, redoDepth, undo, undoDepth } from 'prosemirror-history';
import type { Node, Schema } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';
import { type ReactNode, useCallback, useId, useMemo, useRef, useState } from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useLatest } from '../../utils/use-latest.js';
import type { FieldControlProps, FieldState } from '../field/field.js';
import { decorateMarkers, placeMarkers, type RichTextBlockMarker } from './block-markers.js';
import { defaultMarks, defaultNodes } from './default-schema.js';
import { domSelectionEvents } from './dom-selection-sync.js';
import { decoratePlaceholder } from './editor-state.js';
import { findEngineKit } from './engine-schema.js';
import { LinkMarkView } from './link-mark-view.js';
import {
  getGutter,
  type GutterControls,
  RichTextEditorContext,
  type RichTextEditorContextValue,
  richTextEditorHooks as hooks,
} from './rich-text-context.js';
import type { RichTextDocument } from './rich-text-document.js';
import { SurfaceScrollbars } from './surface-scrollbars.js';
import { TaskItemView } from './task-item-view.js';

/** The engine state behind an editor and the function that applies its transactions. */
interface SyncedEditor {
  state: EditorState;
  dispatchTransaction: (tr: Transaction) => void;
}

interface EditorSurfaceProps {
  control: FieldControlProps;
  editor: SyncedEditor;
  placeholder: string | undefined;
  toolbar: ReactNode;
  children: ReactNode;
  /** The host's findings about blocks, marked on the blocks and in the scroll track. */
  blockMarkers?: readonly RichTextBlockMarker[] | undefined;
}

const noMarkers: readonly RichTextBlockMarker[] = [];

type ContentAttributes = Readonly<Record<string, string | undefined>>;

const defaultTaskViews = { taskItem: TaskItemView };
const defaultLinkViews = { link: LinkMarkView };

type ViewComponents = Record<string, never>;

interface SchemaViews {
  nodes: ViewComponents;
  marks: ViewComponents;
}

/** The views of each schema, built once so the engine keeps its views between renders. */
const schemaViews = new WeakMap<Schema, SchemaViews>();

/**
 * The views of a schema: the default task item's and the default link's anchor (which leaves the
 * tab sequence when disabled), then those the schema's extensions contribute.
 */
function getViewComponents(schema: Schema): SchemaViews {
  let views = schemaViews.get(schema);
  if (views) return views;
  const kit = findEngineKit(schema);
  const taskViews = schema.nodes.taskItem?.spec === defaultNodes.taskItem ? defaultTaskViews : {};
  const linkViews = schema.marks.link?.spec === defaultMarks.link ? defaultLinkViews : {};
  views = {
    nodes: { ...taskViews, ...kit?.nodeViews } as ViewComponents,
    marks: { ...linkViews, ...kit?.markViews } as ViewComponents,
  };
  schemaViews.set(schema, views);
  return views;
}

interface SyncedEditorOptions<T> {
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
  /**
   * Whose value the document shows. Another owner (`Object.is`) starts a fresh `parse`, with an
   * empty history, even when its value equals the shown one, so undo never reaches another owner's
   * text.
   */
  owner?: unknown;
}

/**
 * The engine state, kept in step with a value: an edit reports the new value, and a value that
 * differs from the shown document (a controlled change, a restore, a clear, a sent message) replaces
 * it, by `replace`; another `owner` starts afresh. The rich-text editor and the rich composer share
 * it, each with its own value.
 */
export function useSyncedEditorState<T>(options: SyncedEditorOptions<T>): SyncedEditor {
  const { schema, value, parse, serialize, isEqual = Object.is } = options;
  const [state, setState] = useState(() => parse(value));
  const [shown, setShown] = useState(value);
  const [owner, setOwner] = useState(options.owner);
  if (!Object.is(owner, options.owner)) {
    setOwner(options.owner);
    setShown(value);
    setState(parse(value));
  } else if (state.schema !== schema) {
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

/** The content's decorations: the empty document's placeholder and the host's block markers. */
function useDecorations(
  placeholder: string | undefined,
  markers: readonly RichTextBlockMarker[],
): (state: EditorState) => DecorationSet {
  const placeholderClass = hooks.slotClass('placeholder');
  return useCallback(
    (current: EditorState) => {
      const empty = decoratePlaceholder(current, placeholder, placeholderClass);
      const marked = decorateMarkers(current.doc, placeMarkers(current.doc, markers));
      if (marked === DecorationSet.empty) return empty;
      return marked.add(current.doc, empty.find());
    },
    [placeholder, placeholderClass, markers],
  );
}

/** The editable document inside the field: its toolbar, the content and the floating chrome. */
export function EditorSurface(props: EditorSurfaceProps) {
  const { control, placeholder } = props;
  const { ref: contentRef, ...content } = control;
  const { state, dispatchTransaction } = props.editor;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [contentAttributes, setContentAttributes] = useState<ContentAttributes>({});
  const [gutterHolders, setGutterHolders] = useState<readonly GutterControls[]>([]);
  const reserveGutter = useCallback((controls: GutterControls) => {
    setGutterHolders((holders) => [...holders, controls]);
    return () => setGutterHolders((holders) => holders.filter((holder) => holder !== controls));
  }, []);
  const gutter = getGutter({
    grip: gutterHolders.some((holder) => holder.grip),
    menu: gutterHolders.some((holder) => holder.menu),
  });
  const isDisabled = Boolean(content.disabled);
  const isEditable = !content.readOnly && !isDisabled;
  const context = useMemo<RichTextEditorContextValue>(
    () => ({ isEditable, isDisabled, surfaceRef, setContentAttributes, reserveGutter }),
    [isEditable, isDisabled, reserveGutter],
  );
  const editable = useEditable(isEditable);
  const markers = props.blockMarkers ?? noMarkers;
  const placed = useMemo(() => placeMarkers(state.doc, markers), [state.doc, markers]);
  const decorations = useDecorations(placeholder, markers);
  const surfaceId = useId();
  return (
    <ProseMirror
      state={state}
      dispatchTransaction={dispatchTransaction}
      editable={editable}
      decorations={decorations}
      nodeViewComponents={getViewComponents(state.schema).nodes}
      markViewComponents={getViewComponents(state.schema).marks}
      handleDOMEvents={domSelectionEvents}
    >
      <RichTextEditorContext value={context}>
        <div {...hooks.slot('frame')}>
          {isEmptyNode(props.toolbar) ? null : (
            <div {...hooks.slot('toolbar')}>{props.toolbar}</div>
          )}
          <div {...hooks.slot('body')} style={{ position: 'relative' }}>
            <div
              {...hooks.slot('surface', { gutter })}
              ref={surfaceRef}
              id={surfaceId}
              style={{ position: 'relative' }}
            >
              <ProseMirrorDoc
                {...contentAttributes}
                {...hooks.slot('content', {
                  readonly: content.readOnly,
                  disabled: content.disabled,
                })}
                ref={contentRef}
                id={content.id}
                role="textbox"
                aria-multiline="true"
                aria-label={content['aria-label']}
                aria-labelledby={content['aria-labelledby']}
                aria-describedby={content['aria-describedby']}
                aria-errormessage={content['aria-errormessage']}
                aria-invalid={content['aria-invalid']}
                aria-required={content['aria-required']}
                aria-readonly={content.readOnly || undefined}
                aria-disabled={content.disabled || undefined}
                aria-placeholder={placeholder}
                tabIndex={content.disabled ? undefined : 0}
              />
              {props.children}
            </div>
            <SurfaceScrollbars surfaceRef={surfaceRef} surfaceId={surfaceId} markers={placed} />
          </div>
        </div>
      </RichTextEditorContext>
    </ProseMirror>
  );
}
