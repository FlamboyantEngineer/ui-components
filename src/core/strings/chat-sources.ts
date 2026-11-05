import { defineStrings } from '../message-format.js';
/** Strings of chat sources and citations. */
interface ChatSourcesStrings {
  /** Names a list of sources, by their count. */
  chatSourcesLabel: (count: number) => string;
  /** Names an inline citation: its number and its source's title. */
  chatCitationLabel: (index: number, title: string) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const chatSourcesStrings = defineStrings<ChatSourcesStrings>({
  chatSourcesLabel: (count) => ({ count }),
  chatCitationLabel: (index, title) => ({ index, title }),
});
