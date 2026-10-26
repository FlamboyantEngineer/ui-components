import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useLayoutEffect, useMemo, useRef, } from 'react';
import { TabList as AriaTabList, TabListStateContext, TabsContext, useLocale, useSlottedContext, } from '../../primitives/index.js';
import { mergeProps, mergeRefs } from '../../utils/merge-props.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useScrollStripOverflow } from '../../utils/use-scroll-strip-overflow.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { VisibleCollection } from '../overflow-list/overflow-list.js';
import { TabActionsContext, TabsSharedContext } from './tab-actions.js';
import { TabBar, useTabOverflow } from './tab-bar.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { useCenterSelectedTab, useListOverflow } from './tab-list-overflow.js';
import { TabMenuOverlay, useTabMenu } from './tab-menu.js';
import { createTabRename, TabRenameOverlay, } from './tab-rename.js';
import { createTabReorder, useTabReorderKeys } from './tab-reorder.js';
/** Menus and scroll buttons serve horizontal lists; a vertical list scrolls. */
function resolveParts({ orientation, overflow, scrollButtons, }) {
    const horizontal = orientation === 'horizontal';
    return {
        isMenu: horizontal && overflow === 'menu',
        hasButtons: horizontal && overflow === 'scroll' && scrollButtons,
    };
}
/** Adds the list's keys to its element, which React Aria keeps its own keyboard handling on. */
function renderListKeys(render, handlers) {
    return (props, state) => {
        const merged = mergeProps(props, handlers);
        return render ? render(merged, state) : _jsx("div", { ...merged });
    };
}
/** Whether a key went to a tab, rather than to a field inside one. */
function isTabKey(event) {
    return event.target.getAttribute('role') === 'tab';
}
/**
 * The list's keys on its focused tab: Delete and Backspace remove it, F2 renames it and Alt+Arrow
 * moves it, each while the owner takes that action.
 */
function useListKeys({ state, onRemove, rename, onReorderKey }) {
    const { isDisabled } = useContext(TabsSharedContext);
    const focusedKey = () => {
        const key = state?.selectionManager.focusedKey ?? null;
        return key === null || isDisabled || state?.selectionManager.isDisabled(key) ? null : key;
    };
    const handlers = {};
    if (onRemove) {
        handlers.onKeyDown = (event) => {
            const key = focusedKey();
            if ((event.key !== 'Delete' && event.key !== 'Backspace') || key === null)
                return;
            event.preventDefault();
            onRemove(new Set([key]));
        };
    }
    if (rename || onReorderKey) {
        handlers.onKeyDownCapture = (event) => {
            onReorderKey?.(event);
            const key = focusedKey();
            if (!rename || event.key !== 'F2' || !isTabKey(event) || key === null)
                return;
            event.preventDefault();
            rename.start(key);
        };
    }
    return Object.keys(handlers).length > 0 ? handlers : null;
}
/** The chords every tab of the list announces, for the actions the owner takes. */
function listKeyShortcuts(options) {
    const { orientation, actions } = options;
    const moves = orientation === 'horizontal' ? 'ArrowLeft Alt+ArrowRight' : 'ArrowUp Alt+ArrowDown';
    const chords = [
        actions.onRemove ? 'Delete' : null,
        actions.rename ? 'F2' : null,
        actions.reorder ? `Alt+${moves}` : null,
        actions.menu.isEnabled ? 'Shift+F10' : null,
    ].filter(Boolean);
    return chords.length > 0 ? chords.join(' ') : undefined;
}
/** What the list lets its tabs do: remove, rename, reorder and open a menu. */
function useTabActions(props) {
    const shared = useContext(TabsSharedContext);
    const isRtl = useLocale().direction === 'rtl';
    const { onRemove, onRename, validateName, onReorder, onDuplicate, getMenuItems } = props;
    const remove = onRemove && ((keys) => onRemove(new Set([...keys].map(fromCollectionKey))));
    const rename = createTabRename({
        shared,
        onRename: onRename && ((key, name) => onRename(fromCollectionKey(key), name)),
        validateName: validateName && ((key, name) => validateName(fromCollectionKey(key), name)),
    });
    const reorder = createTabReorder({
        shared,
        isRtl,
        onReorder: onReorder &&
            ((move) => onReorder({
                ...move,
                key: fromCollectionKey(move.key),
                targetKey: fromCollectionKey(move.targetKey),
            })),
    });
    const menu = useTabMenu({
        shared,
        rename,
        reorder,
        onRemove: remove,
        onDuplicate: onDuplicate && ((key) => onDuplicate(fromCollectionKey(key))),
        getMenuItems: getMenuItems && ((key, standard) => getMenuItems(fromCollectionKey(key), standard)),
    });
    const actions = { onRemove: remove, rename, reorder, menu };
    return {
        ...actions,
        keyShortcuts: listKeyShortcuts({ orientation: shared.orientation, actions }),
    };
}
/**
 * The row (or column) of tabs. An overflowing list scrolls the selected tab toward its middle, or
 * collapses the tabs that do not fit into a "more" menu; it can draw scroll buttons, removable tabs
 * and an add button, rename and reorder its tabs, and give each tab a menu of its actions.
 */
