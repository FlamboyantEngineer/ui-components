// A rich-text engine with no rendered document: the editor state, its plugin views and the
// dispatch body run as in a rendered view, so a document stays editable by commands and
// collaboration while another view, or none, shows it. It reads no DOM.

import type { EditorState, Plugin, PluginView, Transaction } from 'prosemirror-state';
import type { DirectEditorProps, EditorProps, EditorView } from 'prosemirror-view';
import {
  createDomMembers,
  createHeadlessDom,
  findProp,
  type HeadlessDirection,
  isAtTextblockEnd,
} from './headless-view.js';
import type {
  RichTextEngineCommit,
  RichTextEngineHandle,
  RichTextEngineOptions,
} from './rich-text-engine.js';

interface PendingCommit {
  previous: EditorState;
  /** Committed by a transaction, so `onUpdated` fires for it. */
  byTransaction: boolean;
}

interface Engine {
  readonly options: RichTextEngineOptions;
  readonly view: EditorView;
  state: EditorState;
  props: Readonly<EditorProps>;
  pluginViews: PluginView[];
  /** Counts plugin view rebuilds, so a rebuild started inside another one ends the outer one. */
  generation: number;
  /** The dispatch bodies and commits running; notifications wait until none is. */
  depth: number;
  pending: PendingCommit[];
  isDestroyed: boolean;
  settleDestroyed: () => void;
}

const headlessViews = new WeakSet<object>();

/** The key name of the `reactKeys` plugin a rendered view adds, which a headless engine drops. */
const reactKeysKey = '@handlewithcare/react-prosemirror/reactKeys$';

function createPluginViews(engine: Engine) {
  engine.generation += 1;
  const generation = engine.generation;
  for (const plugin of engine.state.plugins) {
    // A commit made while a plugin view is created can rebuild the plugin views; that rebuild
    // owns the new set.
    if (engine.generation !== generation) return;
    const pluginView = plugin.spec.view?.(engine.view);
    if (pluginView) engine.pluginViews.push(pluginView);
  }
}

function destroyPluginViews(engine: Engine) {
  for (let view = engine.pluginViews.pop(); view; view = engine.pluginViews.pop()) {
    view.destroy?.();
  }
}

/** As a rendered view does: a new plugin set rebuilds the plugin views, otherwise they update. */
function updatePluginViews(engine: Engine, previous: EditorState) {
  if (previous.plugins !== engine.state.plugins) {
    destroyPluginViews(engine);
    createPluginViews(engine);
    return;
  }
  for (const pluginView of [...engine.pluginViews]) pluginView.update?.(engine.view, previous);
}

/** Fires each commit's notifications in commit order, once no body or commit is running. */
function flushNotifications(engine: Engine) {
  const { afterCommit, onUpdated } = engine.options;
  while (engine.pending.length > 0 && !engine.isDestroyed) {
    for (const { previous, byTransaction } of engine.pending.splice(0)) {
      if (engine.isDestroyed) return;
      afterCommit?.(engine.view);
      if (byTransaction) onUpdated?.(engine.view, previous);
    }
  }
}

/** Commits a state at once: the plugin views see it before the caller continues. */
function commit(engine: Engine, next: EditorState, byTransaction: boolean) {
  if (engine.isDestroyed) return;
  const previous = engine.state;
  engine.state = next;
  // Queued before the plugin views run, so a commit one of them makes is notified after this one.
  engine.pending.push({ previous, byTransaction });
  engine.depth += 1;
  try {
    updatePluginViews(engine, previous);
  } finally {
    engine.depth -= 1;
  }
  if (byTransaction && !next.selection.eq(previous.selection)) {
    engine.options.onSelectionChange?.(next.selection, engine.view);
  }
  if (engine.depth === 0) flushNotifications(engine);
}

function dispatch(engine: Engine, tr: Transaction) {
  if (engine.isDestroyed) return;
  const { onTransaction, dispatchTransaction } = engine.options;
  onTransaction?.(tr, engine.view);
  const applyState = (next: EditorState) => commit(engine, next, true);
  const commits: RichTextEngineCommit = {
    applyState,
    applyDefault: (override) => applyState(engine.state.apply(override ?? tr)),
  };
  engine.depth += 1;
  try {
    if (dispatchTransaction) dispatchTransaction(tr, engine.view, commits);
    else commits.applyDefault();
  } finally {
    engine.depth -= 1;
    if (engine.depth === 0) flushNotifications(engine);
  }
}

