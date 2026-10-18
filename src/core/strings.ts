import { commonStrings, type CommonStrings } from './common-strings.js';
import { contentStrings, type ContentStrings } from './content-strings.js';
import { fieldStrings, type FieldStrings } from './field-strings.js';
import { historyStrings, type HistoryStrings } from './history-strings.js';
import { reviewStrings, type ReviewStrings } from './review-strings.js';
import { timelineStrings, type TimelineStrings } from './timeline-strings.js';

/**
 * Built-in text every component draws from. Hosts override any entry through `UiProvider`. The
 * entries live in several modules so each stays readable.
 */
export interface UiStrings
  extends
    CommonStrings,
    FieldStrings,
    ContentStrings,
    HistoryStrings,
    ReviewStrings,
    TimelineStrings {}

export const defaultStrings: UiStrings = {
  ...commonStrings,
  ...fieldStrings,
  ...contentStrings,
  ...historyStrings,
  ...reviewStrings,
  ...timelineStrings,
};
