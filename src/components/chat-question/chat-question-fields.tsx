'use client';

import { useId, type KeyboardEvent } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { Choice } from '../choice-group/choice-group.js';
import { TextField } from '../text-field/text-field.js';
import {
  chatQuestionHooks as hooks,
  type ChatQuestionOption,
  type QuestionDraft,
} from './chat-question-model.js';

interface QuestionTextFieldProps {
  /** The slot the field fills: the free-text answer or the words for Other. */
  slot: 'text' | 'other';
  /** Names the field. */
  label: string;
  draft: QuestionDraft;
  onDraftChange: (draft: QuestionDraft) => void;
  /** Shows the words without letting the reader change them, and asks for none. */
  isReadOnly: boolean;
  /** Shows the field's validation now rather than once focus leaves it. */
  isRevealed: boolean;
  /** Called on Enter, to go on to the next question or submit. */
  onEnter: () => void;
  autoFocus?: boolean | undefined;
}

interface ChoiceOptionProps {
  option: ChatQuestionOption;
  /** `single` draws a radio, `multiple` a checkbox. */
  selectionMode: 'single' | 'multiple';
  isSelected: boolean;
  /** The option is the "Other" choice. */
  isOther?: boolean | undefined;
}

/** Enter without a modifier, outside an input method's composition. */
function isPlainEnter(event: KeyboardEvent) {
  const hasModifier = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
  return event.key === 'Enter' && !hasModifier && !event.nativeEvent.isComposing;
}

/**
 * A required single-line field for the reader's own words. Its committed value follows its value,
 * so it is never dirty: no restore button, and Escape stays with the conversation around it.
 */
export function QuestionTextField({
  slot,
  label,
  draft,
  onDraftChange,
  isReadOnly,
  isRevealed,
  onEnter,
  autoFocus,
}: QuestionTextFieldProps) {
  const strings = useUiStrings();
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
        if (!isPlainEnter(event)) return;
        event.preventDefault();
        onEnter();
      }}
    />
  );
}

/**
 * One option: its radio or checkbox, named by the label and the "Recommended" badge, and described
 * by the option's description.
 */
export function ChoiceOption({ option, selectionMode, isSelected, isOther }: ChoiceOptionProps) {
  const strings = useUiStrings();
  const descriptionId = useId();
  const describedBy = option.description ? descriptionId : undefined;
  const label = (
    <>
      {option.label}
      {option.isRecommended ? (
        <>
          {' '}
          <Badge size="sm" tone="info" className={hooks.slotClass('recommended')}>
            {strings.questionRecommended}
          </Badge>
        </>
      ) : null}
    </>
  );
  return (
    <div
      {...hooks.slot('option', {
        selected: isSelected,
        recommended: option.isRecommended,
        other: isOther,
      })}
    >
      {selectionMode === 'single' ? (
        <Choice value={option.id} aria-describedby={describedBy}>
          {label}
        </Choice>
      ) : (
        <Checkbox value={option.id} aria-describedby={describedBy}>
          {label}
        </Checkbox>
      )}
      {option.description ? (
        <span {...hooks.slot('description')} id={descriptionId}>
          {option.description}
        </span>
      ) : null}
    </div>
  );
}
