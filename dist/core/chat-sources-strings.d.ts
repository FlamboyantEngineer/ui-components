/** Strings of chat sources and citations. */
export interface ChatSourcesStrings {
    /** Names a list of sources, by their count. */
    chatSourcesLabel: (count: number) => string;
    /** Names an inline citation: its number and its source's title. */
    chatCitationLabel: (index: number, title: string) => string;
}
export declare const chatSourcesStrings: ChatSourcesStrings;
//# sourceMappingURL=chat-sources-strings.d.ts.map