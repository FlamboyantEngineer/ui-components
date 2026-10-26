import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { TextMatch } from '../text-match/text-match.js';
import { Menu, MenuItem, MenuSection, MenuSeparator, SubmenuTrigger, MenuPopover, } from './menu.js';
/** The menu's parts, keyed by their `id`: its `children`, or the parts drawn from its data entries. */
export function renderMenuChildren({ children, items, highlightMatches, }) {
    return keyCollectionChildren(children ?? (items ? renderMenuEntries(items, highlightMatches ?? false) : null));
}
/** Draws the menu's data entries using the same public parts as its JSX children. */
function renderMenuEntries(entries, highlight) {
    return entries.map((entry) => renderEntry(entry, highlight));
}
function renderEntry(entry, highlight) {
    if (entry.type === 'separator')
        return _jsx(MenuSeparator, {}, toKeyIdentity(entry.id));
    if (entry.type === 'section') {
        const { type: _type, items, ...section } = entry;
        return (_jsx(MenuSection, { ...section, children: renderMenuEntries(items, highlight) }, toKeyIdentity(entry.id)));
    }
    const { type: _type, label, items, renderContent, ...item } = entry;
    const element = (_jsx(MenuItem, { textValue: label, ...item, children: renderContent ?? (highlight ? _jsx(TextMatch, { children: label }) : label) }, toKeyIdentity(entry.id)));
    if (!items?.length)
        return element;
    return (_jsxs(SubmenuTrigger, { children: [element, _jsx(MenuPopover, { children: _jsx(Menu, { children: renderMenuEntries(items, highlight) }) })] }, toKeyIdentity(entry.id)));
}
//# sourceMappingURL=menu-entries.js.map