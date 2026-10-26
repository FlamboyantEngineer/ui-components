import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// The composer's "+" menu: the host's categories of items, whose actions get the composer's helpers
// (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-5).
import { useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useFocusHandback } from '../../utils/use-focus-handback.js';
import { Button } from '../button/button.js';
import { Menu, MenuItem, MenuOverlay, MenuPopover, MenuSection, MenuTrigger, SubmenuTrigger, } from '../menu/menu.js';
import { composerHooks as hooks } from './composer-hooks.js';
import { attachChosenFiles } from './use-file-drop.js';
/** The note an item shows: why it is unavailable while it is disabled, else its description. */
function toNote(item) {
    return item.isDisabled ? (item.disabledReason ?? item.description) : item.description;
}
/** One item, or a submenu trigger with its nested items; a toggle reports its new state and stays open. */
function renderItem(item, helpers) {
    const note = toNote(item);
    const isToggle = item.isSelected !== undefined;
    const element = (_jsx(MenuItem, { id: item.id, 
        // The search field matches the note as well as the label; the label leads for type-to-select.
        textValue: note ? `${item.label} ${note}` : item.label, icon: item.icon, description: note, shortcut: item.shortcut, isDisabled: item.isDisabled, 
        // A disabled item stays reachable by the arrow keys, so its reason can be read.
        focusableWhenDisabled: true, isSelected: item.isSelected, ...(isToggle ? { shouldCloseOnSelect: false } : {}), onAction: () => {
            if (isToggle)
                item.onSelectedChange?.(!item.isSelected);
            item.onAction?.(helpers);
        }, children: item.label }, item.id));
    if (!item.items?.length)
        return element;
    return (_jsxs(SubmenuTrigger, { children: [element, _jsx(MenuPopover, { children: _jsx(Menu, { className: hooks.slotClass('menu'), children: item.items.map((child) => renderItem(child, helpers)) }) })] }, item.id));
}
/**
 * The "+" button at the start of the toolbar and the menu it opens above the composer: the host's
 * sections of items, optionally led by a search field. Insertions take focus back to the input once
 * the menu has closed and given focus back to the button. The file chooser behind `attachFiles` is a
 * hidden file input, since the press that opens it is the host's menu item rather than a button.
 */
export function ComposerMenu({ menu, anchorRef, model, onAttach, isDisabled }) {
    const strings = useUiStrings();
    const handback = useFocusHandback(model.focusInput);
    const chooserRef = useRef(null);
    const helpers = {
        insertText: (text) => {
            model.insertText(text);
            handback.request();
        },
        insertPill: (pill) => {
            model.insertPill(pill);
            handback.request();
        },
        attachFiles: () => {
            const chooser = chooserRef.current;
            if (!chooser)
                return;
            // Choosing the same file again still reports it.
            chooser.value = '';
            chooser.click();
        },
        focusInput: handback.request,
    };
    return (_jsxs(_Fragment, { children: [_jsxs(MenuTrigger, { children: [_jsx(Button, { ref: handback.ref, className: hooks.slotClass('menu-button'), icon: "plus", label: strings.composerMenu, size: "sm", isDisabled: isDisabled }), _jsx(MenuOverlay, { placement: "top start", triggerRef: anchorRef, children: _jsx(Menu, { className: hooks.slotClass('menu'), filterable: menu.filterable, children: menu.sections.map((section) => (_jsx(MenuSection, { id: section.id, title: section.title, children: section.items.map((item) => renderItem(item, helpers)) }, section.id))) }) })] }), onAttach ? (_jsx("input", { ref: chooserRef, type: "file", multiple: true, hidden: true, onChange: (event) => attachChosenFiles(event.target.files, onAttach) })) : null] }));
}
//# sourceMappingURL=composer-menu.js.map