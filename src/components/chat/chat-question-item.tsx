'use client';

import { useMemo } from 'react';
import { Markdown } from '../markdown/markdown.js';
import {
  QuestionnaireDescription,
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
import { readQuestionText } from './chat-question-text.js';

interface QuestionItemProps {
  item: ChatQuestionItem;
  draft: QuestionDraft;
  onDraftChange: (draft: QuestionDraft) => void;
  /** The reader must answer it before Next and Submit. */
  isRequired: boolean;
}

/** The answer of a question, named by the question's words: options as radios or checkboxes, or a field for the reader's words. */
function QuestionAnswer({
  item,
  label,
  draft,
  onDraftChange,
}: Omit<QuestionItemProps, 'isRequired'> & { label: string }) {
  // Next or Enter on a question left unanswered marks it invalid, which shows its field's validation.
  const { isInvalid } = useQuestionnaireItem('QuestionAnswer').item;
  return item.selectionMode === 'none' ? (
    <QuestionTextField
      slot="text"
      label={label}
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
 * One question, a `QuestionnaireItem` named by its id: its text as Markdown, the title as the
 * item's title and the blocks after it as its description, then its answer. Its header labels its
 * tab.
 */
export function QuestionItem({ item, draft, onDraftChange, isRequired }: QuestionItemProps) {
  const text = useMemo(() => readQuestionText(item.question), [item.question]);
  return (
    <QuestionnaireItem
      {...hooks.slot('item', { selectionMode: item.selectionMode })}
      name={item.id}
      isRequired={isRequired}
    >
      <QuestionnaireTitle className={hooks.slotClass('question')}>{text.title}</QuestionnaireTitle>
      {text.body ? (
        <QuestionnaireDescription className={hooks.slotClass('body')}>
          <Markdown source={text.body} />
        </QuestionnaireDescription>
      ) : null}
      <QuestionAnswer item={item} label={text.words} draft={draft} onDraftChange={onDraftChange} />
    </QuestionnaireItem>
  );
}
