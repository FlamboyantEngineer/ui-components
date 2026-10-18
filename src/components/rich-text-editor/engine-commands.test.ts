import { history } from 'prosemirror-history';
import { EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import type { RichTextNode } from './rich-text-document.js';
import {
  getLinkAt,
  isCommandActive,
  isCommandSupported,
  toEngineCommand,
} from './engine-commands.js';
import type { RichTextCommand } from './rich-text-command.js';
import { getEngineSchema } from './engine-schema.js';
import { createRichTextSchema } from './rich-text-schema.js';

const schema = getEngineSchema(createRichTextSchema());

const text = (value: string, marks?: RichTextNode['marks']): RichTextNode => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});
const p = (...content: RichTextNode[]): RichTextNode =>
  content.length > 0 ? { type: 'paragraph', content } : { type: 'paragraph' };
const h = (level: number, value: string): RichTextNode => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
});

/** A state over these blocks with a text selection from `from` to `to` (or a caret). */
function stateOf(blocks: RichTextNode[], from = 1, to = from) {
  const doc = schema.nodeFromJSON({ type: 'doc', content: blocks });
  return EditorState.create({
    schema,
    doc,
    selection: TextSelection.create(doc, from, to),
    plugins: [history()],
  });
}

/** Runs a command; returns the next state, or null when it refused. */
function run(state: EditorState, command: RichTextCommand): EditorState | null {
  let next: EditorState | null = null;
  const ran = toEngineCommand(command)(state, (tr: Transaction) => (next = state.apply(tr)));
  return ran ? (next ?? state) : null;
}

function blocks(state: EditorState | null | undefined) {
  return state?.doc.toJSON().content as RichTextNode[];
}

