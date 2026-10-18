import { analysisStrings, type AnalysisStrings } from './analysis-strings.js';
import { commonStrings, type CommonStrings } from './common-strings.js';
import { contentStrings, type ContentStrings } from './content-strings.js';
import { dashboardStrings, type DashboardStrings } from './dashboard-strings.js';
import { diagramStrings, type DiagramStrings } from './diagram-strings.js';
import { diffStrings, type DiffStrings } from './diff-strings.js';
import { editingStrings, type EditingStrings } from './editing-strings.js';
import { fieldStrings, type FieldStrings } from './field-strings.js';
import { historyStrings, type HistoryStrings } from './history-strings.js';
import { mediaStrings, type MediaStrings } from './media-strings.js';
import { pickerStrings, type PickerStrings } from './picker-strings.js';
import { planningStrings, type PlanningStrings } from './planning-strings.js';
import { presentationStrings, type PresentationStrings } from './presentation-strings.js';
import { queryStrings, type QueryStrings } from './query-strings.js';
import { redlineStrings, type RedlineStrings } from './redline-strings.js';
import { relationStrings, type RelationStrings } from './relation-strings.js';
import { reviewStrings, type ReviewStrings } from './review-strings.js';
import { structureStrings, type StructureStrings } from './structure-strings.js';
import { tableStrings, type TableStrings } from './table-strings.js';
import { timelineStrings, type TimelineStrings } from './timeline-strings.js';
import { viewStrings, type ViewStrings } from './view-strings.js';

/**
 * Built-in text every component draws from. Hosts override any entry through `UiProvider`. The
 * entries live in several modules so each stays readable.
 */
export interface UiStrings
  extends
    AnalysisStrings,
    CommonStrings,
    ContentStrings,
    DashboardStrings,
    DiagramStrings,
    DiffStrings,
    EditingStrings,
    FieldStrings,
    HistoryStrings,
    MediaStrings,
    PickerStrings,
    PlanningStrings,
    PresentationStrings,
    QueryStrings,
    RedlineStrings,
    RelationStrings,
    ReviewStrings,
    StructureStrings,
    TableStrings,
    TimelineStrings,
    ViewStrings {}

export const defaultStrings: UiStrings = {
  ...analysisStrings,
  ...commonStrings,
  ...contentStrings,
  ...dashboardStrings,
  ...diagramStrings,
  ...diffStrings,
  ...editingStrings,
  ...fieldStrings,
  ...historyStrings,
  ...mediaStrings,
  ...pickerStrings,
  ...planningStrings,
  ...presentationStrings,
  ...queryStrings,
  ...redlineStrings,
  ...relationStrings,
  ...reviewStrings,
  ...structureStrings,
  ...tableStrings,
  ...timelineStrings,
  ...viewStrings,
};
