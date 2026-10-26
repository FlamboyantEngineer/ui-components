import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { Button } from '../button/button.js';
const hooks = createHooks('pagination', ['list', 'item', 'previous', 'next', 'page', 'ellipsis']);
/** Pages always listed at each end, and on each side of the current page. */
const edgePages = 1;
const siblingPages = 1;
/** The most entries the list holds: both ends, the current page, its siblings and two gaps. */
const maxEntries = 2 * edgePages + 2 * siblingPages + 3;
function listPages(from, to) {
    return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
}
/**
 * The entries of a page list: every page when they fit in seven entries, else the first and last
 * pages, the current page with one page on each side, and a gap wherever pages are skipped. A gap
 * that would hide a single page shows that page instead.
 */
export function getPaginationItems(page, pageCount) {
    const count = Math.max(1, Math.floor(pageCount));
    if (count <= maxEntries)
        return listPages(1, count);
    const current = clamp(page, 1, count);
    const lastMiddle = count - edgePages - 1;
    const start = clamp(current - siblingPages, edgePages + 2, lastMiddle - 2 * siblingPages);
    const end = clamp(current + siblingPages, edgePages + 2 * siblingPages + 2, lastMiddle);
    return [
        ...listPages(1, edgePages),
        start > edgePages + 2 ? 'start-gap' : edgePages + 1,
        ...listPages(start, end),
        end < lastMiddle ? 'end-gap' : count - edgePages,
        ...listPages(count - edgePages + 1, count),
    ];
}
/**
 * Page navigation: a `nav` landmark holding previous and next buttons around the page buttons, the
 * current one marked `aria-current="page"`, with gaps where pages are skipped. Previous and next stay
 * focusable at either end, so focus is never lost while paging with the keyboard.
 */
export function Pagination({ pageCount, page, defaultPage = 1, onPageChange, isDisabled = false, 'aria-label': label, className, id, ...rest }) {
    const strings = useUiStrings();
    const { locale, direction } = useLocale();
    const [requested, setPage] = useControllableState(page, defaultPage, onPageChange);
    const count = Math.max(1, Math.floor(pageCount));
    const current = clamp(requested, 1, count);
    const goTo = (next) => {
        if (next !== current)
            setPage(next);
    };
    const isRtl = direction === 'rtl';
    return (_jsx("nav", { ...hooks.root({ className, props: rest, data: { disabled: isDisabled } }), id: id, "aria-label": label ?? strings.pagination, children: _jsxs("ul", { ...hooks.slot('list'), children: [_jsx("li", { ...hooks.slot('item'), children: _jsx(Button, { className: hooks.slotClass('previous'), icon: isRtl ? 'chevron-right' : 'chevron-left', label: strings.previousPage, size: "sm", isDisabled: isDisabled || current === 1, focusableWhenDisabled: true, onPress: () => goTo(current - 1) }) }), getPaginationItems(current, count).map((item) => (_jsx("li", { ...hooks.slot('item'), children: typeof item === 'number' ? (_jsx(Button, { className: hooks.slotClass('page'), variant: "ghost", size: "sm", isDisabled: isDisabled, "aria-label": strings.pageNumber(item), "aria-current": item === current ? 'page' : undefined, "data-current": item === current || undefined, onPress: () => goTo(item), children: item.toLocaleString(locale) })) : (_jsx("span", { ...hooks.slot('ellipsis'), "aria-hidden": "true", children: "\u2026" })) }, item))), _jsx("li", { ...hooks.slot('item'), children: _jsx(Button, { className: hooks.slotClass('next'), icon: isRtl ? 'chevron-left' : 'chevron-right', label: strings.nextPage, size: "sm", isDisabled: isDisabled || current === count, focusableWhenDisabled: true, onPress: () => goTo(current + 1) }) })] }) }));
}
//# sourceMappingURL=pagination.js.map