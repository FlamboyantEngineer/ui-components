import { defineStrings } from '../message-format.js';
/** Shared approval action text used by tool-call approvals. */
interface ReviewStrings {
  approve: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const reviewStrings = defineStrings<ReviewStrings>({});
