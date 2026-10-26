import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { transcriptHooks as hooks } from './transcript-hooks.js';
/** Announcements are spaced at least this far apart, in milliseconds. */
export const ANNOUNCE_INTERVAL = 1000;
/** One announcement for everything queued: the statuses, then the message or the count of them. */
function composeAnnouncement(messages, notices, strings) {
    const [first] = messages;
    const parts = [...notices];
    if (messages.length > 1)
        parts.push(strings.newMessageCount(messages.length));
    else if (first)
        parts.push(strings.newMessageAnnouncement(first.author, first.text));
    return parts.join(' ');
}
/**
 * Queues announcements and reads them out through one polite live region at most once a
 * second: the first right away, then what arrived meanwhile as one announcement.
 */
export function useTranscriptAnnouncer(strings) {
    const [text, setText] = useState('');
    const queue = useRef({ messages: [], notices: [] });
    const timer = useRef(null);
    const stringsRef = useLatest(strings);
    const pump = useCallback(() => {
        if (timer.current !== null)
            return;
        const { messages, notices } = queue.current;
        if (messages.length === 0 && notices.length === 0)
            return;
        const next = composeAnnouncement(messages, notices, stringsRef.current);
        queue.current = { messages: [], notices: [] };
        // A repeated announcement still changes the region, so it is read again.
        setText((current) => (current === next ? `${next}\u200b` : next));
        timer.current = setTimeout(() => {
            timer.current = null;
            pump();
        }, ANNOUNCE_INTERVAL);
    }, [stringsRef]);
    useEffect(() => () => {
        if (timer.current !== null)
            clearTimeout(timer.current);
    }, []);
    return {
        text,
        message(announcement) {
            queue.current.messages.push(announcement);
            pump();
        },
        notice(notice) {
            queue.current.notices.push(notice);
            pump();
        },
    };
}
/** The visually hidden live region the announcer reads through. */
export function TranscriptAnnouncerRegion({ text }) {
    return (_jsx(VisuallyHidden, { className: hooks.slotClass('announcer'), role: "status", children: text }));
}
//# sourceMappingURL=transcript-announcer.js.map