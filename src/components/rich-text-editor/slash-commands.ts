import { closeHistory, history, redoDepth, undoDepth } from 'prosemirror-history';
import type { EditorState, Transaction } from 'prosemirror-state';
import { isCommandActive, toEngineCommand } from './engine-commands.js';
import type { RichTextCommand } from './rich-text-command.js';

/** The text a slash command replaces, from the slash to the caret. */
export interface SlashRange {
  from: number;
  to: number;
  query: string;
}

const historyKey = history().spec.key;

/** Checks commands against the document after removing the query, without invoking its plugins. */
export function previewSlash(state: EditorState, tr: Transaction): EditorState {
  return state.reconfigure({ plugins: [] }).apply(tr);
}

/** A block type already in effect is still a valid choice, such as Text in a paragraph. */
function isCurrentBlock(command: RichTextCommand, state: EditorState): boolean {
  return command.type === 'set-block' && isCommandActive(command, state);
}

export function canRunSlash(command: RichTextCommand, preview: EditorState, state: EditorState) {
  if (command.type === 'undo') return undoDepth(state) > 0;
  if (command.type === 'redo') return redoDepth(state) > 0;
  return isCurrentBlock(command, preview) || toEngineCommand(command)(preview);
}

/** Builds one edit with a separate undo step, or leaves the query untouched on refusal. */
export function createSlashTransaction(
  state: EditorState,
  range: SlashRange,
  command: RichTextCommand,
): Transaction | null {
  const tr = closeHistory(state.tr.delete(range.from, range.to));
  const isHistory = command.type === 'undo' || command.type === 'redo';
  const historyPlugin = isHistory && state.plugins.find((plugin) => plugin.spec.key === historyKey);
  const preview = historyPlugin
    ? state.reconfigure({ plugins: [historyPlugin] }).apply(tr.setMeta('addToHistory', false))
    : previewSlash(state, tr);
  if (isCurrentBlock(command, preview)) return tr;
  const ran = toEngineCommand(command)(preview, (change) => {
    for (const step of change.steps) tr.step(step);
    if (change.selectionSet) tr.setSelection(change.selection.getBookmark().resolve(tr.doc));
    if (change.storedMarksSet) tr.setStoredMarks(change.storedMarks);
    if (change.scrolledIntoView) tr.scrollIntoView();
    if (historyPlugin) {
      const metadata: unknown = change.getMeta(historyPlugin);
      tr.setMeta(historyPlugin, metadata);
    }
  });
  return ran ? tr : null;
}
