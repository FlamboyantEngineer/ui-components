// The data of an agent's questions, the reader's drafts of their answers and the answers they send.

import { createHooks } from '../../core/hooks.js';

/** `single`: one option (radios); `multiple`: any options (checkboxes); `none`: free text only. */
export type ChatQuestionSelectionMode = 'single' | 'multiple' | 'none';

/** `pending` asks; `answered` and `dismissed` collapse to a summary. */
export type ChatQuestionStatus = 'pending' | 'answered' | 'dismissed';

/** One answer the agent offers. */
export interface ChatQuestionOption {
  /** Identifies the option in the answers. */
  id: string;
  /** The option's name: it names its radio or checkbox. */
  label: string;
  /** A line under the label that describes the option. */
  description?: string | undefined;
  /** Marks the option the agent recommends with a "Recommended" badge. */
  isRecommended?: boolean | undefined;
  /** Markdown shown beside the options while the option has focus or is chosen. */
  preview?: string | undefined;
}

/** One question of a card. */
export interface ChatQuestionItem {
  /** Identifies the question in the answers. */
  id: string;
  /** The question, as the agent asks it. */
  question: string;
  /** A short label for the question, drawn as a chip. */
  header?: string | undefined;
  /** How the reader answers: one option, several, or in their own words only. */
  selectionMode: ChatQuestionSelectionMode;
  /** The answers offered, in order. Ignored with `selectionMode: 'none'`. */
  options: readonly ChatQuestionOption[];
  /** Adds an "Other" option with a field for the reader's own words. */
  allowsOther?: boolean | undefined;
}

/** The reader's answer to one question. */
export interface ChatQuestionAnswer {
  questionId: string;
  /** The options chosen, in the order they are offered. */
  optionIds: string[];
  /** The reader's own words: the text given for Other, or a free-text answer. */
  otherText?: string;
}

/** A card of questions as a message part carries it. */
export interface ChatQuestionData {
  /** Identifies the card. */
  id: string;
  /** The questions, in order: several are asked one at a time. */
  questions: readonly ChatQuestionItem[];
  status: ChatQuestionStatus;
  /** The answers an `answered` card sums up. */
  answers?: readonly ChatQuestionAnswer[] | undefined;
}

/** What the reader has chosen and typed for one question so far. */
export interface QuestionDraft {
  optionIds: readonly string[];
  /** The reader chose Other. */
  isOther: boolean;
  /** The words for Other, or the free-text answer; kept while Other is not chosen. */
  otherText: string;
}

export const emptyDraft: QuestionDraft = { optionIds: [], isOther: false, otherText: '' };

export const chatQuestionHooks = createHooks('chat-question', [
  'steps',
  'step',
  'progress',
  'item',
  'header',
  'question',
  'answer',
  'options',
  'option',
  'recommended',
  'description',
  'other',
  'text',
  'preview',
  'actions',
  'back',
  'next',
  'submit',
  'dismiss',
  'announcement',
  'summary',
  'summary-item',
  'summary-question',
  'summary-answer',
  'status',
]);

function hasText(text: string | undefined): boolean {
  return Boolean(text?.trim());
}

/**
 * Whether a question has an answer: words for a free-text question; otherwise an option or Other,
 * and words whenever Other is chosen.
 */
export function isQuestionAnswered(item: ChatQuestionItem, draft: QuestionDraft = emptyDraft) {
  if (item.selectionMode === 'none') return hasText(draft.otherText);
  if (draft.isOther) return hasText(draft.otherText);
  return draft.optionIds.length > 0;
}

/** The answer a draft gives: the options chosen in offered order, and trimmed words when given. */
export function toAnswer(item: ChatQuestionItem, draft: QuestionDraft = emptyDraft) {
  const isText = item.selectionMode === 'none';
  const optionIds = isText
    ? []
    : item.options.filter((option) => draft.optionIds.includes(option.id)).map(({ id }) => id);
  const answer: ChatQuestionAnswer = { questionId: item.id, optionIds };
  if (isText || draft.isOther) answer.otherText = draft.otherText.trim();
  return answer;
}

/** The draft after a pick in a group of radios, where `otherValue` stands for Other. */
export function pickSingle(draft: QuestionDraft, value: string, otherValue: string) {
  return value === otherValue
    ? { ...draft, optionIds: [], isOther: true }
    : { ...draft, optionIds: [value], isOther: false };
}

/** The draft after a toggle in a group of checkboxes, where `otherValue` stands for Other. */
export function pickMultiple(draft: QuestionDraft, values: readonly string[], otherValue: string) {
  return {
    ...draft,
    optionIds: values.filter((value) => value !== otherValue),
    isOther: values.includes(otherValue),
  };
}

/**
 * The option whose preview shows: the focused option, or else the first chosen option with a
 * preview. A focused option without a preview shows none.
 */
export function findPreviewOption(
  item: ChatQuestionItem,
  { draft, focusedId }: { draft: QuestionDraft; focusedId: string | null },
): ChatQuestionOption | undefined {
  const shown =
    focusedId === null
      ? item.options.find((option) => option.preview && draft.optionIds.includes(option.id))
      : item.options.find((option) => option.id === focusedId);
  return hasText(shown?.preview) ? shown : undefined;
}

/** The labels a summary lists: the options chosen in offered order, then the words for Other. */
export function listAnswerLabels(item: ChatQuestionItem, answer: ChatQuestionAnswer): string[] {
  const labels = item.options
    .filter((option) => answer.optionIds.includes(option.id))
    .map(({ label }) => label);
  const text = readAnswerText(answer);
  return text ? [...labels, text] : labels;
}

/** The reader's own words in an answer, trimmed, when they gave any. */
export function readAnswerText(answer: ChatQuestionAnswer | undefined): string | undefined {
  return answer?.otherText?.trim() || undefined;
}
