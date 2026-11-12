import { defineStrings } from '../message-format.js';
/** Strings of chat sources and citations. */
interface ChatSourcesStrings {
  /** Labels the trigger of a list of sources and names the list, by their count: "Sources (3)". */
  chatSourcesLabel: (count: number) => string;
  /** Names an inline citation: its number and its source's title. */
  chatCitationLabel: (index: number, title: string) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const chatSourcesStrings = defineStrings<ChatSourcesStrings>({
  chatSourcesLabel: (count) => ({ count }),
  chatCitationLabel: (index, title) => ({ index, title }),
});
