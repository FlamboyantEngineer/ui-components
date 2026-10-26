import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, Link as AriaLink, ProgressBar } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Shortcut, useDetectedPlatform } from '../shortcut/shortcut.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { useButtonAction } from './button-action.js';
import { toAriaButtonProps, toAriaLinkProps, toKeyShortcuts, useButtonSelection, } from './button-state.js';
const hooks = createHooks('button', ['spinner', 'start-icon', 'label', 'end-icon', 'icon']);
/** The busy indicator of a pending button: an indeterminate progress bar React Aria announces. */
export function ButtonSpinner({ className, label }) {
    const strings = useUiStrings();
    return (_jsx(ProgressBar, { isIndeterminate: true, "aria-label": label ?? strings.loading, className: className }));
}
/**
 * The icons around the label, and the spinner while pending. The icons and label stay while pending,
 * so the button keeps its size and its name; a stylesheet draws the spinner over them.
 */
function ButtonParts({ children, content, icon, startIcon, endIcon, isPending, pendingLabel, }) {
    return (_jsxs(_Fragment, { children: [isPending ? (_jsx(ButtonSpinner, { className: hooks.slotClass('spinner'), label: pendingLabel })) : null, startIcon ? (_jsx(Icon, { ...toIconProps(startIcon), className: hooks.slotClass('start-icon') })) : null, icon ? (_jsx(Icon, { ...toIconProps(icon), className: hooks.slotClass('icon') })) : content === 'parts' ? (children) : (_jsx("span", { ...hooks.slot('label'), children: children })), endIcon ? _jsx(Icon, { ...toIconProps(endIcon), className: hooks.slotClass('end-icon') }) : null] }));
}
/** Wraps a button in a `Tooltip` when it has a hint or a shortcut, which follows the hint. */
export function withTooltip(button, { tooltip, shortcut }) {
    const keys = shortcut && toKeyShortcuts(shortcut) ? _jsx(Shortcut, { chord: shortcut }) : null;
    const hint = isEmptyHint(tooltip) ? null : tooltip;
    if (hint === null && keys === null)
        return button;
    const content = (_jsxs(_Fragment, { children: [hint, hint !== null && keys !== null ? ' ' : null, keys] }));
    return _jsx(Tooltip, { content: content, children: button });
}
function isEmptyHint(tooltip) {
    return tooltip == null || tooltip === false || tooltip === '';
}
/** The icon mode owns its accessible name and defaults, independently of action timing. */
function resolveButtonPresentation(props) {
    const isIcon = props.icon !== undefined;
    const name = props.label ?? props['aria-label'];
    if (isIcon && !name?.trim())
        throw new Error('An icon-only Button requires a non-empty label.');
    const hint = props.tooltip ?? (isIcon && props.shortcut ? name : undefined);
    return {
        isIcon,
        name,
        hint,
        variant: props.variant ?? (isIcon ? 'ghost' : 'secondary'),
        content: isIcon ? 'icon' : props.content,
        isTooltipName: isIcon && hint === name && !props.shortcut,
    };
}
/** A labelled command button, or a link drawn as one with `href`. */
export function Button({ variant, size = 'md', children, content = 'label', align = 'center', icon, label, startIcon, endIcon, fullWidth = false, tooltip, className, onError, pendingDelay, ...rest }) {
    const presentation = resolveButtonPresentation({
        icon,
        label,
        tooltip,
        variant,
        content,
        shortcut: rest.shortcut,
        'aria-label': rest['aria-label'],
    });
    const selection = useButtonSelection(rest);
    const action = useButtonAction({ ...rest, ...selection, onError, pendingDelay });
    const options = { platform: useDetectedPlatform(), isTooltipName: presentation.isTooltipName };
    const isLink = rest.href !== undefined;
    const hookProps = hooks.root({
        className,
        props: rest,
        data: {
            variant: presentation.variant,
            size,
            content: presentation.content,
            align,
            selected: !isLink && selection.isSelected,
            fullWidth,
        },
    });
    const parts = (_jsx(ButtonParts, { content: content, icon: icon, startIcon: startIcon, endIcon: endIcon, isPending: !isLink && action.isPending, pendingLabel: rest.pendingLabel, children: children }));
    const element = isLink ? (_jsx(AriaLink, { ...toAriaLinkProps(rest, options), ...hookProps, "aria-label": presentation.isIcon ? presentation.name : rest['aria-label'], children: parts })) : (_jsx(AriaButton, { ...toAriaButtonProps({ ...rest, ...selection, ...action }, options), ...hookProps, "aria-label": presentation.isIcon ? presentation.name : rest['aria-label'], children: parts }));
    return withTooltip(element, { tooltip: presentation.hint, shortcut: rest.shortcut });
}
export { toAriaButtonProps, toAriaLinkProps, useButtonSelection } from './button-state.js';
export { runPendingAction, usePendingAction } from './button-action.js';
export { ScrollStripButton } from './scroll-strip-button.js';
//# sourceMappingURL=button.js.map