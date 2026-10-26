import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Autocomplete, Dialog, Input, MenuContext, Modal as AriaModal, ModalOverlay, SearchField, useFilter, } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Menu } from '../menu/menu.js';
import { useLayerZIndex } from '../portal/portal.js';
import { isChordPress, useDocumentShortcut } from './command-palette-shortcut.js';
const hooks = createHooks('command-palette', [
    'panel',
    'dialog',
    'search',
    'search-icon',
    'search-input',
    'empty',
]);
/**
 * The dialog: a search field over a menu of commands (React Aria `Autocomplete`). Focus stays in
 * the field while the arrow keys move through the commands; each opening starts from
 * `defaultInputValue`.
 */
function CommandPaletteDialog({ id, 'aria-label': label, inputValue, defaultInputValue, onInputChange, filter, shortcut, placeholder, renderEmptyState, close, ...menu }) {
    const strings = useUiStrings();
    const { contains } = useFilter({ sensitivity: 'base' });
    const [query, setQuery] = useControllableState(inputValue, defaultInputValue ?? '', onInputChange);
    const hint = placeholder ?? strings.searchCommands;
    // Seen before the field, which would otherwise keep the key press for itself.
    const onKeyDownCapture = (event) => {
        if (!shortcut || !isChordPress(event.nativeEvent, shortcut))
            return;
        event.preventDefault();
        event.stopPropagation();
        close();
    };
    return (_jsx(Dialog, { id: id, "aria-label": label ?? strings.commandPalette, className: hooks.slotClass('dialog'), render: (props) => _jsx("section", { ...props, onKeyDownCapture: onKeyDownCapture }), children: _jsxs(Autocomplete, { inputValue: query, onInputChange: setQuery, filter: filter === null ? undefined : (filter ?? contains), children: [_jsxs(SearchField, { className: hooks.slotClass('search'), "aria-label": hint, autoFocus: true, children: [_jsx(Glyph, { name: "search", className: hooks.slotClass('search-icon') }), _jsx(Input, { className: hooks.slotClass('search-input'), placeholder: hint })] }), _jsx(MenuContext.Provider, { value: { onClose: close }, children: _jsx(Menu, { ...menu, highlightMatches: true, renderEmptyState: () => (_jsx("span", { ...hooks.slot('empty'), children: renderEmptyState?.() ?? strings.noResults })) }) })] }) }));
}
/**
 * A command palette: a modal dialog holding a search field and the commands it narrows (React Aria
 * `ModalOverlay`, `Dialog`, `Autocomplete` and the library `Menu`). A document-wide chord opens it;
 * running a command, Escape on an empty field or a press outside closes it, and focus returns to
 * where it was.
 */
export function CommandPalette({ isOpen, defaultOpen, onOpenChange, shortcut = 'Ctrl+K', size = 'md', className, ...rest }) {
    const [open, setOpen] = useControllableState(isOpen, defaultOpen ?? false, onOpenChange);
    const zIndex = useLayerZIndex('modal');
    const [, dialogProps] = splitDataAttributes(rest);
    const changeOpen = (next) => {
        if (next !== open)
            setOpen(next);
    };
    useDocumentShortcut(shortcut, () => changeOpen(true));
    return (_jsx(ModalOverlay, { ...hooks.root({ className, props: rest, data: { layer: 'modal', size } }), isOpen: open, onOpenChange: changeOpen, isDismissable: true, style: { position: 'fixed', inset: 0, zIndex }, children: _jsx(AriaModal, { className: hooks.slotClass('panel'), children: _jsx(CommandPaletteDialog, { ...dialogProps, shortcut: shortcut, size: size, close: () => changeOpen(false) }) }) }));
}
//# sourceMappingURL=command-palette.js.map