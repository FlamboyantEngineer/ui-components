import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Tag, TagGroup, TagList } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { FieldPreviousValue } from '../field/field.js';
import { Button } from '../button/button.js';
import { Icon, toIconProps } from '../icon/icon.js';
const hooks = createHooks('select-field', [
    'chips',
    'chip-list',
    'chip',
    'chip-icon',
    'chip-label',
    'chip-remove',
    'removed',
]);
function ChipIcon({ option }) {
    return option.icon ? (_jsx(Icon, { ...toIconProps(option.icon), className: hooks.slotClass('chip-icon') })) : null;
}
/**
 * A multiple select's choices as removable chips in a React Aria tag group (arrow keys move between
 * chips, Delete and Backspace remove one), followed by the committed values the edit removed, each
 * with a button that puts it back.
 */
export function SelectChips({ label, chosen, added, removed, isEditable, isFull, onRemove, onRestore, }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [chosen.length > 0 ? (_jsx(TagGroup, { className: hooks.slotClass('chips'), "aria-label": strings.selectedValues(label), onRemove: isEditable ? (keys) => onRemove(new Set([...keys].map(fromCollectionKey))) : undefined, children: _jsx(TagList, { className: hooks.slotClass('chip-list'), items: chosen, children: (option) => (_jsx(Tag, { ...hooks.slot('chip', {
                            change: added.has(option.id) ? 'added' : null,
                            missing: option.isMissing,
                        }), id: toCollectionKey(option.id), textValue: option.label, children: ({ allowsRemoving }) => (_jsxs(_Fragment, { children: [_jsx(ChipIcon, { option: option }), _jsx("span", { ...hooks.slot('chip-label'), children: option.label }), allowsRemoving ? (_jsx(Button, { slot: "remove", icon: "close", label: strings.remove, variant: "bare", size: "xs", className: hooks.slotClass('chip-remove') })) : null] })) })) }) })) : null, removed.map((option) => (_jsxs(FieldPreviousValue, { className: hooks.slotClass('removed'), restoreLabel: option.label, onRestore: () => onRestore(option.id), isDisabled: isFull, children: [_jsx(ChipIcon, { option: option }), option.label] }, toKeyIdentity(option.id))))] }));
}
//# sourceMappingURL=select-chips.js.map