import { defineStrings } from '../message-format.js';
/** Strings of the chat model picker: its trigger's name and its menu's section titles. */
interface ChatModelPickerStrings {
  /** Titles the menu's section of models. */
  chatModel: string;
  /** Titles the menu's section of reasoning efforts. */
  chatEffort: string;
  /**
   * Names the picker's trigger by the current model and, when the model takes one, its effort. The
   * name holds both labels in the order the trigger shows them, so it contains the visible text.
   */
  chatModelTrigger: (model: string, effort?: string) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const chatModelPickerStrings = defineStrings<ChatModelPickerStrings>({
  chatModelTrigger: (model, effort) => ({ model, effort, hasEffort: effort !== undefined }),
});
