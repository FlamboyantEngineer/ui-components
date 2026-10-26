import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Popover, useLocale } from '../../primitives/index.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useFrameFlag } from '../../utils/use-frame-flag.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { triggerWidthProperty, useLayerZIndex } from '../portal/portal.js';
import { getCompletionOptionId } from './completion-option-id.js';
import { useActiveCompletion } from './use-active-completion.js';
const hooks = createHooks('completion-list', [
    'listbox',
    'option',
    'label',
    'description',
    'documentation',
    'empty',
    'footer',
]);
/**
 * Alternates between the logical and physical spelling of the same placement whenever the anchor
 * moved, measured each time the editor passes new items (as it does when the caret moves), because
 * React Aria repositions an open popover only when its placement changes.
 */
function useFollowedPlacement(anchorRef, isOpen, items) {
    const { direction } = useLocale();
    const [turn, setTurn] = useState(0);
    const lastRect = useRef('');
    useLayoutEffect(() => {
        const rect = isOpen ? anchorRef.current?.getBoundingClientRect() : undefined;
        const next = rect ? `${rect.x} ${rect.y} ${rect.width} ${rect.height}` : '';
        if (next === lastRect.current)
            return;
        lastRect.current = next;
        if (next)
            setTurn((current) => current + 1);
    }, [anchorRef, isOpen, items]);
    if (turn % 2 === 0)
        return 'bottom start';
    return direction === 'rtl' ? 'bottom right' : 'bottom left';
}
function CompletionOption({ item, listId, props, documentationId, }) {
    const isActive = item.id === props.activeKey;
    return (_jsx("div", { ...hooks.slot('option', { focused: isActive, kind: item.kind }), id: getCompletionOptionId(listId, item.id), role: "option", "aria-selected": isActive, "aria-describedby": isActive ? documentationId : undefined, 
        // A press inserts the option without taking focus from the editor.
        onPointerDown: (event) => event.preventDefault(), onPointerMove: () => {
            if (!isActive)
                props.onActiveKeyChange?.(item.id);
        }, onClick: () => props.onAction(item.id), children: props.renderItem ? (props.renderItem(item, { isActive })) : (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('label'), children: item.label }), item.description ? ' ' : null, item.description ? _jsx("span", { ...hooks.slot('description'), children: item.description }) : null] })) }));
}
/**
 * A list of completions for an editor that keeps focus and owns the caret: a listbox in a
 * non-modal popover against an anchor, with the active option's documentation and a footer. It
 * draws options only: the editor moves `activeKey`, names the active option in
 * `aria-activedescendant` and calls `onAction`.
 */
export function CompletionList(props) {
    const { isOpen, onOpenChange, anchorRef, items, activeKey, renderEmptyState, footer } = props;
    const strings = useUiStrings();
    const zIndex = useLayerZIndex('dropdown');
    const generatedId = useId();
    const listId = props.id ?? generatedId;
    const isShown = useFrameFlag(isOpen && (items.length > 0 || Boolean(renderEmptyState)), anchorRef);
    const placement = useFollowedPlacement(anchorRef, isShown, items);
    useActiveCompletion(listId, activeKey, { isOpen: isShown, anchorRef });
    const documentation = items.find((item) => item.id === activeKey)?.documentation;
    const documentationId = documentation ? `${listId}-documentation` : undefined;
    const { className, ...rest } = props;
    const label = props['aria-labelledby'] ? undefined : (props['aria-label'] ?? strings.suggestions);
    return (_jsxs(Popover, { ...hooks.root({ className, props: rest }), isOpen: isShown, onOpenChange: (open) => onOpenChange?.(open), isNonModal: true, triggerRef: anchorRef, placement: placement, offset: 2, style: { ...triggerWidthProperty, zIndex }, children: [items.length > 0 ? (_jsx("div", { ...hooks.slot('listbox'), id: listId, role: "listbox", "aria-label": label, "aria-labelledby": props['aria-labelledby'], "aria-describedby": props['aria-describedby'], "aria-details": props['aria-details'], children: items.map((item) => (_jsx(CompletionOption, { item: item, listId: listId, props: props, documentationId: documentationId }, toKeyIdentity(item.id)))) })) : (_jsx("div", { ...hooks.slot('empty'), id: listId, role: "status", children: renderEmptyState?.() })), documentation ? (_jsx("div", { ...hooks.slot('documentation'), id: documentationId, onPointerDown: (event) => event.preventDefault(), children: documentation })) : null, footer ? (_jsx("div", { ...hooks.slot('footer'), onPointerDown: (event) => event.preventDefault(), children: footer })) : null] }));
}
/** The list of a text control's completions, drawn from its completions model. */
export function ControlCompletionList({ model, listId, anchorRef, renderCompletion, className, }) {
    return (_jsx(CompletionList, { id: listId, className: className, isOpen: model.isOpen, onOpenChange: (open) => (open ? undefined : model.close()), anchorRef: anchorRef, items: model.options.map((option, index) => ({ ...option, id: index })), activeKey: model.activeIndex, onActiveKeyChange: (key) => model.setActiveIndex(Number(key)), onAction: (key) => {
            const option = model.options[Number(key)];
            if (option)
                model.apply(option);
        }, renderItem: renderCompletion }));
}
export { getCompletionOptionId } from './completion-option-id.js';
export { matchCompletions, scoreCompletion } from './completion-match.js';
export { createTriggerCompletions } from './trigger-completions.js';
export { useCompletions } from './use-completions.js';
export { toCompletionInputAttributes, useTextCompletions } from './text-completions.js';
//# sourceMappingURL=completion-list.js.map