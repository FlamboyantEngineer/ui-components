export interface ActivityAnnouncerProps {
    /** The latest message to announce; an empty one announces nothing. */
    message: string;
    /** Runs as each message is announced. */
    onAnnounce?: (() => void) | undefined;
}
/**
 * A visually hidden polite status that announces `message` when it changes, throttled to one
 * announcement every two seconds. It starts empty, so a message present from the first render is
 * announced too.
 */
export declare function ActivityAnnouncer(props: ActivityAnnouncerProps): import("react").JSX.Element;
//# sourceMappingURL=activity-announcer.d.ts.map