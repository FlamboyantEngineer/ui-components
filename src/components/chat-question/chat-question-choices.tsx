'use client';

import { useId, useRef, useState, type FocusEvent } from 'react';
import {
  CheckboxGroup as AriaCheckboxGroup,
  RadioGroup as AriaRadioGroup,
} from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Markdown } from '../markdown/markdown.js';
import { ChoiceOption, QuestionTextField } from './chat-question-fields.js';
import {
  chatQuestionHooks as hooks,
  findPreviewOption,
  pickMultiple,
  pickSingle,
  type ChatQuestionItem,
  type QuestionDraft,
} from './chat-question-model.js';

interface QuestionChoicesProps {
  /** A question asked with options: `single` or `multiple`. */
  item: ChatQuestionItem;
  draft: QuestionDraft;
  onDraftChange: (draft: QuestionDraft) => void;
  /** Shows the choices and the Other field without letting the reader change them. */
  isReadOnly: boolean;
  /** The id of the question's text, which names the group. */
  labelId: string;
  /** Shows the Other field's validation now. */
  isRevealed: boolean;
  /** Called on Enter in the Other field. */
  onEnter: () => void;
}

interface ChoiceGroupProps {
  item: ChatQuestionItem;
  draft: QuestionDraft;
  isReadOnly: boolean;
  labelId: string;
  /** The value that stands for Other. */
  otherValue: string;
  onPick: (draft: QuestionDraft) => void;
}

/** The option a focused radio or checkbox input stands for, by its value. */
function readFocusedValue(target: EventTarget): string | null {
  const isChoice =
    target instanceof HTMLInputElement && (target.type === 'radio' || target.type === 'checkbox');
  return isChoice ? target.value : null;
}

/** The question's options, then Other when it allows one, each as a radio or a checkbox. */
function ChoiceOptions({
  item,
  draft,
  otherValue,
}: Pick<ChoiceGroupProps, 'item' | 'draft' | 'otherValue'>) {
  const strings = useUiStrings();
  const mode = item.selectionMode === 'multiple' ? 'multiple' : 'single';
  return (
    <>
      {item.options.map((option) => (
        <ChoiceOption
          key={option.id}
          option={option}
          selectionMode={mode}
          isSelected={draft.optionIds.includes(option.id)}
        />
      ))}
      {item.allowsOther ? (
        <ChoiceOption
          option={{ id: otherValue, label: strings.questionOther }}
          selectionMode={mode}
          isSelected={draft.isOther}
          isOther
        />
      ) : null}
    </>
  );
}

/** A radio group (one option) or a checkbox group (any options), named by the question. */
function ChoiceGroup(props: ChoiceGroupProps) {
  const { item, draft, isReadOnly, labelId, otherValue, onPick } = props;
  const options = <ChoiceOptions item={item} draft={draft} otherValue={otherValue} />;
  if (item.selectionMode === 'multiple') {
    return (
      <AriaCheckboxGroup
        {...hooks.slot('options')}
        aria-labelledby={labelId}
        isReadOnly={isReadOnly}
        value={draft.isOther ? [...draft.optionIds, otherValue] : [...draft.optionIds]}
        onChange={(values) => onPick(pickMultiple(draft, values, otherValue))}
      >
        {options}
      </AriaCheckboxGroup>
    );
  }
  return (
    <AriaRadioGroup
      {...hooks.slot('options')}
      aria-labelledby={labelId}
      isReadOnly={isReadOnly}
      value={draft.isOther ? otherValue : (draft.optionIds[0] ?? null)}
      onChange={(value) => onPick(pickSingle(draft, value, otherValue))}
    >
      {options}
    </AriaRadioGroup>
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
export function QuestionChoices({
  item,
  draft,
  onDraftChange,
  isReadOnly,
  labelId,
  isRevealed,
  onEnter,
}: QuestionChoicesProps) {
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
      <ChoiceGroup
        item={item}
        draft={draft}
        isReadOnly={isReadOnly}
        labelId={labelId}
        otherValue={otherValue}
        onPick={pick}
      />
      {draft.isOther ? (
        <QuestionTextField
          slot="other"
          label={strings.questionOtherAnswer}
          draft={draft}
          onDraftChange={onDraftChange}
          isReadOnly={isReadOnly}
          isRevealed={isRevealed}
          onEnter={onEnter}
          autoFocus={focusesOther}
        />
      ) : null}
      {preview?.preview ? <ChoicePreview label={preview.label} source={preview.preview} /> : null}
    </div>
  );
}
