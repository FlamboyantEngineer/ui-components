import { type AnalysisStrings } from './analysis-strings.js';
import { type ChatStrings } from './chat-strings.js';
import { type ChatActionsStrings } from './chat-actions-strings.js';
import { type ChatActivityStrings } from './chat-activity-strings.js';
import { type ChatAttachmentStrings } from './chat-attachment-strings.js';
import { type ChatControllerStrings } from './chat-controller-strings.js';
import { type ChatListStrings } from './chat-list-strings.js';
import { type ChatMessageStrings } from './chat-message-strings.js';
import { type ChatModelPickerStrings } from './chat-model-picker-strings.js';
import { type ChatQuestionStrings } from './chat-question-strings.js';
import { type ChatSourcesStrings } from './chat-sources-strings.js';
import { type ChatToolStrings } from './chat-tool-strings.js';
import { type ChatWidgetStrings } from './chat-widget-strings.js';
import { type CodeStrings } from './code-strings.js';
import { type CommonStrings } from './common-strings.js';
import { type ComposerStrings } from './composer-strings.js';
import { type ContentStrings } from './content-strings.js';
import { type DashboardStrings } from './dashboard-strings.js';
import { type DiagramStrings } from './diagram-strings.js';
import { type DiffStrings } from './diff-strings.js';
import { type EditingStrings } from './editing-strings.js';
import { type FieldStrings } from './field-strings.js';
import { type HistoryStrings } from './history-strings.js';
import { type MediaStrings } from './media-strings.js';
import { type PickerStrings } from './picker-strings.js';
import { type PlanningStrings } from './planning-strings.js';
import { type PresentationStrings } from './presentation-strings.js';
import { type QueryStrings } from './query-strings.js';
import { type RedlineStrings } from './redline-strings.js';
import { type RelationStrings } from './relation-strings.js';
import { type ReviewStrings } from './review-strings.js';
import { type RichTextStrings } from './rich-text-strings.js';
import { type StructureStrings } from './structure-strings.js';
import { type TableStrings } from './table-strings.js';
import { type TimelineStrings } from './timeline-strings.js';
import { type ViewStrings } from './view-strings.js';
/**
 * Built-in text every component draws from. Hosts override any entry through `UiProvider`. The
 * entries live in several modules so each stays readable.
 */
export interface UiStrings extends AnalysisStrings, ChatStrings, ChatActionsStrings, ChatActivityStrings, ChatAttachmentStrings, ChatControllerStrings, ChatListStrings, ChatMessageStrings, ChatModelPickerStrings, ChatQuestionStrings, ChatSourcesStrings, ChatToolStrings, ChatWidgetStrings, CodeStrings, CommonStrings, ComposerStrings, ContentStrings, DashboardStrings, DiagramStrings, DiffStrings, EditingStrings, FieldStrings, HistoryStrings, MediaStrings, PickerStrings, PlanningStrings, PresentationStrings, QueryStrings, RedlineStrings, RelationStrings, ReviewStrings, RichTextStrings, StructureStrings, TableStrings, TimelineStrings, ViewStrings {
}
export declare const defaultStrings: UiStrings;
//# sourceMappingURL=strings.d.ts.map