function destroy(engine: Engine) {
  if (engine.isDestroyed) return;
  destroyPluginViews(engine);
  engine.isDestroyed = true;
  engine.pending = [];
  engine.options.onUnmounted?.();
  engine.settleDestroyed();
}

/** The view members of an engine, in the shape plugins and commands take a rendered view in. */
function createView(engine: () => Engine): EditorView {
  const view = {
    ...createDomMembers(),
    dom: createHeadlessDom(),
    editable: false,
    composing: false,
    dragging: null,
    get state() {
      return engine().state;
    },
    get props() {
      return { ...engine().props, state: engine().state };
    },
    get isDestroyed() {
      return engine().isDestroyed;
    },
    /** No document holds a headless view. */
    root: null,
    dispatch: (tr: Transaction) => dispatch(engine(), tr),
    hasFocus: () => false,
    focus: () => undefined,
    endOfTextblock: (direction: HeadlessDirection, state?: EditorState) =>
      isAtTextblockEnd(state ?? engine().state, direction),
    someProp: (name: string, select?: (value: never) => unknown) =>
      findProp({ props: engine().props, plugins: engine().state.plugins }, name, select),
    updateState: (state: EditorState) => commit(engine(), state, false),
    setProps: ({ state, ...props }: Partial<DirectEditorProps>) => {
      engine().props = { ...engine().props, ...props };
      commit(engine(), state ?? engine().state, false);
    },
    update: ({ state, ...props }: DirectEditorProps) => {
      engine().props = props;
      commit(engine(), state, false);
    },
    destroy: () => destroy(engine()),
  };
  headlessViews.add(view);
  return view as unknown as EditorView;
}

/** Whether a plugin is the `reactKeys` plugin of a rendered view. */
export function isReactKeysPlugin(plugin: Plugin): boolean {
  return (plugin as unknown as { key: string }).key.startsWith(reactKeysKey);
}

/**
 * The state without the `reactKeys` plugin a rendered view adds, for a headless engine; every
 * other plugin keeps its instance and state. Returns the state itself when it holds none.
 */
export function withoutReactKeys(state: EditorState): EditorState {
  const plugins = state.plugins.filter((plugin) => !isReactKeysPlugin(plugin));
  return plugins.length === state.plugins.length ? state : state.reconfigure({ plugins });
}

/** Whether a view is a headless engine's, which renders no document. */
export function isRichTextHeadlessView(view: unknown): boolean {
  return typeof view === 'object' && view !== null && headlessViews.has(view);
}

/**
 * Runs an engine with no rendered document. Plugin views are created at once, `afterCommit` and
 * `onMounted` fire before this returns, then the notifications of any commit a plugin view made
 * while it was created. Commits land at once, and their notifications fire once the outermost
 * dispatch body returns. Members that need a rendered document, such as `coordsAtPos`, throw.
 */
export function createRichTextHeadlessEngine(options: RichTextEngineOptions): RichTextEngineHandle {
  let settleDestroyed = () => undefined as void;
  const destroyed = new Promise<void>((resolve) => (settleDestroyed = resolve));
  const engine: Engine = {
    options,
    view: createView(() => engine),
    state: options.state,
    props: options.props ?? {},
    pluginViews: [],
    generation: 0,
    // Held while the plugin views are created, so a commit one makes waits for `onMounted`.
    depth: 1,
    pending: [],
    isDestroyed: false,
    settleDestroyed: () => settleDestroyed(),
  };
  try {
    createPluginViews(engine);
  } catch (error) {
    destroyPluginViews(engine);
    throw error;
  }
  options.afterCommit?.(engine.view);
  options.onMounted?.(engine.view);
  engine.depth = 0;
  flushNotifications(engine);
  return {
    view: engine.view,
    getView: () => (engine.isDestroyed ? null : engine.view),
    replaceState: (next) => {
      if (engine.isDestroyed) return Promise.reject(new Error('The engine is destroyed.'));
      try {
        commit(engine, next, false);
      } catch (error) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
      return Promise.resolve();
    },
    destroy: () => destroy(engine),
    whenDestroyed: () => destroyed,
  };
}
