import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { HeadingLevelContext, useHeadingLevel, } from '../section-header/section-header.js';
import { Skeleton } from '../skeleton/skeleton.js';
import { CardActionTitle, useCardAction } from './card-action.js';
import { CardHeaderContext } from './card-parts.js';
const hooks = createHooks('card', [
    'media',
    'header',
    'heading',
    'title',
    'action',
    'description',
    'actions',
    'body',
    'skeleton',
    'footer',
]);
/**
 * The card's `aria-labelledby`: the caller's, else its title's (its own, or the slotted title of a
 * custom header) unless the caller names it.
 */
function toLabelledBy(props, title) {
    if (props['aria-labelledby'] !== undefined || props['aria-label'] !== undefined) {
        return props['aria-labelledby'];
    }
    const hasTitle = isEmptyNode(props.header) ? !isEmptyNode(props.title) : title.hasSlottedTitle;
    return hasTitle ? title.id : undefined;
}
function CardHeading({ title, description, headingLevel, titleId, action, }) {
    const Heading = `h${headingLevel}`;
    if (isEmptyNode(title) && isEmptyNode(description))
        return null;
    return (_jsxs("div", { ...hooks.slot('heading'), children: [isEmptyNode(title) ? null : (_jsx(Heading, { ...hooks.slot('title'), id: titleId, children: action.isActionable ? (_jsx(CardActionTitle, { options: action.options, actionRef: action.ref, className: hooks.slotClass('action'), children: title })) : (title) })), isEmptyNode(description) ? null : _jsx("div", { ...hooks.slot('description'), children: description })] }));
}
/** What the custom header's `CardTitle` and `CardAction` take from the card. */
function useHeaderParts({ headingLevel, titleId, titleRef, action, }) {
    const { options, isActionable, ref } = action;
    const { href, target, rel, onAction } = options;
    return useMemo(() => ({
        title: {
            id: titleId,
            className: hooks.slotClass('title'),
            level: headingLevel,
            ref: titleRef,
        },
        action: {
            options: { href, target, rel, onAction },
            isActionable,
            className: hooks.slotClass('action'),
            ref,
        },
    }), [titleId, headingLevel, titleRef, href, target, rel, onAction, isActionable, ref]);
}
/**
 * The `<header>`: custom content, or the title block and actions; nothing when all are empty. Custom
 * content's `CardTitle` and `CardAction` take the title's and the action's props from the card.
 */
function CardHeader({ header, actions, titleRef, ...heading }) {
    const parts = useHeaderParts({ ...heading, titleRef });
    if (!isEmptyNode(header)) {
        return (_jsx("header", { ...hooks.slot('header'), children: _jsx(CardHeaderContext, { value: parts, children: header }) }));
    }
    if ([heading.title, heading.description, actions].every(isEmptyNode))
        return null;
    return (_jsxs("header", { ...hooks.slot('header'), children: [_jsx(CardHeading, { ...heading }), isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('actions'), children: actions })] }));
}
/**
 * A framed container for a self-contained group of content: optional media, an optional header, a
 * body and a footer. With `href` or `onAction` the whole card is a link or press target whose title
 * is the action, while the controls inside it keep their own behaviour.
 */
export function Card({ variant = 'default', density = 'default', title, description, actions, headingLevel, header, media, children, footer, isSelected, isLoading = false, interactive, flush, fill, fullWidth, href, target, rel, onAction, className, ...rest }) {
    const titleId = useId();
    const level = useHeadingLevel(headingLevel);
    const [slottedTitle, setSlottedTitle] = useState(null);
    const options = { href, target, rel, onAction };
    const { isActionable, actionRef, onClick } = useCardAction(options);
    const data = {
        variant,
        density,
        selected: isSelected,
        loading: isLoading,
        interactive: interactive || isActionable,
        flush,
        fill,
        fullWidth,
    };
    const labelledBy = toLabelledBy({ title, header, ...rest }, { id: titleId, hasSlottedTitle: slottedTitle !== null });
    return (_jsxs("section", { ...rest, ...hooks.root({ className, data }), "aria-labelledby": labelledBy, "aria-busy": isLoading || undefined, onClick: isActionable ? onClick : undefined, children: [isEmptyNode(media) ? null : _jsx("div", { ...hooks.slot('media'), children: media }), _jsx(CardHeader, { header: header, title: title, description: description, actions: actions, headingLevel: level, titleId: titleId, titleRef: setSlottedTitle, action: { options, isActionable, ref: actionRef } }), _jsx("div", { ...hooks.slot('body'), children: isLoading ? (_jsx(Skeleton, { className: hooks.slotClass('skeleton') })) : isEmptyNode(title) ? (children) : (_jsx(HeadingLevelContext, { value: level, children: children })) }), isEmptyNode(footer) ? null : _jsx("footer", { ...hooks.slot('footer'), children: footer })] }));
}
//# sourceMappingURL=card.js.map