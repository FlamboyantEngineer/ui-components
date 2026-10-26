import { type RefObject } from 'react';
import { type InsertMenuItem } from './insert-items.js';
/** The caret marker's place in the surface, in pixels. */
export interface CaretPlace {
    left: number;
    top: number;
    height: number;
}
/**
 * The slash menu's state: open while the editor has focus and a slash query sits before the caret
 * (until Escape closes it for that slash), its matching items, the active one, and the caret
 * marker's place. Arrow keys move the active item, Enter or Tab runs it in place of the query.
 */
export declare function useSlashMenu(items: readonly InsertMenuItem[], surfaceRef: RefObject<HTMLElement | null>): {
    isOpen: boolean;
    matches: InsertMenuItem[];
    activeIndex: number;
    caret: CaretPlace | null;
    choose: (this: unknown, item: InsertMenuItem) => void;
    setActiveIndex: (index: number) => void;
};
//# sourceMappingURL=use-slash-menu.d.ts.map