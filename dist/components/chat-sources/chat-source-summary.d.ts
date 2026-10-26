/** A source an answer drew on, such as a web page or a document. */
export interface ChatSource {
    id: string;
    title: string;
    /** Where the source lives. Without it the title is plain text. */
    url?: string | undefined;
    /** The site's name; defaults to the URL's host. */
    siteName?: string | undefined;
    /** A short passage of the source. */
    snippet?: string | undefined;
}
type SummarySlot = 'title' | 'site' | 'snippet';
export declare function isExternalUrl(url: string): boolean;
export declare function ChatSourceSummary({ source, slotClass, }: {
    source: ChatSource;
    slotClass: (slot: SummarySlot) => string;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=chat-source-summary.d.ts.map