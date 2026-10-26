import { useId, type Ref } from 'react';
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
  /** Shows the answer without letting the reader change it. */
  isReadOnly: boolean;
  /** Shows the validation of the question's fields now. */
  isRevealed: boolean;
  /** Called on Enter in an answer field. */
  onEnter: () => void;
  /** Draws the header chip; a stepped card lists the headers as its steps instead. */
  showsHeader: boolean;
  /** The question's element, where focus lands when the reader steps to it. */
  ref?: Ref<HTMLDivElement> | undefined;
}

/**
 * One question: its header chip, its text, and its answer: options as radios or checkboxes, or a
 * field for the reader's own words.
 */
export function QuestionItem({
  item,
  draft,
  onDraftChange,
  isReadOnly,
  isRevealed,
  onEnter,
  showsHeader,
  ref,
}: QuestionItemProps) {
  const questionId = useId();
  return (
    <div {...hooks.slot('item', { selectionMode: item.selectionMode })} ref={ref}>
      {showsHeader && item.header ? <span {...hooks.slot('header')}>{item.header}</span> : null}
      <p {...hooks.slot('question')} id={questionId}>
        {item.question}
      </p>
      {item.selectionMode === 'none' ? (
        <QuestionTextField
          slot="text"
          label={item.question}
          draft={draft}
          onDraftChange={onDraftChange}
          isReadOnly={isReadOnly}
          isRevealed={isRevealed}
          onEnter={onEnter}
        />
      ) : (
        <QuestionChoices
          item={item}
          draft={draft}
          onDraftChange={onDraftChange}
          isReadOnly={isReadOnly}
          labelId={questionId}
          isRevealed={isRevealed}
          onEnter={onEnter}
        />
      )}
    </div>
  );
}
