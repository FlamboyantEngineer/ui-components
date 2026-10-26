import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The parts a disclosure is composed of: a header, the title that toggles it, and its panel.
import { useContext } from 'react';
import { useFocusManager, Button as AriaButton, DisclosureGroupStateContext, DisclosurePanel as AriaDisclosurePanel, DisclosureStateContext, Heading, } from '../../primitives/index.js';
import { mergeClassNames } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { HeadingLevelContext } from '../section-header/section-header.js';
import { DisclosurePartsContext, disclosureGroupHooks, disclosureHooks as hooks, } from './disclosure-hooks.js';
/** The keys that move focus between the triggers of a group, and where each one moves it. */
const groupKeys = {
    ArrowDown: 'focusNext',
    ArrowUp: 'focusPrevious',
    Home: 'focusFirst',
    End: 'focusLast',
};
/** While collapsed a start indicator points to the inline end and an end one down; open, they turn. */
function useIndicatorGlyph(position, isExpanded) {
    const startGlyph = useExpandGlyph(isExpanded);
    if (position === 'start')
        return startGlyph;
    return isExpanded ? 'chevron-up' : 'chevron-down';
}
/**
 * Arrow keys, Home and End on a trigger move focus between the triggers of its own group, skipping
 * disabled ones and those of groups nested in a panel. Outside a group the keys do nothing. Other
 * keys keep propagating, which React Aria stops by default once a key handler is set.
 */
function useGroupNavigation() {
    const group = useContext(DisclosureGroupStateContext);
    const focusManager = useFocusManager();
    return (event) => {
        const move = groupKeys[event.key];
        if (!group || !focusManager || !move) {
            event.continuePropagation();
            return;
        }
        const ownGroup = event.target.closest(`.${disclosureGroupHooks.className}`);
        event.preventDefault();
        focusManager[move]({
            wrap: true,
            accept: (node) => node.classList.contains(hooks.slotClass('trigger')) &&
                node.closest(`.${disclosureGroupHooks.className}`) === ownGroup,
        });
    };
}
/** The row that holds a `DisclosureTitle` and controls beside it, such as actions. */
export function DisclosureHeader({ className, children, ...rest }) {
    return (_jsx("div", { ...rest, className: mergeClassNames(hooks.slotClass('header'), className), children: children }));
}
/**
 * The disclosure's heading, at its level, holding the trigger: a button that toggles the panel and
 * shows the indicator glyph before or after the title.
 */
export function DisclosureTitle({ className, children, ...rest }) {
    const { level, indicatorPosition } = useContext(DisclosurePartsContext);
    const isExpanded = useContext(DisclosureStateContext)?.isExpanded ?? false;
    const glyph = useIndicatorGlyph(indicatorPosition, isExpanded);
    const onKeyDown = useGroupNavigation();
    const indicator = _jsx(Glyph, { name: glyph, className: hooks.slotClass('indicator') });
    return (_jsx(Heading, { ...rest, level: level, className: mergeClassNames(hooks.slotClass('heading'), className), children: _jsxs(AriaButton, { ...hooks.slot('trigger', { indicatorPosition }), slot: "trigger", onKeyDown: onKeyDown, children: [indicatorPosition === 'start' ? indicator : null, _jsx("span", { ...hooks.slot('title'), children: children }), indicatorPosition === 'end' ? indicator : null] }) }));
}
/**
 * The content a disclosure shows and hides. It stays mounted while
 * collapsed, and headings inside take the levels below the disclosure's title.
 */
export function DisclosurePanel({ className, children, ...rest }) {
    const { level } = useContext(DisclosurePartsContext);
    return (_jsx(AriaDisclosurePanel, { ...rest, className: mergeClassNames(hooks.slotClass('panel'), className), children: _jsx(HeadingLevelContext, { value: level, children: children }) }));
}
//# sourceMappingURL=disclosure-parts.js.map