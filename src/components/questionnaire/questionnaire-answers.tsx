'use client';

import { createContext, type KeyboardEvent, type ReactNode, useContext } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import {
  CheckboxGroup as AriaCheckboxGroup,
  Input as AriaInput,
  RadioGroup as AriaRadioGroup,
} from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import {
  Choice,
  ChoiceContext,
  type ChoiceGroupSelectionMode,
} from '../choice-group/choice-group.js';
import {
  QuestionnaireContext,
  questionnaireHooks as hooks,
  QuestionnaireItemContext,
  readQuestionnaire,
} from './questionnaire-hooks.js';

/** `single` answers with one radio, `multiple` with any checkboxes. */
export type QuestionnaireChoicesSelectionMode = ChoiceGroupSelectionMode;

/** The kinds of text a question's input takes, which set the input's `type`. */
export type QuestionnaireInputType = 'text' | 'email' | 'number' | 'tel' | 'url' | 'date' | 'time';

export interface QuestionnaireChoicesProps extends RefProps<HTMLDivElement>, BaseProps {
  /** Defaults to `single`. */
  selectionMode?: QuestionnaireChoicesSelectionMode | undefined;
  /** The chosen values (controlled); a single choice holds at most one. */
  value?: readonly string[] | undefined;
  /** The values chosen at first when uncontrolled. */
  defaultValue?: readonly string[] | undefined;
  /** Receives the chosen values after each pick. */
  onChange?: ((value: string[]) => void) | undefined;
  /** The `QuestionnaireChoice` options, in order. */
  children?: ReactNode;
}

export interface QuestionnaireChoiceProps extends RefProps<HTMLDivElement>, BaseProps {
  /** The value this option submits under its question's name. */
  value: string;
  /** Describes the option, below its label. */
  description?: ReactNode;
  isDisabled?: boolean | undefined;
  /** The option's label. */
  children?: ReactNode;
}

export interface QuestionnaireInputProps
  extends RefProps<HTMLInputElement>, BaseProps, AriaLabellingProps {
  /** Defaults to `text`. */
  type?: QuestionnaireInputType | undefined;
  placeholder?: string | undefined;
  /** The text (controlled). */
  value?: string | undefined;
  /** The text at first when uncontrolled. */
  defaultValue?: string | undefined;
  /** Receives the text after each edit. */
  onChange?: ((value: string) => void) | undefined;
}

const ChoicesContext = createContext<readonly string[]>([]);

/** Enter without a modifier, outside an input method's composition. */
function isPlainEnter(event: KeyboardEvent) {
  const hasModifier = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
  return event.key === 'Enter' && !hasModifier && !isComposingKey(event.nativeEvent);
}

/**
 * A question's options: a radio group (`single`) or a checkbox group (`multiple`) named by the
 * question's title, which submits under its name.
 */
export function QuestionnaireChoices({
  ref,
  selectionMode = 'single',
  value,
  defaultValue = [],
  onChange,
  className,
  children,
  ...rest
}: QuestionnaireChoicesProps) {
  const { noteChange, isReadOnly } = readQuestionnaire(
    useContext(QuestionnaireContext),
    'QuestionnaireChoices',
  );
  const item = readQuestionnaire(useContext(QuestionnaireItemContext), 'QuestionnaireChoices');
  const [chosen, setChosen] = useControllableState<readonly string[]>(value, defaultValue);
  const pick = (next: string[]) => {
    setChosen(next);
    onChange?.(next);
    noteChange();
  };
  const settings = {
    selectionMode,
    size: 'md',
    isReadOnly,
    isDisabled: item.isDisabled,
    isInvalid: item.isInvalid,
    isRequired: item.isRequired,
  } as const;
  const shared = {
    ...rest,
    ...hooks.slot('choices', { selectionMode }, className),
    ref,
    name: item.name,
    'aria-labelledby': item.titleId,
    isDisabled: item.isDisabled,
    isInvalid: item.isInvalid,
    isReadOnly,
  };
  return (
    <ChoiceContext value={settings}>
      <ChoicesContext value={chosen}>
        {selectionMode === 'multiple' ? (
          <AriaCheckboxGroup {...shared} value={[...chosen]} onChange={pick}>
            {children}
          </AriaCheckboxGroup>
        ) : (
          <AriaRadioGroup
            {...shared}
            value={chosen[0] ?? null}
            onChange={(next) => pick(next === null ? [] : [next])}
          >
            {children}
          </AriaRadioGroup>
        )}
      </ChoicesContext>
    </ChoiceContext>
  );
}

/** One option of a question: a radio or a checkbox with its label and description. */
export function QuestionnaireChoice({
  ref,
  value,
  description,
  isDisabled,
  className,
  children,
  ...rest
}: QuestionnaireChoiceProps) {
  const isSelected = useContext(ChoicesContext).includes(value);
  return (
    <div {...rest} {...hooks.slot('choice', { selected: isSelected }, className)} ref={ref}>
      <Choice value={value} description={description} isDisabled={isDisabled}>
        {children}
      </Choice>
    </div>
  );
}

/**
 * A question's answer in the reader's own words, named by the question's title, which submits under
 * its name. Enter goes on to the next question, or submits from the last.
 */
export function QuestionnaireInput({
  type = 'text',
  value,
  defaultValue,
  onChange,
  className,
  'aria-labelledby': labelledBy,
  ...rest
}: QuestionnaireInputProps) {
  const questionnaire = readQuestionnaire(useContext(QuestionnaireContext), 'QuestionnaireInput');
  const item = readQuestionnaire(useContext(QuestionnaireItemContext), 'QuestionnaireInput');
  return (
    <AriaInput
      {...rest}
      {...hooks.slot('input', undefined, className)}
      type={type}
      name={item.name}
      readOnly={questionnaire.isReadOnly}
      value={value}
      defaultValue={defaultValue}
      aria-labelledby={rest['aria-label'] ? labelledBy : (labelledBy ?? item.titleId)}
      aria-invalid={item.isInvalid || undefined}
      onChange={(event) => {
        onChange?.(event.target.value);
        questionnaire.noteChange();
      }}
      onKeyDown={(event) => {
        if (!isPlainEnter(event)) return;
        event.preventDefault();
        questionnaire.advance();
      }}
    />
  );
}
