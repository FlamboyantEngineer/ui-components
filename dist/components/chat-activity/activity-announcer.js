import { jsx as _jsx } from "react/jsx-runtime";
// A polite, throttled live region that the activity parts announce their changes through.
import { useEffect, useRef, useState } from 'react';
import { VisuallyHidden } from '../../primitives/index.js';
import { useLatest } from '../../utils/use-latest.js';
/** The shortest time between two announcements, in milliseconds. */
const announcementInterval = 2000;
/**
 * The announcement of `message`, at most one every two seconds: a message that arrives sooner waits
 * for the rest of the interval, and only the latest waiting message is announced. A message is
 * announced once; after an empty message the same text is announced again.
 */
function useThrottledAnnouncement({ message, onAnnounce }) {
    const [announcement, setAnnouncement] = useState({ id: 0, text: '' });
    const lastMessage = useRef('');
    const lastTime = useRef(-Infinity);
    const latestOnAnnounce = useLatest(onAnnounce);
    useEffect(() => {
        if (message === lastMessage.current)
            return undefined;
        if (message === '') {
            lastMessage.current = '';
            return undefined;
        }
        const announce = () => {
            lastMessage.current = message;
            lastTime.current = Date.now();
            setAnnouncement((previous) => ({ id: previous.id + 1, text: message }));
            latestOnAnnounce.current?.();
        };
        const wait = lastTime.current + announcementInterval - Date.now();
        if (wait <= 0) {
            announce();
            return undefined;
        }
        const timer = window.setTimeout(announce, wait);
        return () => window.clearTimeout(timer);
    }, [message, latestOnAnnounce]);
    return announcement;
}
/**
 * A visually hidden polite status that announces `message` when it changes, throttled to one
 * announcement every two seconds. It starts empty, so a message present from the first render is
 * announced too.
 */
export function ActivityAnnouncer(props) {
    const { id, text } = useThrottledAnnouncement(props);
    return (_jsx(VisuallyHidden, { children: _jsx("div", { role: "status", children: text ? _jsx("span", { children: text }, id) : null }) }));
}
//# sourceMappingURL=activity-announcer.js.map