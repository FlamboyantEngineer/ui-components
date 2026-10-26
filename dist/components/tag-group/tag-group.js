import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { Tag as AriaTag, TagGroup as AriaTagGroup, TagList } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { fromCollectionSelection, toCollectionSelectionProps, } from '../../utils/collection-selection.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { toCollectionItemKey } from '../../utils/to-collection-key.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
const hooks = createHooks('tag-group', ['list', 'tag', 'label', 'remove', 'empty']);
const ToneContext = createContext('neutral');
/**
 * A focusable collection of tags (React Aria `TagGroup`): the arrow keys move between tags, and with
 * `onRemove` each tag offers a remove button and Delete and Backspace remove the focused tag.
 * Without `onRemove` the tags stay focusable and offer no removal.
 */
export function TagGroup({ children, items, size = 'md', tone = 'neutral', renderEmptyState, className, selectedKeys, defaultSelectedKeys, disabledKeys, onSelectionChange, onRemove, ...rest }) {
    return (_jsx(AriaTagGroup, { ...rest, ...hooks.root({ className, props: rest, data: { size } }), ...toCollectionSelectionProps({
            selectedKeys,
            defaultSelectedKeys,
            disabledKeys,
            onSelectionChange,
        }), onRemove: onRemove && ((keys) => onRemove(fromCollectionSelection(keys))), children: _jsx(ToneContext, { value: tone, children: _jsx(TagList, { className: hooks.slotClass('list'), items: items, renderEmptyState: renderEmptyState
                    ? () => _jsx("span", { ...hooks.slot('empty'), children: renderEmptyState() })
                    : undefined, children: keyCollectionChildren(children) }) }) }));
}
/**
 * One tag of a `TagGroup`. In a group with `onRemove` an enabled tag ends with a remove button,
 * named by the provider's `remove` string read with the tag's name.
 */
export function Tag({ id, children, tone, textValue, className, ...rest }) {
    const strings = useUiStrings();
    const groupTone = useContext(ToneContext);
    return (_jsx(AriaTag, { ...rest, id: toCollectionItemKey(id), ...hooks.slot('tag', { tone: tone ?? groupTone }, className), textValue: textValue ?? (typeof children === 'string' ? children : undefined), children: ({ allowsRemoving, isDisabled }) => (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('label'), children: children }), allowsRemoving && !isDisabled ? (_jsx(Button, { slot: "remove", icon: "close", label: strings.remove, variant: "bare", size: "xs", className: hooks.slotClass('remove') })) : null] })) }));
}
//# sourceMappingURL=tag-group.js.map