import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Dialog } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { PopoverPanel } from '../popover/popover.js';
import { triggerWidthProperty } from '../portal/portal.js';
import { SearchField } from '../search-field/search-field.js';
import { Tree } from '../tree/tree.js';
import { collectAncestorKeys } from './tree-index.js';
const hooks = createHooks('select-field', ['popover', 'dialog', 'search', 'tree']);
/**
 * The dialog in a tree select field's popover: a search that filters the tree, keeping the matches'
 * ancestors as context, and the tree itself, opened at the chosen nodes. Down moves from the search
 * to the tree's first row.
 */
function TreeSelectDialog({ label, items, getTextValue, getChildren, hasChildItems, onLoadChildren, isMultiple, keys, index, cascade, onChoose, onClose, }) {
    const strings = useUiStrings();
    const [filterText, setFilterText] = useState('');
    const treeRef = useRef(null);
    const [expanded] = useState(() => collectAncestorKeys(index, keys));
    // Captured, since a search field with a key handler of its own would keep Escape from closing
    // the popover: Down from the search field moves to the tree's first row, and Escape in the tree
    // closes the popover instead of clearing a multiple choice.
    const onKeyDownCapture = (event) => {
        const isInSearch = event.target.closest(`.${hooks.slotClass('search')}`) !== null;
        if (event.key === 'ArrowDown' && isInSearch) {
            event.preventDefault();
            treeRef.current?.querySelector('[role="row"]')?.focus();
        }
        else if (event.key === 'Escape' && !isInSearch) {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        }
    };
    // A single choice's rows toggle once one is chosen, so pressing the chosen row empties the
    // selection: that keeps the value, and still closes the popover.
    const choose = (selection) => {
        const chosen = selection === 'all' ? [...index.keys()] : [...selection];
        if (isMultiple)
            onChoose(chosen);
        else
            onChoose(chosen.length > 0 ? chosen.slice(-1) : keys);
    };
    return (_jsxs(Dialog, { ...hooks.slot('dialog'), "aria-label": label, render: (props) => _jsx("section", { ...props, onKeyDownCapture: onKeyDownCapture }), children: [_jsx(SearchField, { className: hooks.slotClass('search'), label: strings.filterLabel(label), placeholder: strings.filterLabel(label), size: "sm", value: filterText, onChange: setFilterText, autoFocus: true }), _jsx(Tree, { ref: treeRef, className: hooks.slotClass('tree'), "aria-label": label, variant: "picker", items: items, getTextValue: getTextValue, getChildren: getChildren, hasChildItems: hasChildItems, onLoadChildren: onLoadChildren, selectionMode: isMultiple ? 'multiple' : 'single', selectedKeys: keys, onSelectionChange: choose, onAction: isMultiple ? undefined : (key) => onChoose([key]), onItemKeyDown: (item, event) => {
                    if (isMultiple || event.key !== 'Enter')
                        return false;
                    onChoose([item.id]);
                    return true;
                }, checkboxSelection: isMultiple, selectionPropagation: cascade, defaultExpandedKeys: expanded, filterText: filterText, emptyMessage: filterText.trim() ? strings.noResults : strings.noItems })] }));
}
/**
 * The popover a tree select field opens. Its dialog mounts each time it opens, so the search starts
 * empty and the tree opens at the chosen nodes every time.
 */
export function TreeSelectPopover(props) {
    return (_jsx(PopoverPanel, { ...hooks.slot('popover', { mode: 'tree' }), placement: "bottom start", offset: 4, style: triggerWidthProperty, children: _jsx(TreeSelectDialog, { ...props }) }));
}
//# sourceMappingURL=tree-select-popover.js.map