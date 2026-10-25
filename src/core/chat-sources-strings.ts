/** Strings of chat sources and citations. */
export interface ChatSourcesStrings {
  /** Names a list of sources, by their count. */
  chatSourcesLabel: (count: number) => string;
  /** Names an inline citation: its number and its source's title. */
  chatCitationLabel: (index: number, title: string) => string;
}

export const chatSourcesStrings: ChatSourcesStrings = {
  chatSourcesLabel: (count) => (count === 1 ? '1 source' : `${count} sources`),
  chatCitationLabel: (index, title) => `Source ${index}: ${title}`,
};
