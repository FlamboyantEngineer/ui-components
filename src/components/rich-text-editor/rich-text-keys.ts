// Keyboard shortcuts and Markdown-style input rules for the schema's node and mark types.

import { baseKeymap, chainCommands, exitCode } from 'prosemirror-commands';
import { history } from 'prosemirror-history';
import {
  InputRule,
  inputRules,
  textblockTypeInputRule,
  undoInputRule,
  wrappingInputRule,
} from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { MarkType, NodeType, Schema } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import type { Command, EditorState, Plugin } from 'prosemirror-state';
import { findWrapping } from 'prosemirror-transform';
import { toEngineCommand } from './engine-commands.js';
import { placeAfterLeaf } from './insert-commands.js';
import type { RichTextCommand } from './rich-text-command.js';

/** Where an input rule's match starts and where the caret is. */
type RuleRange = [start: number, end: number];

/** Shortcuts that run a library command, by ProseMirror key name (`Mod` is Ctrl, or Cmd on Apple). */
const commandKeys: ReadonlyArray<[string, RichTextCommand]> = [
  ['Mod-z', { type: 'undo' }],
  ['Shift-Mod-z', { type: 'redo' }],
  ['Mod-y', { type: 'redo' }],
  ['Mod-b', { type: 'toggle-mark', mark: 'bold' }],
  ['Mod-i', { type: 'toggle-mark', mark: 'italic' }],
  ['Mod-u', { type: 'toggle-mark', mark: 'underline' }],
  ['Mod-Shift-s', { type: 'toggle-mark', mark: 'strike' }],
  ['Mod-e', { type: 'toggle-mark', mark: 'code' }],
  ['Mod-Alt-0', { type: 'set-block', node: 'paragraph' }],
  ['Mod-Alt-1', { type: 'set-block', node: 'heading', attrs: { level: 1 } }],
  ['Mod-Alt-2', { type: 'set-block', node: 'heading', attrs: { level: 2 } }],
  ['Mod-Alt-3', { type: 'set-block', node: 'heading', attrs: { level: 3 } }],
  ['Mod-Alt-c', { type: 'set-block', node: 'codeBlock' }],
  ['Mod-Shift-7', { type: 'toggle-wrap', node: 'orderedList' }],
  ['Mod-Shift-8', { type: 'toggle-wrap', node: 'bulletList' }],
  ['Mod-Shift-9', { type: 'toggle-wrap', node: 'taskList' }],
  ['Mod-Shift-b', { type: 'toggle-wrap', node: 'blockquote' }],
  ['Alt-Shift-ArrowUp', { type: 'move-block', direction: 'up' }],
  ['Alt-Shift-ArrowDown', { type: 'move-block', direction: 'down' }],
];

/** Wraps `*text*`-style delimited text in a mark once the closing delimiter is typed. */
function markRule(pattern: RegExp, type: MarkType): InputRule {
  const wrap = (state: EditorState, match: RegExpMatchArray, ...[start, end]: RuleRange) => {
    const [, before = '', text = ''] = match;
    if (!text) return null;
    const from = start + before.length;
    const tr = state.tr.delete(from, end).insertText(text, from);
    return tr.addMark(from, from + text.length, type.create()).removeStoredMark(type);
  };
  return new InputRule(pattern, wrap, { inCodeMark: false });
}

/** Typing `---` (or `___`) in an empty block turns it into a divider. */
function dividerRule(type: NodeType): InputRule {
  return new InputRule(/^(?:---|___)$/, (state, _match, ...[start, end]: RuleRange) => {
    const $start = state.doc.resolve(start);
    const container = $start.node(-1);
    const index = $start.index(-1);
    if (
      $start.parent.content.size !== end - start ||
      !container.canReplaceWith(index, index + 1, type)
    ) {
      return null;
    }
    const tr = state.tr.replaceWith($start.before(), $start.after(), type.create());
    return placeAfterLeaf(tr, $start.before() + 1);
  });
}

