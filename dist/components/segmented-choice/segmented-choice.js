import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SelectionIndicator, ToggleButton, ToggleButtonGroup } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { formatCount, normalizeCount } from '../../utils/count.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { useChoiceSelection, } from './choice-selection.js';
const hooks = createHooks('segmented-choice', ['segment', 'indicator', 'icon', 'label', 'count']);
/**
 * `aria-readonly`, `aria-invalid` and `aria-busy` on the group, which the building block does not
 * set. A multiple-selection `toolbar` or `group` allows no `aria-readonly`, so only a `radiogroup`
 * states it.
 */
function renderGroupState({ isSingle, isReadOnly, isInvalid, isPending }, render) {
    const statesReadOnly = isSingle && isReadOnly;
    if (!statesReadOnly && !isInvalid && !isPending)
        return render ? { render } : {};
    return {
        render: (props, state) => {
            const merged = {
                ...props,
                'aria-readonly': statesReadOnly || undefined,
                'aria-invalid': isInvalid || undefined,
                'aria-busy': isPending || undefined,
            };
            return render ? render(merged, state) : _jsx("div", { ...merged });
        },
    };
}
// The tooltip of an icon-only segment repeats its name, so it adds no description.
function renderWithoutDescription(props) {
    return _jsx("button", { ...props, "aria-describedby": undefined });
}
/** The shown text of a positive count, or `null` when the option shows none. */
function formatOptionCount(count, max) {
    const value = normalizeCount(count);
    return value === undefined || value === 0 ? null : formatCount(value, { max });
}
function Segment({ option, size, iconOnly, countMax }) {
    const strings = useUiStrings();
    const showsIconOnly = iconOnly && option.icon !== undefined;
    const count = formatOptionCount(option.count, countMax);
    const name = count === null ? option.label : strings.labelWithCount(option.label, count);
    const segment = (_jsxs(ToggleButton, { id: option.value, isDisabled: option.isDisabled, "aria-label": showsIconOnly || count !== null ? name : undefined, render: showsIconOnly ? renderWithoutDescription : undefined, ...hooks.slot('segment', { value: option.value }), children: [_jsx(SelectionIndicator, { className: hooks.slotClass('indicator') }), option.icon ? (_jsx(Icon, { ...toIconProps(option.icon), size: size === 'xs' ? 'sm' : size, className: hooks.slotClass('icon') })) : null, showsIconOnly ? null : (_jsx("span", { ...hooks.slot('label', { label: option.label }), children: option.label })), count === null ? null : (_jsx("span", { ...hooks.slot('count'), "aria-hidden": "true", children: count }))] }));
    return showsIconOnly ? _jsx(Tooltip, { content: option.label, children: segment }) : segment;
}
/** Hidden inputs that submit the selected values with a form. */
function ChoiceInputs({ name, values, isDisabled }) {
    return values.map((value) => (_jsx("input", { type: "hidden", name: name, value: value, disabled: isDisabled }, value)));
}
/**
 * One of a few mutually exclusive values, drawn as a run of segments, or with
 * `selectionMode="multiple"` a group of toggles that press independently. A selection indicator
 * slides between segments as the choice moves.
 */
export function SegmentedChoice({ options, selectionMode, value, defaultValue, onChange, isInherited = false, isClearable = false, isReadOnly = false, isInvalid = false, size = 'md', sizing = 'equal', iconOnly = false, countMax = 99, name, render, className, ...rest }) {
    const selection = useChoiceSelection({
        options,
        selectionMode,
        value,
        defaultValue,
        onChange,
        isInherited,
        isClearable,
        isReadOnly,
    });
    return (_jsxs(ToggleButtonGroup, { ...rest, ...hooks.root({
            className,
            props: rest,
            data: {
                size,
                sizing,
                selectionMode: selection.selectionMode,
                iconOnly,
                inherited: isInherited,
                readonly: isReadOnly,
                invalid: isInvalid,
                pending: selection.isPending,
            },
        }), selectedKeys: selection.selectedKeys, onSelectionChange: selection.onSelectionChange, selectionMode: selection.selectionMode, ...renderGroupState({
            isSingle: selection.selectionMode === 'single',
            isReadOnly,
            isInvalid,
            isPending: selection.isPending,
        }, render), children: [options.map((option) => (_jsx(Segment, { option: option, size: size, iconOnly: iconOnly, countMax: countMax }, option.value))), name ? (_jsx(ChoiceInputs, { name: name, values: selection.selectedKeys, isDisabled: rest.isDisabled })) : null] }));
}
//# sourceMappingURL=segmented-choice.js.map