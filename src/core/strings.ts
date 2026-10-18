import { commonStrings, type CommonStrings } from './common-strings.js';
import { contentStrings, type ContentStrings } from './content-strings.js';
import { editingStrings, type EditingStrings } from './editing-strings.js';
import { fieldStrings, type FieldStrings } from './field-strings.js';
import { historyStrings, type HistoryStrings } from './history-strings.js';
import { mediaStrings, type MediaStrings } from './media-strings.js';
import { planningStrings, type PlanningStrings } from './planning-strings.js';
import { queryStrings, type QueryStrings } from './query-strings.js';
import { reviewStrings, type ReviewStrings } from './review-strings.js';
import { tableStrings, type TableStrings } from './table-strings.js';
import { timelineStrings, type TimelineStrings } from './timeline-strings.js';
import { viewStrings, type ViewStrings } from './view-strings.js';

/**
 * Built-in text every component draws from. Hosts override any entry through `UiProvider`. The
 * entries live in several modules so each stays readable.
 */
export interface UiStrings
  extends
    CommonStrings,
    FieldStrings,
    ContentStrings,
    EditingStrings,
    HistoryStrings,
    ReviewStrings,
    MediaStrings,
    PlanningStrings,
    QueryStrings,
    TableStrings,
    TimelineStrings,
    ViewStrings {}

export const defaultStrings: UiStrings = {
  ...commonStrings,
  ...fieldStrings,
  ...contentStrings,
  ...editingStrings,
  ...historyStrings,
  ...reviewStrings,
  ...mediaStrings,
  ...planningStrings,
  ...queryStrings,
  ...tableStrings,
  ...timelineStrings,
  ...viewStrings,
};
