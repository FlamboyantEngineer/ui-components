import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { GridList, GridListHeader, GridListItem, GridListSection } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createValueStore, useStoreValue } from '../../utils/value-store.js';
import { SearchField } from '../search-field/search-field.js';
import { filterCharacterCategories, formatCodePoints, } from './character-filter.js';
import { useRecentCharacters } from './use-recent-characters.js';
const hooks = createHooks('character-grid', [
    'search',
    'grid',
    'section',
    'heading',
    'cell',
    'message',
    'preview',
    'preview-char',
    'preview-name',
    'preview-code',
]);
// Grid keys stay inside the grid, even at its edges where React Aria lets them bubble, so they
// never reach the menu or toolbar that holds it.
const gridKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
function getCellKey(section, char) {
    return encodeURIComponent(JSON.stringify([section, char]));
}
/**
 * The decorative preview of the character last hovered or focused: itself, its name and code. It
 * reads the active character from a store, so a hover re-renders the preview alone, not the grid.
 */
function CharacterPreview({ active }) {
    const character = useStoreValue(active);
    return (_jsx("div", { ...hooks.slot('preview'), "aria-hidden": "true", children: character ? (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('preview-char'), children: character.char }), _jsx("span", { ...hooks.slot('preview-name'), children: character.name }), _jsx("span", { ...hooks.slot('preview-code'), children: formatCodePoints(character.char) })] })) : null }));
}
/** The grid list: one section per category, headed by its label, one cell per character. */
function CharacterSections({ sections, gridRef, onAction, onActiveChange, ...labelling }) {
    return (_jsx(GridList, { ref: gridRef, className: hooks.slotClass('grid'), ...labelling, layout: "grid", onAction: onAction, children: sections.map((section) => (_jsxs(GridListSection, { id: toCollectionKey(section.key), className: hooks.slotClass('section'), children: [_jsx(GridListHeader, { className: hooks.slotClass('heading'), children: section.label }), section.characters.map((character) => (_jsx(GridListItem, { id: getCellKey(section.key, character.char), className: hooks.slotClass('cell'), textValue: character.name, onHoverStart: () => onActiveChange(character), children: character.char }, getCellKey(section.key, character.char))))] }, section.key))) }));
}
/** The sections shown: recent characters first while nothing is searched, else the matches. */
function useSections(categories, query, recent) {
    const strings = useUiStrings();
    const shown = filterCharacterCategories(categories, query).map((category) => ({ key: `category-${category.id}`, ...category }));
    if (query.trim() === '' && recent.length > 0) {
        shown.unshift({ key: 'recent', label: strings.recentCharacters, characters: recent });
    }
    const byKey = new Map();
    shown.forEach((section) => {
        for (const character of section.characters)
            byKey.set(getCellKey(section.key, character.char), character);
    });
    return { sections: shown, byKey };
}
/**
 * A searchable grid of characters, such as symbols to insert, grouped in the caller's categories:
 * one React Aria grid list whose sections are headed by category, moved through with the arrow keys
 * in two dimensions. The search matches names and code points, the recently chosen characters lead
 * the grid (kept through the provider's storage), and a preview names the hovered or focused one.
 */
export function CharacterGrid({ categories, onSelect, persistKey, autoFocus = false, className, id, ...rest }) {
    const strings = useUiStrings();
    const [query, setQuery] = useState('');
    const [active] = useState(() => createValueStore(null));
    const recent = useRecentCharacters(persistKey, categories);
    const { sections, byKey } = useSections(categories, query, recent.characters);
    const gridRef = useRef(null);
    const labelledBy = rest['aria-labelledby'];
    const label = labelledBy ? undefined : (rest['aria-label'] ?? strings.characterGrid);
    const choose = (character) => {
        if (!character)
            return;
        recent.remember(character);
        onSelect(character);
    };
    // Down from the search field moves to the first cell. A capture handler, since a search field
    // with a key handler of its own would keep Escape from closing the surface around it.
    const moveToGrid = (event) => {
        const target = event.target;
        if (event.key !== 'ArrowDown' || !target.closest(`.${hooks.slotClass('search')}`))
            return;
        event.preventDefault();
        gridRef.current?.querySelector(`.${hooks.slotClass('cell')}`)?.focus();
    };
    return (_jsxs("div", { ...hooks.root({ className, props: rest, data: { searching: query.trim() !== '' } }), id: id, role: "group", "aria-label": label, "aria-labelledby": labelledBy, "aria-describedby": rest['aria-describedby'], "aria-details": rest['aria-details'], onFocus: (event) => {
            const character = byKey.get(event.target.dataset.key ?? '');
            if (character)
                active.set(character);
        }, onKeyDownCapture: moveToGrid, onKeyDown: (event) => {
            if (gridKeys.has(event.key))
                event.stopPropagation();
        }, children: [_jsx(SearchField, { className: hooks.slotClass('search'), label: strings.searchCharacters, placeholder: strings.searchCharacters, size: "sm", value: query, onChange: setQuery, onSubmit: () => choose(sections[0]?.characters[0]), autoFocus: autoFocus }), sections.length === 0 ? (_jsx("div", { ...hooks.slot('message'), role: "status", children: strings.noResults })) : (_jsx(CharacterSections, { "aria-label": label, "aria-labelledby": labelledBy, sections: sections, gridRef: gridRef, onAction: (key) => choose(byKey.get(key)), onActiveChange: active.set })), _jsx(CharacterPreview, { active: active })] }));
}
//# sourceMappingURL=character-grid.js.map