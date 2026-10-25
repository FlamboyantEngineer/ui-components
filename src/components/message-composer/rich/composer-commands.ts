// Editing commands, Markdown-style shortcuts and plain-text paste of the rich composer.

import { reactKeys } from '@handlewithcare/react-prosemirror';
import {
  baseKeymap,
  chainCommands,
  exitCode,
  newlineInCode,
  splitBlock,
} from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules, textblockTypeInputRule, undoInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { Fragment, Slice, type Node, type Schema } from 'prosemirror-model';
import {
  EditorState,
  Selection,
  TextSelection,
  type Command,
  type Plugin,
} from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { PillAttributes } from './composer-schema.js';

/** Whether the caret or selection is in a code block. */
export function isInCode(state: EditorState): boolean {
  return Boolean(state.selection.$from.parent.type.spec.code);
}

/**
 * Wraps the selection in `marker` on both sides, or puts a pair of markers around the caret,
 * keeping the wrapped text selected. In a code block the key does nothing.
 */
function wrapSelection(marker: string): Command {
  return (state, dispatch) => {
    if (isInCode(state)) return true;
    const from = Selection.near(state.doc.resolve(state.selection.from)).from;
    const to = Selection.near(state.doc.resolve(state.selection.to), -1).to;
    if (dispatch) {
      const tr = state.tr.insertText(marker, to).insertText(marker, from);
      const start = from + marker.length;
      tr.setSelection(TextSelection.create(tr.doc, start, to + marker.length));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** The pill right before (`-1`) or after (`1`) an empty selection, with where it starts. */
export function findAdjacentPill(state: EditorState, side: -1 | 1) {
  const { selection } = state;
  if (!selection.empty) return null;
  const node = side < 0 ? selection.$from.nodeBefore : selection.$from.nodeAfter;
  if (node?.type.name !== 'pill') return null;
  const from = side < 0 ? selection.from - node.nodeSize : selection.from;
  return { from, to: from + node.nodeSize, label: (node.attrs as PillAttributes).label };
}

/**
 * Reads the browser's selection into the editor when the editor has not heard of its change yet:
 * the browser reports a selection change a moment after the key that moved it, so a key pressed
 * right after (by a quick hand or a script) would act on the old selection. Only a text selection
 * the document can map is read.
 */
export function syncSelectionFromDom(view: EditorView): void {
  const { selection } = view.state;
  const dom = view.dom.ownerDocument.getSelection();
  const { anchorNode, focusNode } = dom ?? {};
  if (!(selection instanceof TextSelection) || !dom || !anchorNode || !focusNode) return;
  if (!view.dom.contains(anchorNode) || !view.dom.contains(focusNode)) return;
  try {
    const anchor = view.posAtDOM(anchorNode, dom.anchorOffset);
    const head = view.posAtDOM(focusNode, dom.focusOffset);
    if (anchor === selection.anchor && head === selection.head) return;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, anchor, head)));
  } catch {
    // A browser selection the document cannot map stays as the editor has it.
  }
}

/** Leaves the last code block for a new line below it when the caret is at its end. */
const leaveCodeBlockAtEnd: Command = (state, dispatch) => {
  const { $head } = state.selection;
  const isAtEnd = $head.parentOffset === $head.parent.content.size;
  if (!isInCode(state) || !isAtEnd || $head.after() !== state.doc.content.size) return false;
  return exitCode(state, dispatch);
};

/** Turns an empty code block back into a line of text. */
const unwrapEmptyCodeBlock: Command = (state, dispatch) => {
  const { $head } = state.selection;
  if (!isInCode(state) || $head.parent.content.size > 0) return false;
  const paragraph = state.schema.nodes.paragraph;
  if (!paragraph) return false;
  dispatch?.(state.tr.setBlockType($head.before(), $head.after(), paragraph));
  return true;
};

/** A line break: a new line in a code block, otherwise a new paragraph. */
const breakLine = chainCommands(newlineInCode, splitBlock);

/** The editing plugins: node identities, undo history, the code fence rule and the keys. */
export function createComposerPlugins(schema: Schema): Plugin[] {
  const { codeBlock } = schema.nodes;
  const rules = codeBlock ? [textblockTypeInputRule(/^```$/, codeBlock)] : [];
  return [
    reactKeys(),
    history(),
    inputRules({ rules }),
    keymap({
      'Mod-z': undo,
      'Shift-Mod-z': redo,
      'Mod-y': redo,
      'Mod-b': wrapSelection('**'),
      'Mod-i': wrapSelection('_'),
      Backspace: chainCommands(undoInputRule, unwrapEmptyCodeBlock),
      ArrowDown: leaveCodeBlockAtEnd,
      Enter: breakLine,
      'Shift-Enter': breakLine,
    }),
    keymap(baseKeymap),
  ];
}

/** A fresh state for `doc`, with its own history, the caret at its end. */
export function createComposerState(doc: Node, plugins: readonly Plugin[]): EditorState {
  return EditorState.create({ doc, plugins, selection: Selection.atEnd(doc) });
}

/**
 * Pastes text as it was copied: in a code block as one run, elsewhere a line per paragraph,
 * keeping every space and tab. Formatting from HTML is dropped, since only the plain text is read.
 */
export function pastePlainText(view: EditorView, text: string): void {
  const { state } = view;
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const paragraph = state.schema.nodes.paragraph;
  if (isInCode(state) || lines.length === 1 || !paragraph) {
    view.dispatch(state.tr.insertText(lines.join('\n')).scrollIntoView());
    return;
  }
  const blocks = lines.map((line) => paragraph.create(null, line ? state.schema.text(line) : null));
  const slice = new Slice(Fragment.from(blocks), 1, 1);
  view.dispatch(state.tr.replaceSelection(slice).scrollIntoView());
}
