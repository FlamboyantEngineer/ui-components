'use client';

import type { EditorState } from 'prosemirror-state';
import type { DecorationSet, EditorProps, EditorView } from 'prosemirror-view';
import type { ComponentType, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  RichTextEngineContent,
  RichTextEngineHost,
  type RichTextMarkViewProps,
  type RichTextNodeViewProps,
  type RichTextStateUpdate,
} from './rich-text-engine-view.js';

/** What a view mounted outside the caller's React tree renders. */
export interface RichTextViewMountOptions {
  /** The state it shows first. */
  state: EditorState;
  /** React views by node type name, which render with every editor hook they use. */
  nodeViews?: Readonly<Record<string, ComponentType<RichTextNodeViewProps>>> | undefined;
  /** React views by mark type name. */
  markViews?: Readonly<Record<string, ComponentType<RichTextMarkViewProps>>> | undefined;
  /** The decorations of a state. */
  decorations?: ((state: EditorState) => DecorationSet) | undefined;
  /** The view's props, such as `editable`; the view is not editable unless they say so. */
  props?: Readonly<EditorProps> | undefined;
  /** Wraps the view, such as in the providers its node views read. */
  wrap?: ((view: ReactNode) => ReactNode) | undefined;
}

/** A rendered view mounted in an element of its own, outside the caller's React tree. */
export interface RichTextMountedView {
  /** The view, with its document drawn in the element. */
  readonly view: EditorView;
  /** Shows another state, drawn before this returns. */
  update(state: EditorState): void;
  /** Unmounts the view and empties the element. */
  destroy(): void;
}

const notEditable = () => false;

/**
 * Mounts a view of a state in an element with its own React root, drawn before it returns, with
 * the caller's React node and mark views: a second view of a document, such as one that measures
 * it, that renders those views as the editor does. Its own transactions, such as a plugin view's,
 * commit to it; `update` shows another state.
 */
export function mountRichTextView(
  element: HTMLElement,
  options: RichTextViewMountOptions,
): RichTextMountedView {
  const root = createRoot(element);
  let state = options.state;
  let view: EditorView | null = null;
  const draw = () => {
    const host = (
      <RichTextEngineHost
        state={state}
        onStateChange={commit}
        nodeViews={options.nodeViews}
        markViews={options.markViews}
        decorations={options.decorations}
        props={{ editable: notEditable, ...options.props }}
        onMounted={(mounted) => {
          view = mounted;
        }}
      >
        <RichTextEngineContent />
      </RichTextEngineHost>
    );
    root.render(options.wrap ? options.wrap(host) : host);
  };
  function commit(update: RichTextStateUpdate) {
    state = typeof update === 'function' ? update(state) : update;
    draw();
  }
  flushSync(draw);
  const mounted = view as EditorView | null;
  if (!mounted) throw new Error('The rich-text view did not mount.');
  return {
    view: mounted,
    update(next) {
      state = next;
      flushSync(draw);
    },
    destroy() {
      root.unmount();
    },
  };
}
