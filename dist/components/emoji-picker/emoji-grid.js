import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { GridList, GridListItem } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { applySkinTone, getEmojiKey, getEmojiLabel, } from './emoji-catalog.js';
const hooks = createHooks('emoji-picker', ['section', 'label', 'grid', 'cell', 'image']);
// Grid keys stay inside the picker, even at the grid's edges where React Aria lets them bubble,
// so they never reach shortcuts of the surface that owns it.
const gridKeys = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Enter',
    ' ',
]);
function stopGridKeys(event) {
    if (gridKeys.has(event.key))
        event.stopPropagation();
}
export function EmojiContent({ entry, skinTone, renderEmoji, }) {
    if (entry.kind === 'custom') {
        return (_jsx("img", { ...hooks.slot('image'), src: entry.emoji.src, alt: "", loading: "lazy", draggable: false }));
    }
    const unicode = applySkinTone(entry.emoji, skinTone);
    return renderEmoji ? renderEmoji(unicode) : unicode;
}
/** One labelled grid of emoji; arrow keys move through it in two dimensions. */
export function EmojiGrid({ label, entries, skinTone, onSelect, onActiveChange, renderEmoji, gridRef, className, ...rest }) {
    const labelId = useId();
    const byKey = new Map(entries.map((entry) => [getEmojiKey(entry), entry]));
    const choose = (key) => {
        const entry = byKey.get(String(key));
        if (entry)
            onSelect(entry);
    };
    return (_jsxs("div", { ...rest, ...hooks.slot('section', undefined, className), onFocus: (event) => {
            const entry = byKey.get(event.target.dataset.key ?? '');
            if (entry)
                onActiveChange(entry);
        }, onKeyDown: stopGridKeys, children: [_jsx("div", { ...hooks.slot('label'), id: labelId, children: label }), _jsx(GridList, { ref: gridRef, className: hooks.slotClass('grid'), "aria-labelledby": labelId, layout: "grid", onAction: choose, children: entries.map((entry) => (_jsx(GridListItem, { id: getEmojiKey(entry), className: hooks.slotClass('cell'), textValue: getEmojiLabel(entry), onHoverStart: () => onActiveChange(entry), children: _jsx(EmojiContent, { entry: entry, skinTone: skinTone, renderEmoji: renderEmoji }) }, getEmojiKey(entry)))) })] }));
}
//# sourceMappingURL=emoji-grid.js.map