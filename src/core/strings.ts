import { analysisStrings, type AnalysisStrings } from './analysis-strings.js';
import { chatStrings, type ChatStrings } from './chat-strings.js';
import { chatActionsStrings, type ChatActionsStrings } from './chat-actions-strings.js';
import { chatActivityStrings, type ChatActivityStrings } from './chat-activity-strings.js';
import { chatAttachmentStrings, type ChatAttachmentStrings } from './chat-attachment-strings.js';
import { chatControllerStrings, type ChatControllerStrings } from './chat-controller-strings.js';
import { chatListStrings, type ChatListStrings } from './chat-list-strings.js';
import { chatMessageStrings, type ChatMessageStrings } from './chat-message-strings.js';
import { chatQuestionStrings, type ChatQuestionStrings } from './chat-question-strings.js';
import { chatSourcesStrings, type ChatSourcesStrings } from './chat-sources-strings.js';
import { chatToolStrings, type ChatToolStrings } from './chat-tool-strings.js';
import { codeStrings, type CodeStrings } from './code-strings.js';
import { commonStrings, type CommonStrings } from './common-strings.js';
import { composerStrings, type ComposerStrings } from './composer-strings.js';
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
import { richTextStrings, type RichTextStrings } from './rich-text-strings.js';
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
    ChatStrings,
    ChatActionsStrings,
    ChatActivityStrings,
    ChatAttachmentStrings,
    ChatControllerStrings,
    ChatListStrings,
    ChatMessageStrings,
    ChatQuestionStrings,
    ChatSourcesStrings,
    ChatToolStrings,
    CodeStrings,
    CommonStrings,
    ComposerStrings,
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
    RichTextStrings,
    StructureStrings,
    TableStrings,
    TimelineStrings,
    ViewStrings {}

export const defaultStrings: UiStrings = {
  ...analysisStrings,
  ...chatStrings,
  ...chatActionsStrings,
  ...chatActivityStrings,
  ...chatAttachmentStrings,
  ...chatControllerStrings,
  ...chatListStrings,
  ...chatMessageStrings,
  ...chatQuestionStrings,
  ...chatSourcesStrings,
  ...chatToolStrings,
  ...codeStrings,
  ...commonStrings,
  ...composerStrings,
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
  ...richTextStrings,
  ...structureStrings,
  ...tableStrings,
  ...timelineStrings,
  ...viewStrings,
};
