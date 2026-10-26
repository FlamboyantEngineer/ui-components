import { jsx as _jsx } from "react/jsx-runtime";
import { useContext } from 'react';
import { DisclosureStateContext, useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
const hooks = createHooks('expand-toggle');
/** The chevron of a disclosure: down while expanded, else pointing to the inline end. */
export function useExpandGlyph(isExpanded) {
    const { direction } = useLocale();
    if (isExpanded)
        return 'chevron-down';
    return direction === 'rtl' ? 'chevron-left' : 'chevron-right';
}
/**
 * A chevron button that expands and collapses a row or region. It points to the inline end while
 * collapsed and down while expanded, and its presses never reach the row around it. Inside a React
 * Aria `Disclosure` it is the disclosure's trigger, wired to its panel.
 */
export function ExpandToggle({ isExpanded, defaultExpanded = false, onExpandedChange, isExpandable = true, label, size = 'sm', className, ...rest }) {
    const strings = useUiStrings();
    // A disclosure owns the state, the panel's id and the press that toggles it.
    const disclosure = useContext(DisclosureStateContext);
    const [own, setOwn] = useControllableState(isExpanded, defaultExpanded, onExpandedChange);
    const expanded = disclosure ? disclosure.isExpanded : own;
    const glyph = useExpandGlyph(expanded);
    const toggleProps = disclosure
        ? { slot: 'trigger', onPress: () => onExpandedChange?.(!expanded) }
        : { 'aria-expanded': expanded, onPress: () => setOwn(!own) };
    if (!isExpandable) {
        return (_jsx("span", { ...hooks.root({ className, props: rest, data: { size, leaf: true } }), id: rest.id, "aria-hidden": "true" }));
    }
    return (_jsx(Button, { ...rest, "data-expanded": expanded || undefined, className: mergeClassNames(hooks.className, className), icon: glyph, label: label ?? (expanded ? strings.collapse : strings.expand), size: size, ...toggleProps }));
}
//# sourceMappingURL=expand-toggle.js.map