import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button as AriaButton, Input, SearchField, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { useStoreValue } from '../../utils/value-store.js';
import { getEmojiLabel } from './emoji-catalog.js';
import { useEmojiPickerContext } from './emoji-picker-context.js';
import { EmojiContent } from './emoji-grid.js';
const hooks = createHooks('emoji-picker', [
    'search',
    'search-input',
    'search-clear',
    'preview',
    'preview-emoji',
    'preview-label',
]);
// Down moves from the search field to the grid's first emoji, even from a field laid out after the
// grid, where focusing the grid itself would pick its last. The field's keys stay inside the picker,
// except Escape, which React Aria still stops while it clears a non-empty field.
function moveToGrid(event, gridRef) {
    if (event.key === 'Escape')
        event.continuePropagation();
    if (event.key !== 'ArrowDown')
        return;
    event.preventDefault();
    gridRef.current?.querySelector('[role="row"]')?.focus();
}
/** The picker's search field: Down moves to the first emoji and Enter chooses it. */
export function EmojiPickerSearch({ className, ...rest }) {
    const strings = useUiStrings();
    const { search, chooseFirst, autoFocus, gridRef } = useEmojiPickerContext();
    return (_jsxs(SearchField, { ...rest, ...hooks.slot('search', undefined, className), "aria-label": strings.searchEmoji, value: search.query, autoFocus: autoFocus, onChange: search.setQuery, onSubmit: chooseFirst, onKeyDown: (event) => moveToGrid(event, gridRef), children: [_jsx(Input, { className: hooks.slotClass('search-input'), placeholder: strings.searchEmoji }), _jsx(AriaButton, { className: hooks.slotClass('search-clear'), children: _jsx(Glyph, { name: "close" }) })] }));
}
/** The decorative preview of the emoji last hovered or focused, with its label. */
export function EmojiPickerPreview({ className, ...rest }) {
    const { activeEmoji, grid } = useEmojiPickerContext();
    const active = useStoreValue(activeEmoji);
    return (_jsx("div", { ...rest, ...hooks.slot('preview', undefined, className), "aria-hidden": "true", children: active ? (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('preview-emoji'), children: _jsx(EmojiContent, { entry: active, skinTone: grid.skinTone, renderEmoji: grid.renderEmoji }) }), _jsx("span", { ...hooks.slot('preview-label'), children: getEmojiLabel(active) })] })) : null }));
}
//# sourceMappingURL=emoji-picker-parts.js.map