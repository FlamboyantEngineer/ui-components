import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useId, useRef, } from 'react';
import { SelectionIndicator, Tab as AriaTab } from '../../primitives/index.js';
import { dataAttributes, mergeClassNames } from '../../core/hooks.js';
import { mergeProps } from '../../utils/merge-props.js';
import { normalizeCount } from '../../utils/count.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionItemKey } from '../../utils/to-collection-key.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { isTabDisabled, TabActionsContext, TabsSharedContext, } from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { useTabMenuTarget } from './tab-menu.js';
import { joinIds, TabCount, TabRemoveMark } from './tab-parts.js';
import { useTabDrag } from './tab-reorder.js';
/** Whether a tab refuses focus: on its own, through the list's `disabledKeys`, or with the list. */
function useIsTabDisabled(key, isDisabled) {
    const shared = useContext(TabsSharedContext);
    return isDisabled === true || (key !== undefined && isTabDisabled(shared, key));
}
/** Merges the props a list adds into the tab's element, handing the result to the caller's `render`. */
function renderWithProps(render, extra) {
    return (props, state) => {
        const merged = mergeProps(props, extra);
        if (render)
            return render(merged, state);
        return 'href' in merged ? (_jsx("a", { ...merged })) : (_jsx("div", { ...merged }));
    };
}
/** A tab's plain-text name: its `textValue`, or a label that is plain text. */
function readTabText(textValue, children) {
    return textValue ?? (typeof children === 'string' ? children : undefined);
}
/** The building block draws a tab with `href` as an `<a>`; its props reach the caller's `render`. */
function toTabRender(render) {
    return render
        ? (props, state) => render(props, state)
        : undefined;
}
/** The props a list's actions add to the element of the tab `key`. */
function useTabActionProps(actions, { key, isDisabled, drag, onContextMenu, }) {
    const menuTarget = useTabMenuTarget(actions.menu, { tabKey: key, isDisabled, onContextMenu });
    const { rename, keyShortcuts } = actions;
    if (key === undefined)
        return { menuTarget, extra: null };
    const extra = mergeProps(drag ? { ...drag.dragProps, ref: drag.ref } : {}, menuTarget ?? {}, rename && !isDisabled ? { onDoubleClick: () => rename.start(key) } : {}, keyShortcuts ? { 'aria-keyshortcuts': keyShortcuts } : {});
    return { menuTarget, extra: Object.keys(extra).length > 0 ? extra : null };
}
function TabItem({ actions, drag, children, textValue, icon, count, countMax = 99, countLabel, render, className, onContextMenu, ...rest }) {
    const countId = useId();
    const key = rest.id;
    const isDisabled = useIsTabDisabled(key, rest.isDisabled);
    const { menuTarget, extra } = useTabActionProps(actions, {
        key,
        isDisabled,
        drag,
        onContextMenu,
    });
    const { rename, onRemove } = actions;
    const shown = normalizeCount(count) || null;
    const describedBy = shown === null ? rest['aria-describedby'] : joinIds(rest['aria-describedby'], countId);
    const name = readTabText(textValue, children);
    // React Aria reads `textValue` from a collection item's props for its overflow menu entry.
    const text = { textValue: name };
    return (_jsxs(AriaTab, { ...rest, ...text, ...dataAttributes({
            dragging: drag?.isDragging,
            dropPosition: drag?.dropPosition,
            renaming: rename !== null && key !== undefined && rename.editingKey === key,
        }), onContextMenu: menuTarget ? undefined : onContextMenu, className: mergeClassNames(hooks.slotClass('tab'), className), "aria-describedby": describedBy, render: toTabRender(extra ? renderWithProps(render, extra) : render), children: [_jsx(SelectionIndicator, { className: hooks.slotClass('indicator') }), icon ? _jsx(Icon, { ...toIconProps(icon), className: hooks.slotClass('icon') }) : null, _jsx("span", { ...hooks.slot('label', { label: typeof children === 'string' ? children : undefined }), children: children }), shown === null ? null : (_jsx(TabCount, { id: countId, count: shown, countMax: countMax, countLabel: countLabel })), onRemove && key !== undefined ? (_jsx(TabRemoveMark, { onRemove: () => {
                    if (!isDisabled)
                        onRemove(new Set([key]));
                } })) : null] }));
}
/** A tab of a reorderable list: it drags, and takes drops of the list's other tabs. */
function MovableTab({ reorder, ...props }) {
    const ref = useRef(null);
    const isRenaming = props.actions.rename?.editingKey === props.id;
    const isDisabled = useIsTabDisabled(props.id, props.isDisabled) || isRenaming;
    const textValue = readTabText(props.textValue, props.children) ?? String(fromCollectionKey(props.id));
    const drag = useTabDrag({ tabKey: props.id, textValue, isDisabled, ref, reorder });
    return _jsx(TabItem, { ...props, drag: { ...drag, ref } });
}
/**
 * One tab. With `href` it renders a link that navigates through the provider's router
 * (`UiProvider` `navigate`) when selected. In a list that takes them it draws a close mark, renames
 * in place, drags and opens a menu of its actions.
 */
export function Tab({ id, ...props }) {
    const actions = useContext(TabActionsContext);
    const { reorder } = actions;
    // The list's actions, its panels and its selection all work on the collection key.
    const key = toCollectionItemKey(id);
    return reorder && key !== undefined ? (_jsx(MovableTab, { ...props, id: key, actions: actions, reorder: reorder })) : (_jsx(TabItem, { ...props, id: key, actions: actions }));
}
//# sourceMappingURL=tab.js.map