export function TabList({ overflow = 'scroll', scrollButtons = false, onRemove, onAdd, onRename, validateName, onReorder, onDuplicate, getMenuItems, className, ref, ...rest }) {
    const state = useContext(TabListStateContext);
    const orientation = useSlottedContext(TabsContext)?.orientation ?? 'horizontal';
    const { isMenu, hasButtons } = resolveParts({ orientation, overflow, scrollButtons });
    const [listRef, setListRef] = useForwardedRef(ref);
    const stripRef = useRef(null);
    const menu = useTabOverflow(state, isMenu);
    const strip = useScrollStripOverflow(stripRef);
    const scrollOverflowing = useListOverflow(listRef, orientation);
    useCenterSelectedTab(listRef, { orientation, selectedKey: state?.selectedKey ?? null });
    const actions = useTabActions({
        ...{ onRemove, onRename, validateName },
        ...{ onReorder, onDuplicate, getMenuItems },
    });
    const { stateRef } = useContext(TabsSharedContext);
    useLayoutEffect(() => {
        if (state)
            stateRef.current = state;
    });
    const onReorderKey = useTabReorderKeys({ state, listRef, reorder: actions.reorder });
    const keys = useListKeys({
        state,
        onRemove: actions.onRemove,
        rename: actions.rename,
        onReorderKey,
    });
    const elementRef = useMemo(() => mergeRefs(setListRef, menu.itemContainerRef, hasButtons ? stripRef : undefined), [setListRef, menu.itemContainerRef, hasButtons]);
    // React Aria builds the collection from a hidden render of the list, which draws no parts.
    if (!state) {
        return (_jsx(TabActionsContext.Provider, { value: actions, children: _jsx(AriaTabList, { ...rest, children: keyCollectionChildren(rest.children) }) }));
    }
    const overflowing = isMenu ? menu.hiddenItems.length > 0 : scrollOverflowing;
    const list = (_jsxs(TabActionsContext.Provider, { value: actions, children: [_jsx(VisibleCollection, { keys: menu.visibleKeys, children: _jsx(AriaTabList, { ...mergeProps(rest, { onScroll: hasButtons ? strip.syncOverflow : undefined }), render: keys ? renderListKeys(rest.render, keys) : rest.render, ref: elementRef, ...hooks.slot('list', { overflowing }, className) }) }), _jsx(TabRenameOverlay, { rename: actions.rename, state: state, listRef: listRef }), _jsx(TabMenuOverlay, { menu: actions.menu })] }));
    if (!isMenu && !hasButtons && !onAdd)
        return list;
    return (_jsx(TabBar, { state, orientation, isMenu, hasButtons, menu, onAdd, strip: { ...strip, stripRef }, children: list }));
}
//# sourceMappingURL=tab-list.js.map