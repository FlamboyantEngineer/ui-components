import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The collapsible frame reasoning and groups of steps share: a trigger with a label and a busy
// indicator, and a panel that opens while the work goes on and collapses once it ends.
import { useState } from 'react';
import { Button as AriaButton, Disclosure, DisclosurePanel, useFocusWithin, } from '../../primitives/index.js';
import { Glyph } from '../../core/provider.js';
import { mergeProps } from '../../utils/merge-props.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
/**
 * The open state: the caller's, else the reader's choice, else open while the work goes on or while
 * focus is inside the panel, so the panel never collapses under the reader's focus.
 */
function useActivityExpansion({ isActive, isExpanded, defaultExpanded, onExpandedChange, expandsAutomatically = true, }) {
    const [choice, setChoice] = useState(defaultExpanded);
    const [isFocusWithin, setFocusWithin] = useState(false);
    const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setFocusWithin });
    return {
        isExpanded: isExpanded ?? choice ?? ((expandsAutomatically && isActive) || isFocusWithin),
        onExpandedChange(next) {
            setChoice(next);
            onExpandedChange?.(next);
        },
        focusWithinProps,
    };
}
/**
 * A React Aria disclosure without a heading: a trigger holding the indicator glyph, the label and,
 * while the work goes on, a decorative spinner; then the panel, a group named by the trigger.
 */
export function ActivityDisclosure({ hooks, isActive, isPanelBusy = false, label, data, isExpanded, defaultExpanded, onExpandedChange, expandsAutomatically, className, children, ...rest }) {
    const expansion = useActivityExpansion({
        isActive,
        isExpanded,
        defaultExpanded,
        onExpandedChange,
        expandsAutomatically,
    });
    const glyph = useExpandGlyph(expansion.isExpanded);
    return (_jsxs(Disclosure, { ...rest, ...hooks.root({ className, props: rest, data }), isExpanded: expansion.isExpanded, onExpandedChange: expansion.onExpandedChange, children: [_jsxs(AriaButton, { slot: "trigger", className: hooks.slotClass('trigger'), children: [_jsx(Glyph, { name: glyph, className: hooks.slotClass('indicator') }), _jsx("span", { ...hooks.slot('label'), children: label }), isActive ? _jsx("span", { ...hooks.slot('spinner'), "aria-hidden": "true" }) : null] }), _jsx(DisclosurePanel, { className: hooks.slotClass('panel'), render: (props) => (_jsx("div", { ...mergeProps(props, expansion.focusWithinProps), "aria-busy": isPanelBusy || undefined })), children: children })] }));
}
//# sourceMappingURL=activity-disclosure.js.map