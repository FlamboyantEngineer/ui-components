import { jsx as _jsx } from "react/jsx-runtime";
import { useControllableState } from '../../core/controllable-state.js';
import { renderLinkElement } from '../link/link.js';
import { formatAriaKeyShortcuts, } from '../shortcut/shortcut.js';
/** A chord's `aria-keyshortcuts` value, or `undefined` without a chord or for an empty key. */
export function toKeyShortcuts(shortcut, platform) {
    return shortcut ? formatAriaKeyShortcuts(shortcut, platform) || undefined : undefined;
}
function hasEntries(value) {
    return Object.keys(value).length > 0;
}
/**
 * Applies what the building block's button does not forward (a `role` and its states), the
 * `data-disabled` of a focusable disabled button and a removed tooltip description through its
 * `render` hook, handing the result to the caller's `render` when there is one.
 */
function renderPassThrough({ attributes, focusableDisabled, describedBy, render, }) {
    const extra = Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== undefined));
    if (focusableDisabled)
        extra['data-disabled'] = 'true';
    if (describedBy)
        extra['aria-describedby'] = describedBy.value;
    if (!hasEntries(extra))
        return render ? { render } : {};
    return {
        render: (props, state) => {
            const merged = { ...props, ...extra };
            return render ? render(merged, state) : _jsx("button", { ...merged });
        },
    };
}
/** The props that only Button reads, which the building block's button never takes. */
function omitOwnProps({ pendingLabel: _pendingLabel, defaultSelected: _defaultSelected, onChange: _onChange, href: _href, target: _target, rel: _rel, ...rest }) {
    return rest;
}
/** Whether the caller states toggle semantics itself, so `isSelected` adds no `aria-pressed`. */
function statesToggle(props) {
    return (props['aria-pressed'] !== undefined ||
        props['aria-checked'] !== undefined ||
        props.role !== undefined);
}
/**
 * Building-block button props for Button states: a focusable disabled
 * button stays in the focus order but refuses activation and never submits, and `isSelected` adds
 * `aria-pressed` unless the caller states toggle semantics with `aria-pressed`, `aria-checked` or a
 * `role`. A `shortcut` becomes `aria-keyshortcuts`.
 */
export function toAriaButtonProps(props, { isTooltipName = false, platform } = {}) {
    const { isSelected = false, isDisabled = false, focusableWhenDisabled = false, type = 'button', onPress, shortcut, role, render, ref, 'aria-checked': ariaChecked, 'aria-selected': ariaSelected, ...rest } = omitOwnProps(props);
    const focusableDisabled = isDisabled && focusableWhenDisabled;
    return {
        ...rest,
        ref: ref,
        type: focusableDisabled ? 'button' : type,
        isDisabled: isDisabled && !focusableWhenDisabled,
        onPress: focusableDisabled ? undefined : onPress,
        ...(isSelected && !statesToggle(props) ? { 'aria-pressed': true } : {}),
        ...(focusableDisabled ? { 'aria-disabled': true } : {}),
        ...renderPassThrough({
            attributes: {
                role,
                'aria-checked': ariaChecked,
                'aria-selected': ariaSelected,
                'aria-keyshortcuts': toKeyShortcuts(shortcut, platform),
            },
            focusableDisabled,
            describedBy: isTooltipName ? { value: rest['aria-describedby'] } : undefined,
            render,
        }),
    };
}
/**
 * The selected state and press handler of a button. With `defaultSelected` or `onChange` it is a
 * toggle: a press flips the state (held here unless `isSelected` controls it) and reports it, and
 * it states `aria-pressed` unless the caller states toggle semantics. Otherwise `isSelected` only
 * shows the state.
 */
export function useButtonSelection(props) {
    const { isSelected, defaultSelected, onChange, onPress, 'aria-pressed': ariaPressed } = props;
    const isToggle = defaultSelected !== undefined || onChange !== undefined;
    const [selected, setSelected] = useControllableState(isSelected, defaultSelected ?? false, onChange);
    if (!isToggle)
        return { isSelected, onPress, 'aria-pressed': ariaPressed };
    return {
        isSelected: selected,
        'aria-pressed': statesToggle(props) ? ariaPressed : selected,
        onPress: (event) => {
            const result = onPress?.(event);
            setSelected(!selected);
            return result;
        },
    };
}
/**
 * The props that apply to a `<button>` only, which a link button never hands its building block:
 * the native type, the pending and selected states, the button's own focus options and its
 * button-only roles and states.
 */
function omitButtonOnlyProps({ type: _type, isPending: _isPending, pendingLabel: _pendingLabel, isSelected: _isSelected, defaultSelected: _defaultSelected, onChange: _onChange, focusableWhenDisabled: _focusableWhenDisabled, preventFocusOnPress: _preventFocusOnPress, excludeFromTabOrder: _excludeFromTabOrder, slot: _slot, render: _render, role: _role, 'aria-checked': _ariaChecked, 'aria-selected': _ariaSelected, 'aria-pressed': _ariaPressed, 'aria-haspopup': _ariaHaspopup, 'aria-expanded': _ariaExpanded, 'aria-controls': _ariaControls, ...rest }) {
    return rest;
}
/**
 * Building-block link props for a button with `href`: everything a link takes (press, hover, focus
 * and key handlers, labelling, `id`, `autoFocus`, `hidden`), with a safe `rel` for a new tab.
 */
export function toAriaLinkProps(props, { isTooltipName = false, platform } = {}) {
    const { shortcut, ref, target, rel, ...rest } = omitButtonOnlyProps(props);
    const extra = {
        'aria-keyshortcuts': toKeyShortcuts(shortcut, platform),
    };
    if (isTooltipName)
        extra['aria-describedby'] = rest['aria-describedby'];
    return {
        ...rest,
        target,
        rel: rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined),
        ref: ref,
        // The building block draws a `<span>` without `href`; its props fit an anchor's.
        render: (element) => renderLinkElement({ ...element, ...extra }),
    };
}
//# sourceMappingURL=button-state.js.map