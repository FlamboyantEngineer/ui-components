import { act, render, screen } from '@testing-library/react';
import { Schema } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, TextSelection, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import { createRichTextHeadlessEngine, withoutReactKeys } from './headless-engine.js';
import type { RichTextEngineCommit } from './rich-text-engine.js';
import {
  RichTextEngineContent,
  RichTextEngineHost,
  type RichTextEngineHostProps,
  type RichTextNodeViewProps,
} from './rich-text-engine-view.js';

installEditorDom();

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*', toDOM: () => ['p', 0] },
    note: { group: 'block', content: 'text*', toDOM: () => ['aside', 0] },
    text: {},
  },
});

function createState(text: string, plugins: Plugin[] = []) {
  const paragraph = schema.node('paragraph', null, [schema.text(text)]);
  return EditorState.create({ doc: schema.node('doc', null, [paragraph]), plugins });
}

type Events = Omit<RichTextEngineHostProps, 'state' | 'onStateChange'>;

/** Renders an engine whose state a React state holds; returns the view once it is mounted. */
function renderEngine(first: EditorState, events: Events = {}) {
  let engineView: EditorView | undefined;
  let replace: (state: EditorState) => void = () => undefined;
  function Harness() {
    const [state, setState] = useState(first);
    replace = setState;
    return (
      <RichTextEngineHost
        {...events}
        state={state}
        onStateChange={setState}
        onMounted={(view) => {
          engineView = view;
          events.onMounted?.(view);
        }}
      >
        <RichTextEngineContent aria-label="Notes" role="textbox" className="notes" />
      </RichTextEngineHost>
    );
  }
  const utils = render(<Harness />);
  const view = () => {
    if (!engineView) throw new Error('The engine has not mounted.');
    return engineView;
  };
  const dispatch = (build: (view: EditorView) => Transaction) =>
    act(() => view().dispatch(build(view())));
  return { ...utils, view, dispatch, replace: (state: EditorState) => act(() => replace(state)) };
}

const append = (text: string) => (view: EditorView) =>
  view.state.tr.insertText(text, view.state.doc.content.size - 1);

describe('RichTextEngineHost', () => {
  it('UIC-RICH-TEXT-EDITOR-14.5 renders the document and commits transactions', () => {
    const { dispatch } = renderEngine(createState('Apples'));
    const content = screen.getByRole('textbox', { name: 'Notes' });
    expect(content).toHaveTextContent('Apples');
    expect(content).toHaveClass('ui-rich-text-engine-content', 'notes', 'ProseMirror');
    dispatch(append(' and pears'));
    expect(content).toHaveTextContent('Apples and pears');
  });

  it('UIC-RICH-TEXT-EDITOR-14.1 UIC-RICH-TEXT-EDITOR-14.5 lets the dispatch body drop or replace a transaction', () => {
    let mode: 'drop' | 'state' = 'drop';
    const transactions: boolean[] = [];
    const { dispatch } = renderEngine(createState('Apples'), {
      onTransaction: (tr) => transactions.push(tr.docChanged),
      dispatchTransaction: (tr: Transaction, view: EditorView, commit: RichTextEngineCommit) => {
        if (mode === 'state')
          commit.applyState(view.state.apply(tr.insertText('!', tr.doc.content.size - 1)));
      },
    });
    const content = screen.getByRole('textbox', { name: 'Notes' });
    dispatch(append(' dropped'));
    expect(content).toHaveTextContent(/^Apples$/);
    mode = 'state';
    dispatch(append(' kept'));
    expect(content).toHaveTextContent('Apples kept!');
    expect(transactions).toEqual([true, true]);
  });

  it('UIC-RICH-TEXT-EDITOR-14.5 notifies commits after React shows them', () => {
    const log: string[] = [];
    const text = (view: EditorView) => view.state.doc.textContent;
    const { dispatch, replace } = renderEngine(createState('one'), {
      afterCommit: (view) => log.push(`commit:${text(view)}`),
      onMounted: (view) => log.push(`mounted:${text(view)}`),
      onUpdated: (view, previous) => log.push(`updated:${previous.doc.textContent}>${text(view)}`),
      onSelectionChange: (selection) => log.push(`selection:${selection.from}`),
    });
    expect(log).toEqual(['commit:one', 'mounted:one']);
    log.length = 0;
    dispatch((view) => view.state.tr.setSelection(TextSelection.create(view.state.doc, 2)));
    dispatch(append(' two'));
    expect(log).toEqual([
      'commit:one',
      'selection:2',
      'updated:one>one',
      'commit:one two',
      'updated:one>one two',
    ]);
    log.length = 0;
    replace(createState('three'));
    expect(log).toEqual(['commit:three']);
  });

  it('UIC-RICH-TEXT-EDITOR-14.5 renders React node views and runs plugin views', () => {
    function NoteView({ children, nodeProps, ref, ...props }: RichTextNodeViewProps) {
      const { contentDOMRef } = nodeProps;
      return (
        <aside {...props} ref={ref} aria-label="Note">
          <div ref={contentDOMRef}>{children}</div>
        </aside>
      );
    }
    const updates: string[] = [];
    const watcher = new Plugin({
      key: new PluginKey('watcher'),
      view: () => ({ update: (view) => updates.push(view.state.doc.textContent) }),
    });
    const note = schema.node('note', null, [schema.text('Mind the step')]);
    const state = EditorState.create({ doc: schema.node('doc', null, [note]), plugins: [watcher] });
    const { dispatch, unmount } = renderEngine(state, { nodeViews: { note: NoteView } });
    expect(screen.getByLabelText('Note')).toHaveTextContent('Mind the step');
    dispatch(append('!'));
    expect(updates).toContain('Mind the step!');
    unmount();
  });

  it('UIC-RICH-TEXT-EDITOR-14.5 reports its unmount', () => {
    const log: string[] = [];
    const { unmount } = renderEngine(createState('one'), { onUnmounted: () => log.push('gone') });
    unmount();
    expect(log).toEqual(['gone']);
  });
});

describe('withoutReactKeys', () => {
  it('UIC-RICH-TEXT-EDITOR-14.6 moves a state between a rendered and a headless engine', () => {
    const key = new PluginKey<number>('edits');
    const counter = new Plugin<number>({
      key,
      state: { init: () => 0, apply: (tr, count) => (tr.docChanged ? count + 1 : count) },
    });
    const { view, dispatch, replace } = renderEngine(createState('abc', [counter]));
    expect(view().state.plugins).toHaveLength(2);
    dispatch((current) => current.state.tr.insertText('!', 1));
    const headless = withoutReactKeys(view().state);
    expect(headless.plugins).toEqual([counter]);
    expect(key.getState(headless)).toBe(1);
    expect(withoutReactKeys(headless)).toBe(headless);
    const engine = createRichTextHeadlessEngine({ state: headless });
    engine.view.dispatch(engine.view.state.tr.insertText('?', 1));
    expect(key.getState(engine.view.state)).toBe(2);
    replace(engine.view.state);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveTextContent('?!abc');
    dispatch((current) => current.state.tr.insertText('.', 1));
    expect(key.getState(view().state)).toBe(3);
    expect(view().state.plugins).toHaveLength(2);
  });
});
