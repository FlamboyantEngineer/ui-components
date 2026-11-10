import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Schema } from 'prosemirror-model';
import { EditorState, NodeSelection, Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { describe, expect, it } from 'vitest';
import { createRichTextHeadlessEngine, isRichTextHeadlessView } from './headless-engine.js';
import { isRichTextHeadlessDomError } from './headless-view.js';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*', toDOM: () => ['p', 0] },
    text: {},
  },
});

function createState(text: string, plugins: Plugin[] = []) {
  const paragraph = schema.node('paragraph', null, text ? [schema.text(text)] : []);
  return EditorState.create({ doc: schema.node('doc', null, [paragraph]), plugins });
}

function recorder(name: string, log: string[]) {
  return new Plugin({
    key: new PluginKey(name),
    view() {
      log.push(`${name}:view`);
      return {
        update: () => log.push(`${name}:update`),
        destroy: () => log.push(`${name}:destroy`),
      };
    },
  });
}

const textOf = (view: EditorView) => view.state.doc.textContent;
const append = (view: EditorView, text: string) =>
  view.state.tr.insertText(text, view.state.doc.content.size - 1);

describe('createRichTextHeadlessEngine', () => {
  it('UIC-RICH-TEXT-EDITOR-14.3 creates, updates and destroys plugin views', async () => {
    const log: string[] = [];
    const life: string[] = [];
    const state = createState('hello', [recorder('a', log), recorder('b', log)]);
    const engine = createRichTextHeadlessEngine({
      state,
      onMounted: (view) => life.push(`mounted:${textOf(view)}`),
      onUnmounted: () => life.push('unmounted'),
    });
    expect(log).toEqual(['a:view', 'b:view']);
    expect(life).toEqual(['mounted:hello']);
    expect(engine.view.state).toBe(state);
    expect(engine.getView()).toBe(engine.view);
    expect(isRichTextHeadlessView(engine.view)).toBe(true);
    expect(isRichTextHeadlessView({})).toBe(false);
    engine.view.dispatch(append(engine.view, '!'));
    expect(textOf(engine.view)).toBe('hello!');
    expect(log.slice(2)).toEqual(['a:update', 'b:update']);
    engine.destroy();
    await engine.whenDestroyed();
    expect(log.slice(4)).toEqual(['b:destroy', 'a:destroy']);
    expect(engine.getView()).toBeNull();
    engine.destroy();
    expect(life).toEqual(['mounted:hello', 'unmounted']);
  });

  it('UIC-RICH-TEXT-EDITOR-14.1 passes every transaction through the dispatch body, which may drop it', () => {
    let mode: 'drop' | 'default' | 'override' | 'state' = 'drop';
    const notes: string[] = [];
    const engine = createRichTextHeadlessEngine({
      state: createState('hello'),
      dispatchTransaction: (tr, view, { applyDefault, applyState }) => {
        notes.push(`body:${view === engine.view}`);
        if (mode === 'default') applyDefault();
        if (mode === 'override') applyDefault(view.state.tr.insertText('override', 1, 6));
        if (mode === 'state') applyState(createState('computed'));
      },
      onTransaction: (tr) => notes.push(`transaction:${tr.docChanged}`),
      onUpdated: () => notes.push('updated'),
    });
    engine.view.dispatch(append(engine.view, ' dropped'));
    expect(textOf(engine.view)).toBe('hello');
    expect(notes).toEqual(['transaction:true', 'body:true']);
    mode = 'default';
    engine.view.dispatch(append(engine.view, ' world'));
    expect(textOf(engine.view)).toBe('hello world');
    mode = 'override';
    engine.view.dispatch(append(engine.view, '?'));
    expect(textOf(engine.view)).toBe('override world');
    mode = 'state';
    engine.view.dispatch(engine.view.state.tr);
    expect(textOf(engine.view)).toBe('computed');
    expect(notes.filter((note) => note === 'updated')).toHaveLength(3);
  });

  it('UIC-RICH-TEXT-EDITOR-14.2 commits at once and notifies after the dispatch body returns', () => {
    const order: string[] = [];
    const observer = new Plugin({
      view: () => ({
        update: (view, previous) =>
          order.push(`plugin:${previous.doc.textContent}>${textOf(view)}`),
      }),
    });
    const engine = createRichTextHeadlessEngine({
      state: createState('hello', [observer]),
      dispatchTransaction: (tr, view, { applyState }) => {
        const next = view.state.apply(tr);
        applyState(next);
        order.push(`body:${textOf(view)}:${String(view.state === next)}`);
      },
      afterCommit: () => order.push('afterCommit'),
      onUpdated: (_view, previous) => order.push(`updated:${previous.doc.textContent}`),
    });
    order.length = 0;
    engine.view.dispatch(append(engine.view, '!'));
    expect(order).toEqual([
      'plugin:hello>hello!',
      'body:hello!:true',
      'afterCommit',
      'updated:hello',
    ]);
  });

  it('UIC-RICH-TEXT-EDITOR-14.2 reports replacements to afterCommit only', async () => {
    const log: string[] = [];
    const plugins: string[] = [];
    const engine = createRichTextHeadlessEngine({
      state: createState('one', [recorder('p', plugins)]),
      afterCommit: (view) => log.push(`commit:${textOf(view)}`),
      onUpdated: (view) => log.push(`updated:${textOf(view)}`),
      onMounted: () => log.push('mounted'),
    });
    expect(log).toEqual(['commit:one', 'mounted']);
    log.length = 0;
    plugins.length = 0;
    const replacement = createState('two', [recorder('q', plugins)]);
    const replaced = engine.replaceState(replacement);
    expect(engine.view.state).toBe(replacement);
    expect(plugins).toEqual(['p:destroy', 'q:view']);
    await replaced;
    engine.view.updateState(engine.view.state.apply(append(engine.view, '!')));
    expect(plugins).toEqual(['p:destroy', 'q:view', 'q:update']);
    expect(log).toEqual(['commit:two', 'commit:two!']);
    engine.destroy();
    await expect(engine.replaceState(replacement)).rejects.toThrow('destroyed');
    engine.view.dispatch(engine.view.state.tr.insertText('x', 1));
    expect(textOf(engine.view)).toBe('two!');
  });

  it('UIC-RICH-TEXT-EDITOR-14.3 lets a plugin view dispatch while the views are created', () => {
    const log: string[] = [];
    const syncing = new Plugin({
      view(view) {
        view.dispatch(view.state.tr.insertText('remote ', 1));
        log.push(`sync:${textOf(view)}`);
        return { update: () => log.push('sync:update') };
      },
    });
    const later = new Plugin({
      view(view) {
        log.push(`later:${textOf(view)}`);
        return {};
      },
    });
    const engine = createRichTextHeadlessEngine({
      state: createState('local', [recorder('earlier', log), syncing, later]),
      afterCommit: (view) => log.push(`commit:${textOf(view)}`),
      onUpdated: (_view, previous) => log.push(`updated:${previous.doc.textContent}`),
      onMounted: () => log.push('mounted'),
    });
    expect(textOf(engine.view)).toBe('remote local');
    expect(log).toEqual([
      'earlier:view',
      'earlier:update',
      'sync:remote local',
      'later:remote local',
      'commit:remote local',
      'mounted',
      'commit:remote local',
      'updated:local',
    ]);
  });

  it('UIC-RICH-TEXT-EDITOR-14.2 nests a commit a plugin view makes, one notification pair each', () => {
    const log: string[] = [];
    let corrected = false;
    const corrective = new Plugin({
      view: () => ({
        update(view) {
          if (corrected || !textOf(view).endsWith('x')) return;
          corrected = true;
          view.dispatch(append(view, 'y'));
        },
      }),
    });
    const engine = createRichTextHeadlessEngine({
      state: createState('hello', [corrective]),
      afterCommit: (view) => log.push(`commit:${textOf(view)}`),
      onUpdated: (_view, previous) => log.push(`updated:${previous.doc.textContent}`),
    });
    log.length = 0;
    engine.view.dispatch(append(engine.view, 'x'));
    expect(textOf(engine.view)).toBe('helloxy');
    expect(log).toEqual(['commit:helloxy', 'updated:hello', 'commit:helloxy', 'updated:hellox']);
  });

  it('UIC-RICH-TEXT-EDITOR-14.3 rebuilds the plugin views when the plugin set changes', () => {
    const log: string[] = [];
    const stable = recorder('stable', log);
    const engine = createRichTextHeadlessEngine({ state: createState('x', [stable]) });
    log.length = 0;
    engine.view.updateState(
      engine.view.state.reconfigure({ plugins: [stable, recorder('added', log)] }),
    );
    expect(log).toEqual(['stable:destroy', 'stable:view', 'added:view']);
  });

  it('UIC-RICH-TEXT-EDITOR-14.4 answers textblock edges from the selection', () => {
    const { view } = createRichTextHeadlessEngine({ state: createState('abc') });
    const at = (pos: number) =>
      view.state.apply(view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)));
    for (const direction of ['backward', 'left', 'up'] as const) {
      expect([1, 2, 4].map((pos) => view.endOfTextblock(direction, at(pos)))).toEqual([
        true,
        false,
        false,
      ]);
    }
    for (const direction of ['forward', 'right', 'down'] as const) {
      expect([1, 2, 4].map((pos) => view.endOfTextblock(direction, at(pos)))).toEqual([
        false,
        false,
        true,
      ]);
    }
    const node = view.state.apply(
      view.state.tr.setSelection(NodeSelection.create(view.state.doc, 0)),
    );
    expect(view.endOfTextblock('forward', node)).toBe(false);
  });

  it('UIC-RICH-TEXT-EDITOR-14.4 throws from members that need a rendered document', () => {
    const { view } = createRichTextHeadlessEngine({ state: createState('abc') });
    const members = ['posAtDOM', 'coordsAtPos', 'domAtPos', 'nodeDOM', 'posAtCoords'] as const;
    for (const member of members) {
      let caught: unknown;
      try {
        (view[member] as (pos: number) => unknown)(1);
      } catch (error) {
        caught = error;
      }
      expect(isRichTextHeadlessDomError(caught)).toBe(true);
      expect(caught).toMatchObject({ member, message: expect.stringContaining('renders no DOM') });
    }
    expect(isRichTextHeadlessDomError(new Error('other'))).toBe(false);
  });

  it('UIC-RICH-TEXT-EDITOR-14.4 stands in for the element, focus and editability', () => {
    const { view } = createRichTextHeadlessEngine({ state: createState('abc') });
    const dom = view.dom as unknown as Record<string, (value: string) => unknown>;
    expect(view.dom.nodeType).toBe(0);
    expect(dom.contains?.('x')).toBe(false);
    expect(dom.querySelectorAll?.('p')).toEqual([]);
    expect(() => dom.addEventListener?.('focus')).not.toThrow();
    view.focus();
    expect(view.hasFocus()).toBe(false);
    expect(view.editable).toBe(false);
    expect(view.root).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-14.4 finds view props before plugin props and merges new ones', () => {
    const handleTextInput = () => true;
    const fromPlugin = new Plugin({
      props: { handleKeyDown: () => true, handleTextInput: () => false },
    });
    const commits: string[] = [];
    const { view } = createRichTextHeadlessEngine({
      state: createState('abc', [fromPlugin]),
      props: { handleTextInput, attributes: { class: 'notes' } },
      afterCommit: () => commits.push('commit'),
    });
    expect(view.someProp('handleTextInput')).toBe(handleTextInput);
    expect(typeof view.someProp('handleKeyDown')).toBe('function');
    expect(view.someProp('handlePaste')).toBeUndefined();
    expect(view.someProp('editable', () => false)).toBeUndefined();
    const before = view.state;
    view.setProps({ attributes: { class: 'notes wide' } });
    expect(view.props.attributes).toEqual({ class: 'notes wide' });
    expect(view.props.handleTextInput).toBe(handleTextInput);
    expect(view.state).toBe(before);
    expect(commits).toEqual(['commit', 'commit']);
  });

  it('UIC-RICH-TEXT-EDITOR-14.1 reports selection changes of committed transactions', () => {
    const events: string[] = [];
    const { view } = createRichTextHeadlessEngine({
      state: createState('abc'),
      onSelectionChange: (selection) => events.push(`selection:${selection.from}`),
    });
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 2)));
    view.dispatch(view.state.tr.insertText('x', 2));
    expect(events).toEqual(['selection:2', 'selection:3']);
  });

  it('UIC-RICH-TEXT-EDITOR-14.4 runs in a module that reads no DOM', () => {
    for (const file of ['headless-engine.ts', 'headless-view.ts', 'rich-text-engine.ts']) {
      const source = readFileSync(
        join(process.cwd(), 'src/components/rich-text-editor', file),
        'utf8',
      );
      expect(source).not.toMatch(/'use client'|\b(?:document|window)\.[a-zA-Z]|from 'react/);
    }
  });
});
