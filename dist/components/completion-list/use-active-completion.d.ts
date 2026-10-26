import { type RefObject } from 'react';
import type { Key } from '../../core/props.js';
/** Reveals an active option within its own list without scrolling the editor or the document. */
export declare function useActiveCompletion(listId: string, activeKey: Key | null, options: {
    isOpen: boolean;
    anchorRef: RefObject<Element | null>;
}): void;
//# sourceMappingURL=use-active-completion.d.ts.map