describe('rich-text commands', () => {
  it('UIC-RICH-TEXT-EDITOR-5.1 toggles marks over a selection and at a caret', () => {
    const state = stateOf([p(text('apples pears'))], 1, 7);
    const bold = run(state, { type: 'toggle-mark', mark: 'bold' });
    expect(blocks(bold)?.[0]?.content?.[0]).toEqual(text('apples', [{ type: 'bold' }]));
    expect(bold && isCommandActive({ type: 'toggle-mark', mark: 'bold' }, bold)).toBe(true);
    const unbold = bold && run(bold, { type: 'toggle-mark', mark: 'bold' });
    expect(blocks(unbold)?.[0]?.content).toEqual([text('apples pears')]);
    const caret = run(stateOf([p(text('ab'))], 2), { type: 'toggle-mark', mark: 'italic' });
    expect(caret && isCommandActive({ type: 'toggle-mark', mark: 'italic' }, caret)).toBe(true);
    expect(run(state, { type: 'toggle-mark', mark: 'shiny' })).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-5.1 sets text block types and reports the active one', () => {
    const state = stateOf([p(text('Title')), p(text('Body'))], 2);
    const heading = run(state, { type: 'set-block', node: 'heading', attrs: { level: 2 } });
    expect(blocks(heading)?.[0]).toEqual(h(2, 'Title'));
    const active = { type: 'set-block', node: 'heading', attrs: { level: 2 } } as const;
    expect(heading && isCommandActive(active, heading)).toBe(true);
    expect(heading && isCommandActive({ ...active, attrs: { level: 1 } }, heading)).toBe(false);
    expect(isCommandActive({ type: 'set-block', node: 'paragraph' }, state)).toBe(true);
    const code = run(stateOf([p(text('x', [{ type: 'bold' }]))], 1), {
      type: 'set-block',
      node: 'codeBlock',
    });
    expect(blocks(code)?.[0]).toEqual({ type: 'codeBlock', content: [text('x')] });
  });

  it('UIC-RICH-TEXT-EDITOR-5.1 wraps in lists and quotes, switches list types and lifts out', () => {
    const state = stateOf([p(text('Plums'))], 2);
    const bullets = run(state, { type: 'toggle-wrap', node: 'bulletList' });
    expect(blocks(bullets)?.[0]?.type).toBe('bulletList');
    expect(bullets && isCommandActive({ type: 'toggle-wrap', node: 'bulletList' }, bullets)).toBe(
      true,
    );
    expect(bullets && isCommandActive({ type: 'toggle-wrap', node: 'orderedList' }, bullets)).toBe(
      false,
    );
    const numbered = bullets && run(bullets, { type: 'toggle-wrap', node: 'orderedList' });
    expect(blocks(numbered)?.[0]).toMatchObject({ type: 'orderedList', attrs: { start: 1 } });
    expect(numbered && run(numbered, { type: 'toggle-wrap', node: 'taskList' })).toBeNull();
    const lifted = numbered && run(numbered, { type: 'toggle-wrap', node: 'orderedList' });
    expect(blocks(lifted)).toEqual([p(text('Plums'))]);
    const quoted = run(state, { type: 'toggle-wrap', node: 'blockquote' });
    expect(blocks(quoted)).toEqual([{ type: 'blockquote', content: [p(text('Plums'))] }]);
    const unquoted = quoted && run(quoted, { type: 'toggle-wrap', node: 'blockquote' });
    expect(blocks(unquoted)).toEqual([p(text('Plums'))]);
  });

  it('UIC-RICH-TEXT-EDITOR-5.1 inserts nodes, text blocks and text', () => {
    const empty = stateOf([p(text('Above')), p()], 8);
    const divider = run(empty, { type: 'insert', node: 'horizontalRule' });
    expect(blocks(divider)).toEqual([p(text('Above')), { type: 'horizontalRule' }, p()]);
    expect(divider?.selection.$from.parent.type.name).toBe('paragraph');
    const after = run(stateOf([p(text('Text'))], 3), { type: 'insert', node: 'blockquote' });
    expect(blocks(after)).toEqual([p(text('Text')), { type: 'blockquote', content: [p()] }]);
    expect(after?.selection.$from.node(1).type.name).toBe('blockquote');
    const asHeading = run(stateOf([p(text('Text'))], 3), {
      type: 'insert',
      node: 'heading',
      attrs: { level: 3 },
    });
    expect(blocks(asHeading)).toEqual([h(3, 'Text')]);
    const lineBreak = run(stateOf([p(text('ab'))], 2), { type: 'insert', node: 'hardBreak' });
    expect(blocks(lineBreak)?.[0]?.content).toEqual([text('a'), { type: 'hardBreak' }, text('b')]);
    const typed = run(stateOf([p(text('ab'))], 2), { type: 'insert-text', text: 'X' });
    expect(blocks(typed)).toEqual([p(text('aXb'))]);
  });

  it('UIC-RICH-TEXT-EDITOR-5.1 undoes and redoes', () => {
    const state = stateOf([p(text('ab'))], 3);
    const typed = run(state, { type: 'insert-text', text: 'c' });
    expect(run(state, { type: 'undo' })).toBeNull();
    const undone = typed && run(typed, { type: 'undo' });
    expect(blocks(undone)).toEqual([p(text('ab'))]);
    const redone = undone && run(undone, { type: 'redo' });
    expect(blocks(redone)).toEqual([p(text('abc'))]);
  });

  it('UIC-RICH-TEXT-EDITOR-5.2 says which commands the schema supports', () => {
    const state = stateOf([p(text('a'))]);
    expect(isCommandSupported({ type: 'toggle-mark', mark: 'bold' }, state)).toBe(true);
    expect(isCommandSupported({ type: 'toggle-mark', mark: 'shiny' }, state)).toBe(false);
    expect(isCommandSupported({ type: 'toggle-wrap', node: 'callout' }, state)).toBe(false);
    expect(isCommandSupported({ type: 'set-link', href: null }, state)).toBe(true);
    expect(isCommandSupported({ type: 'undo' }, state)).toBe(true);
    expect(isCommandActive({ type: 'undo' }, state)).toBe(false);
  });

  it('UIC-RICH-TEXT-EDITOR-5.4 links, relinks, inserts and removes links', () => {
    const state = stateOf([p(text('see the market'))], 9, 15);
    const linked = run(state, { type: 'set-link', href: 'https://example.com' });
    expect(blocks(linked)?.[0]?.content?.[1]).toEqual(
      text('market', [{ type: 'link', attrs: { href: 'https://example.com', title: null } }]),
    );
    const inside = linked?.apply(linked.tr.setSelection(TextSelection.create(linked.doc, 11)));
    expect(inside && getLinkAt(inside)).toBe('https://example.com');
    const changed = inside && run(inside, { type: 'set-link', href: '/market' });
    expect(changed && getLinkAt(changed)).toBe('/market');
    expect(blocks(changed)?.[0]?.content?.[1]?.text).toBe('market');
    const removed = changed && run(changed, { type: 'set-link', href: null });
    expect(blocks(removed)).toEqual([p(text('see the market'))]);
    const inserted = run(stateOf([p(text('Go '))], 4), {
      type: 'set-link',
      href: 'https://a.test',
    });
    expect(blocks(inserted)?.[0]?.content?.[1]?.text).toBe('https://a.test');
    expect(run(state, { type: 'set-link', href: 'javascript:alert(1)' })).toBeNull();
    expect(run(state, { type: 'set-link', href: ' ' })).toBeNull();
    expect(run(stateOf([p(text('a'))], 1), { type: 'set-link', href: null })).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-5.5 moves, duplicates and deletes the top-level block', () => {
    const state = stateOf([p(text('one')), p(text('two')), p(text('three'))], 7, 8);
    const down = run(state, { type: 'move-block', direction: 'down' });
    expect(blocks(down)?.map((block) => block.content?.[0]?.text)).toEqual(['one', 'three', 'two']);
    expect(down?.doc.textBetween(down.selection.from, down.selection.to)).toBe('w');
    const up = run(state, { type: 'move-block', direction: 'up' });
    expect(blocks(up)?.map((block) => block.content?.[0]?.text)).toEqual(['two', 'one', 'three']);
    expect(run(stateOf([p(text('only'))], 2), { type: 'move-block', direction: 'up' })).toBeNull();
    const copy = run(state, { type: 'duplicate-block' });
    expect(blocks(copy)?.map((block) => block.content?.[0]?.text)).toEqual([
      'one',
      'two',
      'two',
      'three',
    ]);
    expect(copy?.selection.from).toBe(12);
    const gone = run(state, { type: 'delete-block' });
    expect(blocks(gone)?.map((block) => block.content?.[0]?.text)).toEqual(['one', 'three']);
    const last = run(stateOf([h(1, 'Only')], 2), { type: 'delete-block' });
    expect(blocks(last)).toEqual([p()]);
    expect(run(stateOf([p(text('a')), p(text('b'))], 1, 5), { type: 'delete-block' })).toBeNull();
    const ruled = EditorState.create({
      schema,
      doc: schema.nodeFromJSON({
        type: 'doc',
        content: [p(text('a')), { type: 'horizontalRule' }],
      }),
    });
    const selected = ruled.apply(ruled.tr.setSelection(NodeSelection.create(ruled.doc, 3)));
    const moved = run(selected, { type: 'move-block', direction: 'up' });
    expect(blocks(moved)?.[0]?.type).toBe('horizontalRule');
    expect(moved?.selection).toBeInstanceOf(NodeSelection);
  });
});
