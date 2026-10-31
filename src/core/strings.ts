import { en } from './locales/index.js';
import { DEFAULT_LOCALE, formatMessage, type MessageValues } from './message-format.js';
import { analysisArguments, type AnalysisStrings } from './analysis-strings.js';
import { chatArguments, type ChatStrings } from './chat-strings.js';
import { chatActionsArguments, type ChatActionsStrings } from './chat-actions-strings.js';
import { chatActivityArguments, type ChatActivityStrings } from './chat-activity-strings.js';
import { chatAttachmentArguments, type ChatAttachmentStrings } from './chat-attachment-strings.js';
import type { ChatControllerStrings } from './chat-controller-strings.js';
import { chatListArguments, type ChatListStrings } from './chat-list-strings.js';
import { chatMessageArguments, type ChatMessageStrings } from './chat-message-strings.js';
import {
  chatModelPickerArguments,
  type ChatModelPickerStrings,
} from './chat-model-picker-strings.js';
import { chatQuestionArguments, type ChatQuestionStrings } from './chat-question-strings.js';
import { chatSourcesArguments, type ChatSourcesStrings } from './chat-sources-strings.js';
import { chatToolArguments, type ChatToolStrings } from './chat-tool-strings.js';
import { chatWidgetArguments, type ChatWidgetStrings } from './chat-widget-strings.js';
import { codeArguments, type CodeStrings } from './code-strings.js';
import { commonArguments, type CommonStrings } from './common-strings.js';
import { composerArguments, type ComposerStrings } from './composer-strings.js';
import { contentArguments, type ContentStrings } from './content-strings.js';
import { dashboardArguments, type DashboardStrings } from './dashboard-strings.js';
import { diagramArguments, type DiagramStrings } from './diagram-strings.js';
import { diffArguments, type DiffStrings } from './diff-strings.js';
import { editingArguments, type EditingStrings } from './editing-strings.js';
import { fieldArguments, type FieldStrings } from './field-strings.js';
import { historyArguments, type HistoryStrings } from './history-strings.js';
import { mediaArguments, type MediaStrings } from './media-strings.js';
import { pickerArguments, type PickerStrings } from './picker-strings.js';
import { planningArguments, type PlanningStrings } from './planning-strings.js';
import { presentationArguments, type PresentationStrings } from './presentation-strings.js';
import { queryArguments, type QueryStrings } from './query-strings.js';
import { redlineArguments, type RedlineStrings } from './redline-strings.js';
import { relationArguments, type RelationStrings } from './relation-strings.js';
import { reviewArguments, type ReviewStrings } from './review-strings.js';
import { richTextArguments, type RichTextStrings } from './rich-text-strings.js';
import { structureArguments, type StructureStrings } from './structure-strings.js';
import { tableArguments, type TableStrings } from './table-strings.js';
import { timelineArguments, type TimelineStrings } from './timeline-strings.js';
import { viewArguments, type ViewStrings } from './view-strings.js';

/**
 * Built-in text every component draws from, compiled from a language file for one locale. Text
 * without arguments is a string; text with arguments is a function of them. The entries live in
 * several modules so each stays readable.
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
    ChatModelPickerStrings,
    ChatQuestionStrings,
    ChatSourcesStrings,
    ChatToolStrings,
    ChatWidgetStrings,
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

/**
 * A language file: every built-in text as an ICU MessageFormat message, keyed like `UiStrings`. Text
 * without arguments is used as written.
 */
export type UiMessages = Record<keyof UiStrings, string>;

type ToMessageValues = (...args: never[]) => MessageValues;

const messageArguments: Readonly<Record<string, ToMessageValues>> = {
  ...analysisArguments,
  ...chatArguments,
  ...chatActionsArguments,
  ...chatActivityArguments,
  ...chatAttachmentArguments,
  ...chatListArguments,
  ...chatMessageArguments,
  ...chatModelPickerArguments,
  ...chatQuestionArguments,
  ...chatSourcesArguments,
  ...chatToolArguments,
  ...chatWidgetArguments,
  ...codeArguments,
  ...commonArguments,
  ...composerArguments,
  ...contentArguments,
  ...dashboardArguments,
  ...diagramArguments,
  ...diffArguments,
  ...editingArguments,
  ...fieldArguments,
  ...historyArguments,
  ...mediaArguments,
  ...pickerArguments,
  ...planningArguments,
  ...presentationArguments,
  ...queryArguments,
  ...redlineArguments,
  ...relationArguments,
  ...reviewArguments,
  ...richTextArguments,
  ...structureArguments,
  ...tableArguments,
  ...timelineArguments,
  ...viewArguments,
};

/** Compiles a language file into the text components draw for `locale`. */
export function compileStrings(messages: UiMessages, locale: string): UiStrings {
  const strings: Record<string, unknown> = { ...messages };
  for (const [key, toValues] of Object.entries(messageArguments)) {
    const message = messages[key as keyof UiMessages];
    strings[key] = (...args: never[]) => formatMessage(message, toValues(...args), locale);
  }
  return strings as unknown as UiStrings;
}

let defaultStrings: UiStrings | undefined;

/**
 * The built-in English text, compiled on first use rather than when the library loads, so
 * importing a component does no string work until one renders outside every provider.
 */
export function getDefaultStrings(): UiStrings {
  defaultStrings ??= compileStrings(en, DEFAULT_LOCALE);
  return defaultStrings;
}
