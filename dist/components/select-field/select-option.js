import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Collection, Header, ListBoxItem, ListBoxSection } from '../../primitives/index.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { isSelectFieldGroup, } from './select-options.js';
const hooks = createHooks('select-field', [
    'section',
    'section-header',
    'option',
    'option-check',
    'option-icon',
    'option-label',
    'option-description',
]);
function OptionContent({ option }) {
    return (_jsxs(_Fragment, { children: [option.icon ? (_jsx(Icon, { ...toIconProps(option.icon), className: hooks.slotClass('option-icon') })) : null, _jsx("span", { ...hooks.slot('option-label'), children: option.label }), option.description ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('option-description'), children: option.description })] })) : null] }));
}
function OptionRow({ id, option, display, }) {
    const { isMultiple, blockedKeys, renderOption } = display;
    return (_jsx(ListBoxItem, { id: id, textValue: option.label, isDisabled: option.isDisabled || blockedKeys.has(option.id), className: hooks.slotClass('option'), children: (state) => (_jsxs(_Fragment, { children: [isMultiple ? (_jsx("span", { ...hooks.slot('option-check'), "aria-hidden": "true", children: state.isSelected ? _jsx(Glyph, { name: "check" }) : null })) : null, renderOption ? (renderOption(option, {
                    isSelected: state.isSelected,
                    isFocused: state.isFocused,
                    isFocusVisible: state.isFocusVisible,
                    isHovered: state.isHovered,
                    isPressed: state.isPressed,
                    isDisabled: state.isDisabled,
                })) : (_jsx(OptionContent, { option: option }))] })) }));
}
/** What the rows depend on beyond their own item, so a cached row is drawn again when it changes. */
export function toDisplayDependencies(display) {
    return [display.isMultiple, display.blockedKeys, display.renderOption];
}
/**
 * Draws the list's items in a React Aria `Collection`, which keeps each item's row while the item
 * and the display stay the same, so filtering a long list does not draw every row again: an option
 * row, or a group as a section (React Aria `ListBoxSection`) led by its heading, when it has one,
 * and holding its options. Rows carry their collection key as `id`, which also keys them.
 */
export function SelectListItems({ items, display, }) {
    return (_jsx(Collection, { items: items, dependencies: toDisplayDependencies(display), children: (item) => isSelectFieldGroup(item) ? (_jsxs(ListBoxSection, { id: toCollectionKey(item.id), className: hooks.slotClass('section'), children: [item.label ? (_jsx(Header, { className: hooks.slotClass('section-header'), children: item.label })) : null, _jsx(Collection, { items: item.options, dependencies: toDisplayDependencies(display), children: (option) => (_jsx(OptionRow, { id: toCollectionKey(option.id), option: option, display: display })) })] })) : (_jsx(OptionRow, { id: toCollectionKey(item.id), option: item, display: display })) }));
}
//# sourceMappingURL=select-option.js.map