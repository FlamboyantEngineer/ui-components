import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { useFocusWithin, useHover } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeProps } from '../../utils/merge-props.js';
import { getDisplayName } from '../avatar/avatar.js';
import { ChatMessageAvatar, ChatMessageBody, ChatMessageHeader, chatMessageHooks as hooks, useAbsoluteTime, } from './chat-message-parts.js';
import { useTranscriptMessage } from './transcript-context.js';
/** Splits the props the body under the header shows from the article's own props. */
function splitBodyProps({ quote, onQuotePress, error, onRetry, isEdited, reactions, actions, children, ...own }) {
    return [
        { quote, onQuotePress, error, onRetry, isEdited, reactions, actions, children },
        own,
    ];
}
/** What the message shows: the author's avatar and name lead a group, and the time, unless hidden. */
function resolveDisplay({ author, groupPosition, showAvatar = true, showAuthorName = true, showTime = true, variant = 'bubble', }) {
    const startsGroup = groupPosition === 'single' || groupPosition === 'first';
    return {
        avatar: startsGroup && showAvatar ? author : undefined,
        showsName: startsGroup && showAuthorName,
        showsTime: showTime,
        variant,
        avatarHidden: !showAvatar,
    };
}
/** Whether the pointer is over the message and whether focus is inside it, for its hooks. */
function useMessageInteraction() {
    const { hoverProps, isHovered } = useHover({});
    const [isFocusWithin, setFocusWithin] = useState(false);
    const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setFocusWithin });
    return { isHovered, isFocusWithin, interactionProps: mergeProps(hoverProps, focusWithinProps) };
}
/**
 * One message in a conversation: an `<article>` named by its author and absolute time, with the
 * author's avatar and name at the start of a group and a relative time (each unless hidden), the content
 * in a bubble or plain, its quote, markers, delivery, error, reactions, readers and actions. A
 * streaming message is busy (`aria-busy`) so assistive technology reads it once it completes.
 */
export function ChatMessage({ origin = 'received', author, showAvatar, showAuthorName, showTime, variant, time, status = 'complete', groupPosition = 'single', delivery, isDeleted = false, readers, getNow, className, ...rest }) {
    const strings = useUiStrings();
    const { isHovered, isFocusWithin, interactionProps } = useMessageInteraction();
    const labelId = useId();
    const authorName = author ? getDisplayName(author.name, strings.unnamed) : undefined;
    const transcript = useTranscriptMessage({ id: rest.id, authorName, origin, status });
    const label = strings.chatMessageLabel(authorName, useAbsoluteTime(time, getNow));
    const display = resolveDisplay({
        ...{ author, groupPosition, variant },
        ...{ showAvatar, showAuthorName, showTime },
    });
    const [body, own] = splitBodyProps(rest);
    const data = {
        variant: display.variant,
        origin,
        status,
        groupPosition,
        delivery,
        deleted: isDeleted,
        hovered: isHovered,
        focusWithin: isFocusWithin,
        avatarHidden: display.avatarHidden,
    };
    return (_jsxs("article", { ...mergeProps(own, interactionProps, transcript), ...hooks.root({ className, data }), "aria-busy": status === 'streaming' || undefined, "aria-labelledby": label ? labelId : undefined, children: [label ? (_jsx("span", { id: labelId, hidden: true, children: label })) : null, display.avatar ? _jsx(ChatMessageAvatar, { author: display.avatar }) : null, _jsxs("div", { ...hooks.slot('body'), children: [_jsx(ChatMessageHeader, { authorName: display.showsName ? authorName : undefined, time: display.showsTime ? time : undefined, getNow: getNow }), isDeleted ? (_jsx("div", { ...hooks.slot('content'), children: strings.chatMessageDeleted })) : (_jsx(ChatMessageBody, { ...body, isCancelled: status === 'cancelled', delivery: delivery })), readers ? _jsx("div", { ...hooks.slot('readers'), children: readers }) : null] })] }));
}
//# sourceMappingURL=chat-message.js.map