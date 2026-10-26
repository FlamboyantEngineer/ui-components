import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { CommentComposer, } from '../comment-composer/comment-composer.js';
import { InlineError } from '../inline-error/inline-error.js';
import { CommentThreadContext } from './comment-thread-context.js';
const hooks = createHooks('comment-thread', [
    'header',
    'quote',
    'status',
    'resolve',
    'comments',
    'item',
    'more',
    'show-more',
    'error',
    'composer',
]);
/** The comments, with the middle replies of a long thread hidden behind a button until it is pressed. */
function CommentList({ children, visibleReplies, }) {
    const strings = useUiStrings();
    const [isExpanded, setIsExpanded] = useState(false);
    const revealedRef = useRef(null);
    // The first revealed reply takes focus from the button, which disappears.
    useEffect(() => {
        if (isExpanded)
            revealedRef.current?.focus();
    }, [isExpanded]);
    const [first, ...replies] = Children.toArray(children);
    if (first === undefined)
        return null;
    const hidden = isExpanded || visibleReplies === undefined ? 0 : replies.length - visibleReplies;
    const shown = hidden > 0 ? replies.slice(hidden) : replies;
    return (_jsxs("ol", { ...hooks.slot('comments'), children: [_jsx("li", { ...hooks.slot('item'), children: first }), hidden > 0 ? (_jsx("li", { ...hooks.slot('more'), children: _jsx(Button, { variant: "ghost", size: "sm", className: hooks.slotClass('show-more'), onPress: () => setIsExpanded(true), children: strings.showMoreReplies(hidden) }) })) : null, shown.map((reply, index) => (_jsx("li", { ...hooks.slot('item'), ...(isExpanded && index === 0 ? { ref: revealedRef, tabIndex: -1 } : {}), children: reply }, isValidElement(reply) ? reply.key : index)))] }));
}
/** The quote, the resolved badge and the resolve button, when there is any of them. */
function CommentThreadHeader({ quote, isResolved, onToggle, }) {
    const strings = useUiStrings();
    if (isEmptyNode(quote) && !isResolved && !onToggle)
        return null;
    return (_jsxs("div", { ...hooks.slot('header'), children: [isEmptyNode(quote) ? null : _jsx("blockquote", { ...hooks.slot('quote'), children: quote }), isResolved ? (_jsx(Badge, { tone: "success", size: "sm", className: hooks.slotClass('status'), children: strings.resolved })) : null, onToggle ? (_jsx(Button, { variant: "ghost", size: "sm", startIcon: isResolved ? 'undo' : 'check', className: hooks.slotClass('resolve'), onPress: onToggle, children: isResolved ? strings.reopen : strings.resolve })) : null] }));
}
/** The caller's composer, or the default one when the thread takes replies. */
function ThreadComposer({ composer, onReply, isFirst, }) {
    const strings = useUiStrings();
    const content = composer ??
        (onReply ? (_jsx(CommentComposer, { onSubmit: onReply, label: isFirst ? strings.addComment : strings.reply, submitLabel: isFirst ? strings.comment : strings.reply })) : null);
    return isEmptyNode(content) ? null : _jsx("div", { ...hooks.slot('composer'), children: content });
}
/**
 * A discussion: the quoted anchor, an opening comment and its replies, resolve and reopen, an error
 * and a composer for the next reply. A long thread hides its middle replies behind a button.
 */
export function CommentThread({ children, quote, isResolved, defaultResolved = false, onResolvedChange, isReadOnly = false, isSelected = false, visibleReplies, onReply, composer, error, className, ...rest }) {
    const strings = useUiStrings();
    const [resolved, setResolved] = useControllableState(isResolved, defaultResolved, onResolvedChange);
    return (_jsx("div", { ...rest, ...hooks.root({
            className,
            data: { resolved, readonly: isReadOnly, selected: isSelected },
        }), role: "group", "aria-label": rest['aria-label'] ?? (rest['aria-labelledby'] ? undefined : strings.commentThread), children: _jsxs(CommentThreadContext.Provider, { value: { isReadOnly }, children: [_jsx(CommentThreadHeader, { quote: quote, isResolved: resolved, onToggle: onResolvedChange && !isReadOnly ? () => setResolved(!resolved) : null }), _jsx(CommentList, { visibleReplies: visibleReplies, children: children }), isEmptyNode(error) ? null : (_jsx(InlineError, { className: hooks.slotClass('error'), children: error })), isReadOnly || resolved ? null : (_jsx(ThreadComposer, { composer: composer, onReply: onReply, isFirst: Children.toArray(children).length === 0 }))] }) }));
}
//# sourceMappingURL=comment-thread.js.map