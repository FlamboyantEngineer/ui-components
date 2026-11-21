'use client';

import { type KeyboardEvent, useMemo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { Badge } from '../badge/badge.js';
import { QuestionnaireChoice, useQuestionnaireItem } from '../questionnaire/questionnaire.js';
import { TextField } from '../text-field/text-field.js';
import {
  chatQuestionHooks as hooks,
  type ChatQuestionOption,
  type QuestionDraft,
} from './chat-question-model.js';
import { renderOptionDescription } from './chat-question-text.js';

interface QuestionTextFieldProps {
  /** The slot the field fills: the free-text answer or the words for Other. */
  slot: 'text' | 'other';
  /** Names the field. */
  label: string;
  draft: QuestionDraft;
  onDraftChange: (draft: QuestionDraft) => void;
  /** Shows the field's validation now rather than once focus leaves it. */
  isRevealed: boolean;
  autoFocus?: boolean | undefined;
}

interface ChoiceOptionProps {
  option: ChatQuestionOption;
  isSelected: boolean;
  /** The option is the "Other" choice. */
  isOther?: boolean | undefined;
}

/** Enter outside an input method's composition: `plain` without a modifier, else `modified`. */
function readEnter(event: KeyboardEvent): 'plain' | 'modified' | null {
  if (event.key !== 'Enter' || isComposingKey(event.nativeEvent)) return null;
  const hasModifier = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
  return hasModifier ? 'modified' : 'plain';
}

/**
 * A required single-line field for the reader's own words, read-only with its questionnaire. Its
 * committed value follows its value, so it is never dirty: no restore button, and Escape stays with
 * the conversation around it. Enter goes on to the next question, or submits from the last, while
 * the reader can answer.
 */
export function QuestionTextField({
  slot,
  label,
  draft,
  onDraftChange,
  isRevealed,
  autoFocus,
}: QuestionTextFieldProps) {
  const strings = useUiStrings();
  const { questionnaire } = useQuestionnaireItem('QuestionTextField');
  const { isReadOnly } = questionnaire;
  return (
    <TextField
      className={hooks.slotClass(slot)}
      label={label}
      labelLayout="control-only"
      placeholder={strings.questionAnswerPlaceholder}
      value={draft.otherText}
      tracksChanges={false}
      onChange={(otherText) => onDraftChange({ ...draft, otherText })}
      isReadOnly={isReadOnly}
      isRequired={!isReadOnly}
      validationMode={isRevealed ? 'immediate' : 'blur'}
      autoFocus={autoFocus}
      onKeyDown={(event) => {
        const enter = readEnter(event);
        if (enter === null) return;
        // No Enter submits the form natively: only a plain one goes on, through the questionnaire.
        event.preventDefault();
        if (enter === 'plain' && !isReadOnly) questionnaire.advance();
      }}
    />
  );
}

/**
 * One option, a `QuestionnaireChoice`: its radio or checkbox, named by the label and the
 * "Recommended" badge, and described by the option's description, drawn as Markdown.
 */
export function ChoiceOption({ option, isSelected, isOther }: ChoiceOptionProps) {
  const strings = useUiStrings();
  const description = useMemo(
    () => (option.description ? renderOptionDescription(option.description) : null),
    [option.description],
  );
  return (
    <QuestionnaireChoice
      {...hooks.slot('option', {
        selected: isSelected,
        recommended: option.isRecommended,
        other: isOther,
      })}
      value={option.id}
      description={
        description ? (
          <span className={hooks.slotClass('description')}>{description}</span>
        ) : undefined
      }
    >
      {option.label}
      {option.isRecommended ? (
        <>
          {' '}
          <Badge size="sm" tone="info" className={hooks.slotClass('recommended')}>
            {strings.questionRecommended}
          </Badge>
        </>
      ) : null}
    </QuestionnaireChoice>
  );
}
