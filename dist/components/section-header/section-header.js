import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useContext, useId } from 'react';
import { Button as AriaButton, Disclosure, DisclosurePanel, DisclosureStateContext, } from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Stack } from '../layout/layout.js';
import { HeadingLevelContext, useHeadingLevel } from './heading-level.js';
export { HeadingLevelContext, useHeadingLevel } from './heading-level.js';
const headerHooks = createHooks('section-header', [
    'content',
    'title',
    'trigger',
    'chevron',
    'description',
    'actions',
]);
const sectionHooks = createHooks('section', ['panel']);
function HeaderContent({ title, description, actions, headingLevel, headingId, }) {
    const Heading = `h${headingLevel}`;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { ...headerHooks.slot('content'), children: [_jsx(Heading, { ...headerHooks.slot('title'), id: headingId, children: title }), isEmptyNode(description) ? null : (_jsx("div", { ...headerHooks.slot('description'), children: description }))] }), isEmptyNode(actions) ? null : _jsx("div", { ...headerHooks.slot('actions'), children: actions })] }));
}
/** The trigger's chevron, following the enclosing disclosure's state. */
function SectionChevron() {
    const state = useContext(DisclosureStateContext);
    const glyph = useExpandGlyph(state?.isExpanded ?? false);
    return _jsx(Glyph, { name: glyph, className: headerHooks.slotClass('chevron') });
}
/**
 * A section whose title is a disclosure trigger: the section stays a `Stack` named by its heading,
 * and its content collapses in a disclosure panel.
 */
function CollapsibleSection({ title, description, actions, headingLevel, children, space = '2xl', className, isExpanded, defaultExpanded = true, onExpandedChange, grow, fill, clip, collapsible: _collapsible, ...rest }) {
    const headingId = useId();
    const level = useHeadingLevel(headingLevel);
    const trigger = (_jsxs(AriaButton, { slot: "trigger", className: headerHooks.slotClass('trigger'), children: [_jsx(SectionChevron, {}), title] }));
    return (_jsxs(Disclosure, { isExpanded: isExpanded, defaultExpanded: defaultExpanded, onExpandedChange: onExpandedChange, 
        // React Aria keeps `id` and naming props off its element; the section takes them here.
        render: (domProps) => (_jsx(Stack, { as: "section", ...domProps, ...rest, className: mergeClassNames(sectionHooks.className, className), "data-collapsible": "true", space: space, grow: grow, fill: fill, clip: clip, "aria-labelledby": headingId })), children: [_jsx("header", { ...headerHooks.root(), children: _jsx(HeaderContent, { title: trigger, description: description, actions: actions, headingLevel: level, headingId: headingId }) }), _jsx(DisclosurePanel, { className: sectionHooks.slotClass('panel'), children: _jsx(HeadingLevelContext, { value: level, children: _jsx(Stack, { space: space, children: children }) }) })] }));
}
/**
 * A section title with optional supporting text and trailing actions, in a `<header>` that is not
 * a landmark: outside sectioning content a `<header>` would be the page's banner.
 */
export function SectionHeader({ title, description, actions, headingLevel, className, ...rest }) {
    const headingId = useId();
    const level = useHeadingLevel(headingLevel);
    return (_jsx("header", { role: "none", ...rest, ...headerHooks.root({ className }), children: _jsx(HeaderContent, { title: title, description: description, actions: actions, headingLevel: level, headingId: headingId }) }));
}
/** A section whose content always shows. */
function PlainSection({ title, description, actions, headingLevel, children, space = '2xl', className, isExpanded: _isExpanded, defaultExpanded: _defaultExpanded, onExpandedChange: _onExpandedChange, collapsible: _collapsible, ...rest }) {
    const headingId = useId();
    const level = useHeadingLevel(headingLevel);
    return (_jsxs(Stack, { as: "section", ...rest, className: mergeClassNames(sectionHooks.className, className), space: space, "aria-labelledby": headingId, children: [_jsx("header", { ...headerHooks.root(), children: _jsx(HeaderContent, { title: title, description: description, actions: actions, headingLevel: level, headingId: headingId }) }), _jsx(HeadingLevelContext, { value: level, children: children })] }));
}
/**
 * A `<section>` region named by its header's title, followed by its content in a `Stack`. The
 * description and actions stay out of the region's name. Sections nested in its content take the
 * next heading level, and a `collapsible` section's title toggles its content.
 */
export function Section(props) {
    return props.collapsible ? _jsx(CollapsibleSection, { ...props }) : _jsx(PlainSection, { ...props });
}
//# sourceMappingURL=section-header.js.map