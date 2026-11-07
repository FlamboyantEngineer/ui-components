'use client';

import {
  type MarkViewComponentProps,
  type NodeViewComponentProps,
  ProseMirror,
  ProseMirrorDoc,
  reactKeys,
  useEditorEffect,
} from '@handlewithcare/react-prosemirror';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { DecorationSet, EditorView } from 'prosemirror-view';
import {
  type ComponentType,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useLatest } from '../../utils/use-latest.js';
import { isReactKeysPlugin } from './headless-engine.js';
import type { RichTextEngineCommit, RichTextEngineEvents } from './rich-text-engine.js';

/** What a React node view takes: the node, its position and the element its content goes in. */
export type RichTextNodeViewProps = NodeViewComponentProps;

/** What a React mark view takes. */
export type RichTextMarkViewProps = MarkViewComponentProps;

/** A state, or a function from the current state to the next, as a React state setter takes. */
export type RichTextStateUpdate = EditorState | ((current: EditorState) => EditorState);

/**
 * A rendered engine whose state the caller holds. Every transaction passes through
 * `dispatchTransaction`, which commits through `onStateChange` or drops it.
 */
export interface RichTextEngineHostProps extends RichTextEngineEvents {
  /**
   * The state shown. The host adds the `reactKeys` plugin its view needs when the state lacks it;
   * `withoutReactKeys` takes it out again for a headless engine.
   */
  state: EditorState;
  /** Commits a state, or an update of the current one: pass a React state setter. */
  onStateChange: (update: RichTextStateUpdate) => void;
  /** React views by node type name. */
  nodeViews?: Readonly<Record<string, ComponentType<RichTextNodeViewProps>>> | undefined;
  /** React views by mark type name. */
  markViews?: Readonly<Record<string, ComponentType<RichTextMarkViewProps>>> | undefined;
  /** The decorations of a state, such as a placeholder or findings. */
  decorations?: ((state: EditorState) => DecorationSet) | undefined;
  /** The chrome around the document, with one `RichTextEngineContent` somewhere inside. */
  children?: ReactNode;
}

/** The document element of the enclosing `RichTextEngineHost`. */
export interface RichTextEngineContentProps
  extends BaseProps, RefProps<HTMLDivElement>, AriaLabellingProps {
  /** The element's role, such as `textbox` for an editable document. */
  role?: string | undefined;
}

const hooks = createHooks('rich-text-engine-content');

/** The keyed copy of each state the caller passed without `reactKeys`. */
const keyedStates = new WeakMap<EditorState, EditorState>();

/** The state with the `reactKeys` plugin the rendered view needs, the same copy each time. */
function withReactKeys(state: EditorState): EditorState {
  if (state.plugins.some(isReactKeysPlugin)) return state;
  let keyed = keyedStates.get(state);
  if (!keyed) {
    keyed = state.reconfigure({ plugins: [...state.plugins, reactKeys()] });
    keyedStates.set(state, keyed);
  }
  return keyed;
}

interface CommitTracking {
  /** The last state notified, so a render that commits nothing notifies nothing. */
  shown: EditorState | null;
  /** A dispatch committed since the last notification. */
  byTransaction: boolean;
}

/** Fires the commit notifications once the view shows a new state. */
function EngineEffects(props: {
  eventsRef: RefObject<RichTextEngineHostProps>;
  trackingRef: RefObject<CommitTracking>;
}) {
  const { eventsRef, trackingRef } = props;
  useEditorEffect((view) => {
    const engineView = view as EditorView;
    const { shown, byTransaction } = trackingRef.current;
    if (shown === engineView.state) return;
    trackingRef.current = { shown: engineView.state, byTransaction: false };
    const { afterCommit, onMounted, onSelectionChange, onUpdated } = eventsRef.current;
    afterCommit?.(engineView);
    if (shown === null) {
      onMounted?.(engineView);
    } else if (byTransaction) {
      const { selection } = engineView.state;
      if (!selection.eq(shown.selection)) onSelectionChange?.(selection, engineView);
      onUpdated?.(engineView, shown);
    }
  });
  return null;
}

/**
 * Renders a document with the engine every rich-text editor shares: the caller's state, React
 * node and mark views, and a dispatch body that gates each transaction. Notifications fire after
 * React commits the new state, `onSelectionChange` and `onUpdated` only for states a transaction
 * committed.
 */
export function RichTextEngineHost(props: RichTextEngineHostProps) {
  const { state, decorations, nodeViews, markViews, props: viewProps } = props;
  const eventsRef = useLatest(props);
  const trackingRef = useRef<CommitTracking>({ shown: null, byTransaction: false });
  const dispatchTransaction = useCallback(
    function dispatch(this: EditorView, tr: Transaction) {
      const { onTransaction, onStateChange, dispatchTransaction: body } = eventsRef.current;
      onTransaction?.(tr, this);
      const commit: RichTextEngineCommit = {
        applyState: (next) => {
          trackingRef.current.byTransaction = true;
          onStateChange(next);
        },
        applyDefault: (override) => {
          trackingRef.current.byTransaction = true;
          onStateChange((current) => withReactKeys(current).apply(override ?? tr));
        },
      };
      if (body) body(tr, this, commit);
      else commit.applyDefault();
    },
    [eventsRef],
  );
  useEffect(() => () => eventsRef.current.onUnmounted?.(), [eventsRef]);
  return (
    <ProseMirror
      {...viewProps}
      state={withReactKeys(state)}
      dispatchTransaction={dispatchTransaction}
      decorations={decorations}
      nodeViewComponents={nodeViews as Record<string, ComponentType<NodeViewComponentProps>>}
      markViewComponents={markViews as Record<string, ComponentType<MarkViewComponentProps>>}
    >
      {props.children}
      <EngineEffects eventsRef={eventsRef} trackingRef={trackingRef} />
    </ProseMirror>
  );
}

/** The document of the enclosing `RichTextEngineHost`, with ProseMirror's `ProseMirror` class. */
export function RichTextEngineContent(props: RichTextEngineContentProps) {
  const { ref, className, ...rest } = props;
  return <ProseMirrorDoc {...rest} {...hooks.root({ className, props: rest })} ref={ref} />;
}
