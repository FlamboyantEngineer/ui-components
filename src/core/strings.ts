import { commonStrings, type CommonStrings } from './common-strings.js';
import { contentStrings, type ContentStrings } from './content-strings.js';
import { fieldStrings, type FieldStrings } from './field-strings.js';
import { historyStrings, type HistoryStrings } from './history-strings.js';

/**
 * Built-in text every component draws from. Hosts override any entry through `UiProvider`. The
 * entries live in four modules so each stays readable.
 */
export interface UiStrings extends CommonStrings, FieldStrings, ContentStrings, HistoryStrings {}

export const defaultStrings: UiStrings = {
  ...commonStrings,
  ...fieldStrings,
  ...contentStrings,
  ...historyStrings,
};
