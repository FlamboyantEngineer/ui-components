// Runs library commands on the engine's state, and reports what they would do there.

import { lift, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import type { NodeType } from 'prosemirror-model';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import type { Command, EditorState } from 'prosemirror-state';
import { deleteBlock, duplicateBlock, moveBlock } from './block-commands.js';
import { insertNode, setLink } from './insert-commands.js';
import type { RichTextCommand } from './rich-text-command.js';
import type { RichTextAttributes } from './rich-text-document.js';

function isListType(type: NodeType): boolean {
  return type.isInGroup('list');
}

/** The list item type a list holds. */
function itemTypeOf(list: NodeType): NodeType | null {
  return list.contentMatch.defaultType ?? null;
}

/** The nearest list or quote of this type around the selection's start, with its depth. */
function findWrapper(state: EditorState, type: NodeType): number | null {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (isListType(type) && isListType(node.type)) return node.type === type ? depth : null;
    if (node.type === type) return depth;
  }
  return null;
}

/** Wraps in a list, turns the list around the selection into this type, or lifts out of it. */
function toggleList(type: NodeType, attrs: RichTextAttributes | undefined): Command {
  return (state, dispatch) => {
    const item = itemTypeOf(type);
    if (!item) return false;
    if (findWrapper(state, type) !== null) return liftListItem(item)(state, dispatch);
    const { $from } = state.selection;
    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const node = $from.node(depth);
      if (!isListType(node.type)) continue;
      if (itemTypeOf(node.type) !== item) return false;
      dispatch?.(state.tr.setNodeMarkup($from.before(depth), type, attrs));
      return true;
    }
    return wrapInList(type, attrs)(state, dispatch);
  };
}

function toggleWrap(type: NodeType, attrs: RichTextAttributes | undefined): Command {
  if (isListType(type)) return toggleList(type, attrs);
  return (state, dispatch) =>
    findWrapper(state, type) === null
      ? wrapIn(type, attrs)(state, dispatch)
      : lift(state, dispatch);
}

function nodeCommand(
  build: (type: NodeType, attrs: RichTextAttributes | undefined) => Command,
  name: string,
  attrs: RichTextAttributes | undefined,
): Command {
  return (state, dispatch, view) => {
    const type = state.schema.nodes[name];
    return type ? build(type, attrs)(state, dispatch, view) : false;
  };
}

/** The engine command that runs a library command. */
export function toEngineCommand(command: RichTextCommand): Command {
  switch (command.type) {
    case 'toggle-mark':
      return (state, dispatch) => {
        const type = state.schema.marks[command.mark];
        return type ? toggleMark(type, command.attrs)(state, dispatch) : false;
      };
    case 'set-block':
      return nodeCommand(setBlockType, command.node, command.attrs);
    case 'toggle-wrap':
      return nodeCommand(toggleWrap, command.node, command.attrs);
    case 'insert':
      return nodeCommand(insertNode, command.node, command.attrs);
    case 'insert-text':
      return (state, dispatch) => {
        dispatch?.(state.tr.insertText(command.text).scrollIntoView());
        return true;
      };
    case 'set-link':
      return setLink(command.href);
    case 'undo':
      return undo;
    case 'redo':
      return redo;
    case 'move-block':
      return moveBlock(command.direction);
    case 'duplicate-block':
      return duplicateBlock;
    case 'delete-block':
      return deleteBlock;
  }
}

/** Whether the selection holds text blocks and every one of them has this type and attributes. */
function hasMarkup(state: EditorState, type: NodeType, attrs: RichTextAttributes | undefined) {
  const { from, to } = state.selection;
  let hasBlock = false;
  let isEvery = true;
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isTextblock) return isEvery;
    hasBlock = true;
    isEvery &&= node.hasMarkup(type, attrs);
    return false;
  });
  return hasBlock && isEvery;
}

/** Whether a command's effect already holds at the selection, for a toggle's pressed state. */
export function isCommandActive(command: RichTextCommand, state: EditorState): boolean {
  const { schema, selection } = state;
  if (command.type === 'toggle-mark') {
    const type = schema.marks[command.mark];
    if (!type) return false;
    if (selection.empty) return Boolean(type.isInSet(state.storedMarks ?? selection.$from.marks()));
    return state.doc.rangeHasMark(selection.from, selection.to, type);
  }
  if (command.type === 'set-block' || command.type === 'toggle-wrap') {
    const type = schema.nodes[command.node];
    if (!type) return false;
    if (command.type === 'toggle-wrap') return findWrapper(state, type) !== null;
    return hasMarkup(state, type, type.create(command.attrs).attrs);
  }
  return false;
}

/** Whether the schema has the types a command needs. */
export function isCommandSupported(command: RichTextCommand, state: EditorState): boolean {
  const { nodes, marks } = state.schema;
  if (command.type === 'toggle-mark') return command.mark in marks;
  if (command.type === 'set-link') return 'link' in marks;
  if ('node' in command) return command.node in nodes;
  return true;
}

/** The address of the link at the selection's start, if any. */
export function getLinkAt(state: EditorState): string | null {
  const type = state.schema.marks.link;
  if (!type) return null;
  const { $from, empty } = state.selection;
  const marks = empty ? $from.marks() : (state.doc.nodeAt($from.pos)?.marks ?? $from.marks());
  const href = type.isInSet(marks)?.attrs.href;
  return typeof href === 'string' ? href : null;
}
