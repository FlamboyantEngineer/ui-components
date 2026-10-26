import type { Key } from '../core/props.js';
import { type FocusTarget } from './focus-target.js';
/** What the items' remove buttons report to the list that owns them. */
export interface RemovalFocus {
    /** Records an item's remove button, or its removal with `null`. */
    register: (id: Key, button: HTMLElement | null) => void;
    /** Records a press on an item's remove button, before the owner's remove callback runs. */
    willRemove: (id: Key) => void;
}
/**
 * After the item of a pressed remove button leaves `items`, and the focus left with it, focuses the
 * next item's remove button, else the previous one's, else `fallback`, so a keyboard or screen
 * reader user keeps their place. A list that unmounts with the removal sends the focus to
 * `fallback` too.
 */
export declare function useRemovalFocus(items: readonly {
    id: Key;
}[], fallback: FocusTarget | undefined): RemovalFocus;
//# sourceMappingURL=use-removal-focus.d.ts.map