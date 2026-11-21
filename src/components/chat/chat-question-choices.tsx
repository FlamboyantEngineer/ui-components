'use client';

import { type FocusEvent, useId, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { Markdown } from '../markdown/markdown.js';
import { QuestionnaireChoices } from '../questionnaire/questionnaire.js';
import { ChoiceOption, QuestionTextField } from './chat-question-fields.js';
import {
  chatQuestionHooks as hooks,
  type ChatQuestionItem,
  findPreviewOption,
  pickMultiple,
  pickSingle,
  type QuestionDraft,
} from './chat-question-model.js';

interface QuestionChoicesProps {
  /** A question asked with options: `single` or `multiple`. */
  item: ChatQuestionItem;
  draft: QuestionDraft;
  onDraftChange: (draft: QuestionDraft) => void;
  /** Shows the Other field's validation now. */
  isRevealed: boolean;
}

interface ChoiceGroupProps {
  item: ChatQuestionItem;
  draft: QuestionDraft;
  /** The value that stands for Other. */
  otherValue: string;
  onPick: (draft: QuestionDraft) => void;
}

/** The option a focused radio or checkbox input stands for, by its value. */
function readFocusedValue(target: EventTarget): string | null {
  const isChoice =
    isHTMLElement(target, 'input') && (target.type === 'radio' || target.type === 'checkbox');
  return isChoice ? target.value : null;
}

/**
 * The question's options, then Other when it allows one, as `QuestionnaireChoices`: a radio group
 * (one option) or a checkbox group (any options), named by the question.
 */
function ChoiceGroup({ item, draft, otherValue, onPick }: ChoiceGroupProps) {
  const strings = useUiStrings();
  const isMultiple = item.selectionMode === 'multiple';
  return (
    <QuestionnaireChoices
      className={hooks.slotClass('options')}
      selectionMode={isMultiple ? 'multiple' : 'single'}
      value={draft.isOther ? [...draft.optionIds, otherValue] : draft.optionIds}
      onChange={(values) => {
        if (isMultiple) onPick(pickMultiple(draft, values, otherValue));
        else if (values[0] !== undefined) onPick(pickSingle(draft, values[0], otherValue));
      }}
    >
      {item.options.map((option) => (
        <ChoiceOption
          key={option.id}
          option={option}
          isSelected={draft.optionIds.includes(option.id)}
        />
      ))}
      {item.allowsOther ? (
        <ChoiceOption
          option={{ id: otherValue, label: strings.questionOther }}
          isSelected={draft.isOther}
          isOther
        />
      ) : null}
    </QuestionnaireChoices>
  );
}

/** The preview of the focused or chosen option, as Markdown, in a group named after the option. */
function ChoicePreview({ label, source }: { label: string; source: string }) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('preview')} role="group" aria-label={strings.questionPreview(label)}>
      <Markdown source={source} />
    </div>
  );
}

/**
 * The answer area of a question with options: the group, the Other field once Other is chosen,
 * and the preview of the focused or chosen option. Choosing Other focuses its field, except when
 * an arrow key chose it while moving through the radios, so the arrow keys keep moving.
 */
export function QuestionChoices({ item, draft, onDraftChange, isRevealed }: QuestionChoicesProps) {
  const strings = useUiStrings();
  const otherValue = `${useId()}-other`;
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusesOther, setFocusesOther] = useState(false);
  const isArrowKey = useRef(false);
  const preview = findPreviewOption(item, { draft, focusedId });
  const pick = (next: QuestionDraft) => {
    if (next.isOther && !draft.isOther) setFocusesOther(!isArrowKey.current);
    onDraftChange(next);
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocusedId(null);
  };
  return (
    <div
      {...hooks.slot('answer', { hasPreview: item.options.some((option) => option.preview) })}
      onKeyDownCapture={(event) => {
        isArrowKey.current = event.key.startsWith('Arrow');
      }}
      onPointerDownCapture={() => {
        isArrowKey.current = false;
      }}
      onFocus={(event) => setFocusedId(readFocusedValue(event.target))}
      onBlur={onBlur}
    >
      <ChoiceGroup item={item} draft={draft} otherValue={otherValue} onPick={pick} />
      {draft.isOther ? (
        <QuestionTextField
          slot="other"
          label={strings.questionOtherAnswer}
          draft={draft}
          onDraftChange={onDraftChange}
          isRevealed={isRevealed}
          autoFocus={focusesOther}
        />
      ) : null}
      {preview?.preview ? <ChoicePreview label={preview.label} source={preview.preview} /> : null}
    </div>
  );
}
