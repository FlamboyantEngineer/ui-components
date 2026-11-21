'use client';

import {
  QuestionnaireItem,
  QuestionnaireTitle,
  useQuestionnaireItem,
} from '../questionnaire/questionnaire.js';
import { QuestionChoices } from './chat-question-choices.js';
import { QuestionTextField } from './chat-question-fields.js';
import {
  chatQuestionHooks as hooks,
  type ChatQuestionItem,
  type QuestionDraft,
} from './chat-question-model.js';

interface QuestionItemProps {
  item: ChatQuestionItem;
  draft: QuestionDraft;
  onDraftChange: (draft: QuestionDraft) => void;
  /** The reader must answer it before Next and Submit. */
  isRequired: boolean;
}

/** The answer of a question: options as radios or checkboxes, or a field for the reader's words. */
function QuestionAnswer({ item, draft, onDraftChange }: Omit<QuestionItemProps, 'isRequired'>) {
  // Next or Enter on a question left unanswered marks it invalid, which shows its field's validation.
  const { isInvalid } = useQuestionnaireItem('QuestionAnswer').item;
  return item.selectionMode === 'none' ? (
    <QuestionTextField
      slot="text"
      label={item.question}
      draft={draft}
      onDraftChange={onDraftChange}
      isRevealed={isInvalid}
    />
  ) : (
    <QuestionChoices
      item={item}
      draft={draft}
      onDraftChange={onDraftChange}
      isRevealed={isInvalid}
    />
  );
}

/**
 * One question, a `QuestionnaireItem` named by its id: its text as the item's title, and its
 * answer. Its header labels its tab.
 */
export function QuestionItem({ item, draft, onDraftChange, isRequired }: QuestionItemProps) {
  return (
    <QuestionnaireItem
      {...hooks.slot('item', { selectionMode: item.selectionMode })}
      name={item.id}
      isRequired={isRequired}
    >
      <QuestionnaireTitle className={hooks.slotClass('question')}>
        {item.question}
      </QuestionnaireTitle>
      <QuestionAnswer item={item} draft={draft} onDraftChange={onDraftChange} />
    </QuestionnaireItem>
  );
}
