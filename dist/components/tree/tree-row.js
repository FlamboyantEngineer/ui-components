import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { InlineError } from '../inline-error/inline-error.js';
import { TextMatch } from '../text-match/text-match.js';
import { treeHooks as hooks } from './tree-hooks.js';
const expandGlyphs = {
    chevron: { expanded: 'chevron-down', collapsed: 'chevron-right' },
    'plus-minus': { expanded: 'minus', collapsed: 'plus' },
};
/** The expand button of a row with children, or a spacer holding its place. */
function TreeExpandButton({ state, glyph }) {
    const strings = useUiStrings();
    if (!state.hasChildItems)
        return _jsx("span", { ...hooks.slot('expand-spacer'), "aria-hidden": "true" });
    const glyphs = expandGlyphs[glyph];
    return (_jsx(AriaButton, { slot: "chevron", className: hooks.slotClass('expand'), "aria-label": state.isExpanded ? strings.collapse : strings.expand, children: _jsx(Icon, { glyph: state.isExpanded ? glyphs.expanded : glyphs.collapsed, size: "sm" }) }));
}
/** The label slot: the caller's label, the marked text value, or the name field while renaming. */
function TreeRowLabel(props) {
    const { item, state, options } = props;
    const { rename, renderLabel, getTextValue } = options;
    let label;
    if (rename?.editingKey === item.id)
        label = rename.renderEditor(item);
    else if (renderLabel)
        label = renderLabel(item, state);
    else
        label = _jsx(TextMatch, { children: getTextValue(item) });
    return _jsx("span", { ...hooks.slot('label'), children: label });
}
/** Why loading a branch's children failed, with a retry, in the row. */
function TreeLoadError({ loads, itemKey }) {
    const error = loads?.errorOf(itemKey);
    if (!loads || !error)
        return null;
    return (_jsx(InlineError, { className: hooks.slotClass('load-error'), onRetry: () => loads.load(itemKey), children: error }));
}
/**
 * One row's anatomy: drag handle, expand button or spacer, selection checkbox, icon, label, meta,
 * load error and actions.
 */
export function TreeRowContent(props) {
    const { item, state, options } = props;
    const icon = options.getIcon?.(item, state);
    const meta = options.renderMeta?.(item, state);
    const actions = options.renderActions?.(item, state);
    return (_jsxs(_Fragment, { children: [options.hasReorder ? (_jsx(DragHandle, { className: hooks.slotClass('drag-handle'), isDisabled: !options.isMovable(item.id) })) : null, _jsx(TreeExpandButton, { state: state, glyph: options.expandGlyph }), props.hasCheckbox ? (_jsx(Checkbox, { size: "sm", slot: "selection", className: hooks.slotClass('checkbox'), isIndeterminate: options.isIndeterminate(item.id) })) : null, isEmptyNode(icon) ? null : (_jsx(Icon, { ...toIconProps(icon), className: hooks.slotClass('icon') })), _jsx(TreeRowLabel, { item: item, state: state, options: options }), isEmptyNode(meta) ? null : _jsx("span", { ...hooks.slot('meta'), children: meta }), _jsx(TreeLoadError, { loads: options.loads, itemKey: item.id }), isEmptyNode(actions) ? null : _jsx("span", { ...hooks.slot('actions'), children: actions })] }));
}
//# sourceMappingURL=tree-row.js.map