/** Typing `[ ] ` or `[x] ` at the start of a block makes it an open or done task. */
function taskRule(list: NodeType): InputRule {
  return new InputRule(/^\s*\[([ x]?)\]\s$/i, (state, match, ...[start, end]: RuleRange) => {
    const tr = state.tr.delete(start, end);
    const range = tr.doc.resolve(start).blockRange();
    const wrapping = range && findWrapping(range, list);
    if (!range || !wrapping) return null;
    const checked = match[1]?.toLowerCase() === 'x';
    const wrappers = wrapping.map((wrapper, index) =>
      index === 1 ? { ...wrapper, attrs: { checked } } : wrapper,
    );
    return tr.wrap(range, wrappers);
  });
}

function blockRules(schema: Schema): InputRule[] {
  const { heading, blockquote, codeBlock, bulletList, orderedList, taskList, horizontalRule } =
    schema.nodes;
  return [
    horizontalRule && dividerRule(horizontalRule),
    heading &&
      textblockTypeInputRule(/^(#{1,3})\s$/, heading, (match) => ({ level: match[1]?.length })),
    blockquote && wrappingInputRule(/^\s*>\s$/, blockquote),
    codeBlock && textblockTypeInputRule(/^```\s$/, codeBlock),
    taskList && taskRule(taskList),
    bulletList && wrappingInputRule(/^\s*([-+*])\s$/, bulletList),
    orderedList &&
      wrappingInputRule(
        /^\s*(\d+)\.\s$/,
        orderedList,
        (match) => ({ start: Number(match[1]) }),
        (match, node) => node.childCount + Number(node.attrs.start) === Number(match[1]),
      ),
  ].filter((rule): rule is InputRule => Boolean(rule));
}

function markRules(schema: Schema): InputRule[] {
  const { bold, italic, strike, code } = schema.marks;
  return [
    bold && markRule(/(^|[^*])\*\*([^*]+)\*\*$/, bold),
    italic && markRule(/(^|[^*])\*([^*\s][^*]*)\*$/, italic),
    italic && markRule(/(^|[^_\w])_([^_\s][^_]*)_$/, italic),
    strike && markRule(/(^|[^~])~~([^~]+)~~$/, strike),
    code && markRule(/(^|[^`])`([^`]+)`$/, code),
  ].filter((rule): rule is InputRule => Boolean(rule));
}

/** Enter, Tab and Shift+Tab in list items, and a hard break on Shift+Enter or Mod+Enter. */
function structureKeys(schema: Schema): Record<string, Command> {
  const items = [schema.nodes.listItem, schema.nodes.taskItem].filter((type): type is NodeType =>
    Boolean(type),
  );
  const either = (build: (type: NodeType) => Command) => chainCommands(...items.map(build));
  const keys: Record<string, Command> = {
    Enter: either(splitListItem),
    'Mod-[': either(liftListItem),
    'Mod-]': either(sinkListItem),
    Tab: either(sinkListItem),
    'Shift-Tab': either(liftListItem),
    Backspace: undoInputRule,
  };
  const { hardBreak } = schema.nodes;
  if (hardBreak) {
    const insertBreak: Command = (state, dispatch) => {
      dispatch?.(state.tr.replaceSelectionWith(hardBreak.create()).scrollIntoView());
      return true;
    };
    keys['Shift-Enter'] = chainCommands(exitCode, insertBreak);
    keys['Mod-Enter'] = chainCommands(exitCode, insertBreak);
  }
  return keys;
}

/** The editing plugins: history, input rules, shortcuts and the base keys, in that order. */
export function createEditingPlugins(schema: Schema): Plugin[] {
  const shortcuts = Object.fromEntries(
    commandKeys.map(([key, command]) => [key, toEngineCommand(command)]),
  );
  return [
    history(),
    inputRules({ rules: [...blockRules(schema), ...markRules(schema)] }),
    keymap(shortcuts),
    keymap(structureKeys(schema)),
    keymap(baseKeymap),
  ];
}
