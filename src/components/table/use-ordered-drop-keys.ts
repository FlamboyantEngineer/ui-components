'use client';

import { useContext, useMemo } from 'react';
import {
  CollectionRendererContext,
  type DragAndDropHooks,
  ListKeyboardDelegate,
} from '../../primitives/index.js';

/**
 * React Aria's list delegate, stepping up and down in collection order. Its own steps read the
 * rows' drawn positions to detect a reversed layout, so a row stuck at an edge of a scrolled area
 * makes it step back and forth between two rows forever. Its page steps use these steps too.
 */
function createOrderedDelegate<T>(
  options: ConstructorParameters<typeof ListKeyboardDelegate<T>>[0],
): ListKeyboardDelegate<T> {
  const delegate = new ListKeyboardDelegate<T>(options);
  delegate.getKeyBelow = (key, step) => delegate.getNextKey(key, step);
  delegate.getKeyAbove = (key, step) => delegate.getPreviousKey(key, step);
  return delegate;
}

/**
 * Drag and drop hooks whose keyboard drop target steps through the rows in their order. Every
 * keyboard drag visits each droppable collection on the page, disabled ones included, and loops
 * there while no target accepts it, so a delegate that cycles would freeze the page. It is typed
 * over the hooks object, so its declaration names no building block (UIC-PRIMITIVES-2.1).
 */
export function useOrderedDropKeys<H extends object>(hooks: H): H {
  return useMemo(() => {
    const given = hooks as DragAndDropHooks<unknown>;
    const { useDroppableCollection } = given;
    if (!useDroppableCollection) return hooks;
    const ordered: DragAndDropHooks<unknown> = {
      ...given,
      useDroppableCollection: function useOrderedDroppableCollection(props, state, ref) {
        const { layoutDelegate } = useContext(CollectionRendererContext);
        const keyboardDelegate = createOrderedDelegate({
          collection: state.collection,
          disabledKeys: state.selectionManager.disabledKeys,
          disabledBehavior: state.selectionManager.disabledBehavior,
          ref,
          layoutDelegate,
        });
        return useDroppableCollection({ ...props, keyboardDelegate }, state, ref);
      },
    };
    return ordered as H;
  }, [hooks]);
}
