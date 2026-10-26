import { useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useClipboard } from '../../utils/use-clipboard.js';
/** Whether any command shows. */
export function hasCommands(commands) {
    return (commands.copyText !== undefined ||
        Boolean(commands.onFeedback ||
            commands.onReply ||
            commands.onReact ||
            commands.onEdit ||
            commands.onDelete));
}
/** Splits the command props from the rest of a component's props. */
export function splitCommands(props) {
    const { copyText, onCopy, feedback, onFeedback, feedbackReasons, onReply, onReact, onEdit, onDelete, customEmoji, recentEmoji, onRecentEmojiChange, loadEmoji, ...rest } = props;
    const commands = {
        copyText,
        onCopy,
        feedback,
        onFeedback,
        feedbackReasons,
        onReply,
        onReact,
        onEdit,
        onDelete,
        customEmoji,
        recentEmoji,
        onRecentEmojiChange,
        loadEmoji,
    };
    return [commands, rest];
}
/** Copies `copyText`, counts finished copies and reports a copy that reached the clipboard. */
function useCopyCommand({ copyText, onCopy }) {
    const clipboard = useClipboard();
    const [copies, setCopies] = useState(0);
    const copy = () => {
        void clipboard.copy(copyText ?? '').then((isCopied) => {
            setCopies((count) => count + 1);
            if (isCopied)
                onCopy?.();
        });
    };
    return { copy, copies, copyStatus: clipboard.status };
}
/**
 * Holds what a message's commands share: the rating (controlled by `feedback` when given), the
 * open overlay and its anchor, and the copy outcome.
 */
export function useMessageCommands(commands) {
    const [current, setCurrent] = useControllableState(commands.feedback, null);
    const [open, setOpen] = useState(null);
    const rating = open?.overlay === 'feedback' ? (open.rating ?? null) : current;
    const report = (feedback) => {
        setCurrent(feedback.rating);
        commands.onFeedback?.(feedback);
    };
    return {
        commands,
        rating,
        open,
        ...useCopyCommand(commands),
        rate(next, anchor) {
            if (rating === next) {
                setOpen(null);
                report({ rating: null, reasons: [] });
            }
            else if (commands.feedbackReasons === undefined) {
                report({ rating: next, reasons: [] });
            }
            else {
                setOpen({ overlay: 'feedback', anchor, rating: next });
            }
        },
        finishFeedback(details) {
            if (open?.overlay !== 'feedback' || !open.rating)
                return;
            const comment = details?.comment.trim();
            setOpen(null);
            report({
                rating: open.rating,
                reasons: details?.reasons ?? [],
                ...(comment ? { comment } : {}),
            });
        },
        openOverlay: (overlay, anchor) => setOpen({ overlay, anchor }),
        closeOverlay: () => setOpen(null),
    };
}
//# sourceMappingURL=message-commands.js.map