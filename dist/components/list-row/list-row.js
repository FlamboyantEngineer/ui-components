import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { UiLink } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { IconLabel } from '../icon-label/icon-label.js';
import { RowRegistryContext, useListNavigation, useRowTabStop, } from './use-list-navigation.js';
export { ListView, ListViewItem } from './list-view.js';
const listHooks = createHooks('list');
const rowHooks = createHooks('list-row', ['primary', 'trailing']);
const contentHooks = createHooks('list-row-content', ['leading', 'text', 'title', 'meta']);
function resolveKind({ href, onPress }) {
    if (href !== undefined)
        return 'link';
    return onPress ? 'action' : 'static';
}
/** The row's primary control: a link, a React Aria button or a focusable read-only body. */
function ListRowPrimary(props) {
    const { kind, tabStop, children } = props;
    const { href, target, rel, onPress, onAuxPress, isCurrent, isDisabled } = props.options;
    const className = rowHooks.slotClass('primary');
    const tabIndex = isDisabled ? undefined : tabStop.isActive ? 0 : -1;
    if (kind === 'link' && href !== undefined && !isDisabled) {
        return (_jsx(UiLink, { ref: tabStop.setPrimary, href: href, target: target, rel: rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined), className: className, tabIndex: tabIndex, "aria-current": isCurrent ? 'page' : undefined, onClick: () => onPress?.(), onAuxClick: (event) => {
                if (event.button === 1)
                    onAuxPress?.();
            }, children: children }));
    }
    if (kind === 'action') {
        return (_jsx(AriaButton, { ref: tabStop.setPrimary, className: className, isDisabled: isDisabled, excludeFromTabOrder: !tabStop.isActive, onPress: onPress, ...(isCurrent ? { 'aria-current': true } : {}), children: children }));
    }
    return (_jsx("div", { ref: tabStop.setPrimary, className: className, tabIndex: tabIndex, "aria-current": isCurrent || undefined, children: children }));
}
/**
 * A native list of rows with one tab stop: ArrowUp, ArrowDown, Home and End move focus between the
 * rows' primary controls, skipping disabled rows. Links, buttons and trailing controls keep their
 * ordinary roles.
 */
export function List({ isPending = false, divided = false, onNavigatePastStart, handleRef, className, ref, onKeyDown, onBlurCapture, children, ...rest }) {
    const primaryClass = rowHooks.slotClass('primary');
    const navigation = useListNavigation({ primaryClass, onNavigatePastStart, handleRef, ref });
    return (_jsx(RowRegistryContext, { value: navigation.registry, children: _jsx("ul", { ...rest, ...listHooks.root({ className, props: rest, data: { divided, pending: isPending } }), ref: navigation.setRef, "aria-busy": isPending || undefined, onKeyDown: (event) => {
                onKeyDown?.(event);
                navigation.onKeyDown(event);
            }, onBlurCapture: (event) => {
                onBlurCapture?.(event);
                navigation.onBlurCapture(event);
            }, children: children }) }));
}
/**
 * The text of a row without any control: leading media or icon, title and meta. `ListRow` draws it
 * inside its primary control; use it alone inside an element that is itself the link or button.
 */
export function ListRowContent({ title, meta, icon, leading, className, ...rest }) {
    const text = (_jsxs("span", { ...contentHooks.slot('text'), children: [_jsx("span", { ...contentHooks.slot('title'), children: title }), isEmptyNode(meta) ? null : _jsx("span", { ...contentHooks.slot('meta'), children: meta })] }));
    const media = isEmptyNode(leading) ? null : (_jsx("span", { ...contentHooks.slot('leading'), "aria-hidden": "true", children: leading }));
    return (_jsx("span", { ...rest, ...contentHooks.root({ className, props: rest }), children: isEmptyNode(icon) ? (_jsxs(_Fragment, { children: [media, text] })) : (_jsx(IconLabel, { icon: icon, label: text, grow: true })) }));
}
/**
 * One row of a `List`: a primary control (a link, a button or a focusable read-only body) holding
 * the row text, followed by optional trailing controls as siblings. A link row renders exactly one
 * link and nothing interactive inside it.
 */
export function ListRow({ title, meta, icon, leading, href, target, rel, onPress, onAuxPress, trailing, isCurrent = false, isDisabled = false, tone = 'neutral', className, onFocusCapture, ...rest }) {
    const options = { href, target, rel, onPress, onAuxPress, isCurrent, isDisabled };
    const kind = resolveKind(options);
    const tabStop = useRowTabStop(isDisabled, kind);
    const data = { kind, tone, current: isCurrent, disabled: isDisabled };
    return (_jsxs("li", { ...rest, ...rowHooks.root({ className, props: rest, data }), onFocusCapture: (event) => {
            onFocusCapture?.(event);
            tabStop.activate();
        }, children: [_jsx(ListRowPrimary, { kind: kind, options: options, tabStop: tabStop, children: _jsx(ListRowContent, { title: title, meta: meta, icon: icon, leading: leading }) }), isEmptyNode(trailing) ? null : _jsx("div", { ...rowHooks.slot('trailing'), children: trailing })] }));
}
//# sourceMappingURL=list-row.js.map