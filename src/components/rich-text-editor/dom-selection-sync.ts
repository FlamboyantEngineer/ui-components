// The engine's selection brought up to date with the browser's before an edit reads it.

import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

/** The text positions of the browser's selection in the view, or `null` when it is elsewhere. */
function readDomSelection(view: EditorView): { anchor: number; head: number } | null {
  const selection = (view.root as Document).getSelection();
  const { anchorNode, focusNode } = selection ?? {};
  if (!selection || !anchorNode || !focusNode) return null;
  if (!view.dom.contains(anchorNode) || !view.dom.contains(focusNode)) return null;
  try {
    return {
      anchor: view.posAtDOM(anchorNode, selection.anchorOffset),
      head: view.posAtDOM(focusNode, selection.focusOffset),
    };
  } catch {
    return null;
  }
}

/**
 * Takes the browser's text selection into the engine when they differ. The view can record a
 * caret move as seen while it commits a render, so the move never reaches the state and the next
 * typed text, key or paste would land at the old place (UIC-RICH-TEXT-EDITOR-3.5). Leaves node
 * selections and compositions alone. Returns `false` so the event goes on to its usual handling.
 */
function syncDomSelection(view: EditorView): false {
  const { selection } = view.state;
  if (view.composing || !view.hasFocus() || !(selection instanceof TextSelection)) return false;
  const dom = readDomSelection(view);
  if (!dom || (dom.anchor === selection.anchor && dom.head === selection.head)) return false;
  const { doc } = view.state;
  const next = TextSelection.between(doc.resolve(dom.anchor), doc.resolve(dom.head));
  if (!next.eq(selection)) view.dispatch(view.state.tr.setSelection(next));
  return false;
}

/** The DOM events before which an editor reads the browser's selection into its state. */
export const domSelectionEvents = {
  keydown: syncDomSelection,
  beforeinput: syncDomSelection,
  paste: syncDomSelection,
  cut: syncDomSelection,
  drop: syncDomSelection,
};
