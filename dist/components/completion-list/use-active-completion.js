import { useLayoutEffect } from 'react';
import { findOverlayScrollContainer } from '../../utils/overlay-geometry.js';
import { getCompletionOptionId } from './completion-option-id.js';
/** Reveals an active option within its own list without scrolling the editor or the document. */
export function useActiveCompletion(listId, activeKey, options) {
    const { isOpen, anchorRef } = options;
    useLayoutEffect(() => {
        if (!isOpen || activeKey === null)
            return;
        const document = anchorRef.current?.ownerDocument;
        const view = document?.defaultView;
        if (!document || !view)
            return;
        let isCurrent = true;
        const frame = view.requestAnimationFrame(() => {
            if (!isCurrent)
                return;
            const list = document.getElementById(listId);
            const option = document.getElementById(getCompletionOptionId(listId, activeKey));
            if (!list || !option || !list.contains(option))
                return;
            const container = findOverlayScrollContainer(option, {
                skip: (ancestor) => ancestor.scrollHeight <= ancestor.clientHeight,
            });
            if (!container || !list.closest('.ui-completion-list')?.contains(container))
                return;
            const bounds = container.getBoundingClientRect();
            const item = option.getBoundingClientRect();
            const top = bounds.top + container.clientTop;
            const bottom = top + container.clientHeight;
            if (item.top < top)
                container.scrollTop -= top - item.top;
            else if (item.bottom > bottom)
                container.scrollTop += item.bottom - bottom;
        });
        return () => {
            isCurrent = false;
            view.cancelAnimationFrame(frame);
        };
    }, [listId, activeKey, isOpen, anchorRef]);
}
//# sourceMappingURL=use-active-completion.js.map