import { useContext, useEffect, useLayoutEffect, type RefObject } from 'react';
import { ComboBoxStateContext } from '../../primitives/index.js';
import { findFirstOptionKey, type ComboboxCompletion } from './combobox-options.js';

export interface AutoHighlightOptions {
  /** Highlight the first enabled option whenever the list is open and nothing is highlighted. */
  autoHighlight: boolean;
  /** The inline completion, whose option is highlighted while the input shows it. */
  completion: ComboboxCompletion | null;
}

/**
 * Keeps an option highlighted while the list is open, so Enter picks it: the completing option,
 * else, with `autoHighlight`, the first enabled one. React Aria clears the highlight when the text
 * changes, after this hook's effect, so the effect runs after every render and restores it.
 */
export function useAutoHighlight({ autoHighlight, completion }: AutoHighlightOptions) {
  const state = useContext(ComboBoxStateContext);
  useEffect(() => {
    if (!state?.isOpen || state.selectionManager.focusedKey !== null) return;
    const { selectionManager, collection } = state;
    const completing = completion?.text === state.inputValue ? completion.key : null;
    const first = autoHighlight
      ? findFirstOptionKey(collection, (key) => selectionManager.isDisabled(key))
      : null;
    const target = completing ?? first;
    if (target !== null && collection.getItem(target)) selectionManager.setFocusedKey(target);
  });
}

/**
 * Shows the text of an option the add row created once the caller selects it. React Aria builds
 * the new option into its collection a render after the selection, and leaves the text of a focused
 * input alone, so the input would stay empty; reverting once the option exists writes its label and
 * closes the list as a pick does. Opening the list again drops the pending option.
 */
export function useCreatedSelection(createdRef: RefObject<string | null>) {
  const state = useContext(ComboBoxStateContext);
  useEffect(() => {
    if (!state || createdRef.current === null) return;
    if (state.isOpen) return;
    const text = state.selectedItem?.textValue;
    if (text === undefined) return;
    createdRef.current = null;
    if (state.inputValue !== text) state.revert();
  });
}

/**
 * Holds React Aria's list open or closed as the combobox's open state says. The building block keeps
 * its own open state, so a controlled `isOpen` the reader's action did not change puts it back;
 * closing commits the text as Escape does.
 */
export function useOpenState(isOpen: boolean) {
  const state = useContext(ComboBoxStateContext);
  useLayoutEffect(() => {
    if (!state || state.isOpen === isOpen) return;
    if (isOpen) state.open(null, 'manual');
    else state.close();
  });
}
