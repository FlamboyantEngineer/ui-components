// The data of an agent's questions, the reader's drafts of their answers and the answers they send.
import { createHooks } from '../../core/hooks.js';
export const emptyDraft = { optionIds: [], isOther: false, otherText: '' };
export const chatQuestionHooks = createHooks('chat-question', [
    'tabs',
    'tab',
    'progress',
    'panel',
    'item',
    'question',
    'answer',
    'options',
    'option',
    'recommended',
    'description',
    'other',
    'text',
    'preview',
    'error',
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
function hasText(text) {
    return Boolean(text?.trim());
}
/**
 * Whether a question has an answer: words for a free-text question; otherwise an option or Other,
 * and words whenever Other is chosen.
 */
export function isQuestionAnswered(item, draft = emptyDraft) {
    if (item.selectionMode === 'none')
        return hasText(draft.otherText);
    if (draft.isOther)
        return hasText(draft.otherText);
    return draft.optionIds.length > 0;
}
/** The answer a draft gives: the options chosen in offered order, and trimmed words when given. */
export function toAnswer(item, draft = emptyDraft) {
    const isText = item.selectionMode === 'none';
    const optionIds = isText
        ? []
        : item.options.filter((option) => draft.optionIds.includes(option.id)).map(({ id }) => id);
    const answer = { questionId: item.id, optionIds };
    if (isText || draft.isOther)
        answer.otherText = draft.otherText.trim();
    return answer;
}
/** The draft after a pick in a group of radios, where `otherValue` stands for Other. */
export function pickSingle(draft, value, otherValue) {
    return value === otherValue
        ? { ...draft, optionIds: [], isOther: true }
        : { ...draft, optionIds: [value], isOther: false };
}
/** The draft after a toggle in a group of checkboxes, where `otherValue` stands for Other. */
export function pickMultiple(draft, values, otherValue) {
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
export function findPreviewOption(item, { draft, focusedId }) {
    const shown = focusedId === null
        ? item.options.find((option) => option.preview && draft.optionIds.includes(option.id))
        : item.options.find((option) => option.id === focusedId);
    return hasText(shown?.preview) ? shown : undefined;
}
/** The labels a summary lists: the options chosen in offered order, then the words for Other. */
export function listAnswerLabels(item, answer) {
    const labels = item.options
        .filter((option) => answer.optionIds.includes(option.id))
        .map(({ label }) => label);
    const text = readAnswerText(answer);
    return text ? [...labels, text] : labels;
}
/** The reader's own words in an answer, trimmed, when they gave any. */
export function readAnswerText(answer) {
    return answer?.otherText?.trim() || undefined;
}
//# sourceMappingURL=chat-question-model.js.map