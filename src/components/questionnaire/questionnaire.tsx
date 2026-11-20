'use client';

import { type ReactNode, useCallback, useContext, useId, useLayoutEffect, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, ContainerProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { joinIds } from '../../utils/join-ids.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import {
  type QuestionnaireAnswers,
  QuestionnaireContext,
  questionnaireHooks as hooks,
  QuestionnaireItemContext,
  type QuestionnaireItemState,
  readQuestionnaire,
} from './questionnaire-hooks.js';
import { useQuestionnaire } from './use-questionnaire.js';

export type { QuestionnaireAnswers, QuestionnaireItemStatus } from './questionnaire-hooks.js';

export interface QuestionnaireProps
  extends RefProps<HTMLFormElement>, BaseProps, AriaLabellingProps {
  /** The question names in order: they then show one at a time. Without it, all show at once. */
  items?: readonly string[] | undefined;
  /** The question shown while stepping (controlled). */
  currentKey?: string | undefined;
  /** The question shown at first while stepping. Defaults to the first of `items`. */
  defaultCurrentKey?: string | undefined;
  /** Receives the question each step moves to, also while controlled. */
  onCurrentKeyChange?: ((key: string) => void) | undefined;
  /** Receives the answers once every required question has one. */
  onSubmit?: ((answers: QuestionnaireAnswers) => void) | undefined;
  /** The progress, the questions and the actions. */
  children?: ReactNode;
}

export interface QuestionnaireProgressProps extends RefProps<HTMLDivElement>, BaseProps {
  /** Replaces the shown text, which defaults to the provider's `questionProgress`. */
  children?: ReactNode;
}

export interface QuestionnaireItemProps extends RefProps<HTMLFieldSetElement>, BaseProps {
  /** The question's name, under which its answers submit and by which `items` orders it. */
  name: string;
  /** Next and Submit stop here until it has an answer. */
  isRequired?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** The title, description, answer controls and error. */
  children?: ReactNode;
}

export interface QuestionnaireTitleProps extends ContainerProps<'legend'>, BaseProps {}

export interface QuestionnaireDescriptionProps extends ContainerProps<'p'>, BaseProps {}

export interface QuestionnaireErrorProps extends ContainerProps<'p'>, BaseProps {}

/** Records while a part renders, so its question names it in `aria-describedby`. */
function useShownPart(part: 'description' | 'error', item: QuestionnaireItemState, isShown = true) {
  const { showPart } = item;
  useLayoutEffect(() => {
    showPart(part, isShown);
    return () => showPart(part, false);
  }, [part, isShown, showPart]);
}

/**
 * A form of questions after shadcn/ui's questionnaire: with `items` it steps through them one at a
 * time, else shows them all. Its actions move between questions, pass over optional ones and
 * submit; Next and Submit stop at a required question without an answer and mark it invalid.
 */
export function Questionnaire({
  ref,
  items,
  currentKey,
  defaultCurrentKey,
  onCurrentKeyChange,
  onSubmit,
  className,
  children,
  ...rest
}: QuestionnaireProps) {
  const questionnaire = useQuestionnaire({
    items,
    currentKey,
    defaultCurrentKey,
    onCurrentKeyChange,
    onSubmit,
  });
  const refs = useMergedRefs(questionnaire.formRef, ref);
  return (
    <form
      {...rest}
      {...hooks.root({ className, data: { stepping: items !== undefined } })}
      ref={refs}
      noValidate
      onSubmit={questionnaire.onSubmit}
      onChange={questionnaire.state.noteChange}
    >
      <QuestionnaireContext value={questionnaire.state}>{children}</QuestionnaireContext>
    </form>
  );
}

/** Where the reader is while stepping, such as "Question 2 of 3"; nothing without `items`. */
export function QuestionnaireProgress({
  ref,
  className,
  children,
  ...rest
}: QuestionnaireProgressProps) {
  const strings = useUiStrings();
  const { isStepping, position, count } = readQuestionnaire(
    useContext(QuestionnaireContext),
    'QuestionnaireProgress',
  );
  if (!isStepping) return null;
  const label = strings.questionProgress(position + 1, count);
  return (
    <div
      {...rest}
      {...hooks.slot('progress', undefined, className)}
      ref={ref}
      role="progressbar"
      aria-label={strings.questionSteps}
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={position + 1}
      aria-valuetext={label}
    >
      {children ?? label}
    </div>
  );
}

/**
 * One question: a `<fieldset>` named by its title and described by its description and, while
 * invalid, its error. While stepping only the shown question renders visibly.
 */
export function QuestionnaireItem({
  ref,
  name,
  isRequired = false,
  isDisabled = false,
  className,
  children,
  ...rest
}: QuestionnaireItemProps) {
  const questionnaire = readQuestionnaire(useContext(QuestionnaireContext), 'QuestionnaireItem');
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [shown, setShown] = useState<{ description: boolean; error: boolean }>({
    description: false,
    error: false,
  });
  const showPart = useCallback(
    (part: 'description' | 'error', isShown: boolean) =>
      setShown((parts) => (parts[part] === isShown ? parts : { ...parts, [part]: isShown })),
    [],
  );
  const isInvalid = questionnaire.isInvalid(name);
  const isCurrent = questionnaire.currentKey === name;
  const item: QuestionnaireItemState = {
    name,
    titleId,
    isDisabled,
    isInvalid,
    isRequired,
    descriptionId,
    errorId,
    showPart,
  };
  const data = {
    status: questionnaire.statusOf(name),
    current: questionnaire.isStepping && isCurrent,
    required: isRequired,
    invalid: isInvalid,
    disabled: isDisabled,
  };
  return (
    <fieldset
      {...rest}
      {...hooks.slot('item', data, className)}
      ref={ref}
      name={name}
      disabled={isDisabled}
      hidden={questionnaire.isStepping && !isCurrent}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={joinIds(shown.description && descriptionId, shown.error && errorId)}
    >
      <QuestionnaireItemContext value={item}>{children}</QuestionnaireItemContext>
    </fieldset>
  );
}

/** The question, as its fieldset's legend. */
export function QuestionnaireTitle({ className, ...rest }: QuestionnaireTitleProps) {
  const item = readQuestionnaire(useContext(QuestionnaireItemContext), 'QuestionnaireTitle');
  return <legend {...rest} {...hooks.slot('title', undefined, className)} id={item.titleId} />;
}

/** More about the question, which describes it. */
export function QuestionnaireDescription({ className, ...rest }: QuestionnaireDescriptionProps) {
  const item = readQuestionnaire(useContext(QuestionnaireItemContext), 'QuestionnaireDescription');
  useShownPart('description', item);
  return (
    <p {...rest} {...hooks.slot('description', undefined, className)} id={item.descriptionId} />
  );
}

/**
 * Why the question cannot be left yet, shown while it is invalid: the caller's words, else the
 * provider's `questionAnswerToContinue`.
 */
export function QuestionnaireError({ className, children, ...rest }: QuestionnaireErrorProps) {
  const strings = useUiStrings();
  const item = readQuestionnaire(useContext(QuestionnaireItemContext), 'QuestionnaireError');
  useShownPart('error', item, item.isInvalid);
  if (!item.isInvalid) return null;
  return (
    <p {...rest} {...hooks.slot('error', undefined, className)} id={item.errorId}>
      {children ?? strings.questionAnswerToContinue}
    </p>
  );
}

export type {
  QuestionnaireActionProps,
  QuestionnaireActionsProps,
} from './questionnaire-actions.js';
export {
  QuestionnaireActions,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSkip,
  QuestionnaireSubmit,
} from './questionnaire-actions.js';
export type {
  QuestionnaireChoiceProps,
  QuestionnaireChoicesProps,
  QuestionnaireChoicesSelectionMode,
  QuestionnaireInputProps,
  QuestionnaireInputType,
} from './questionnaire-answers.js';
export {
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireInput,
} from './questionnaire-answers.js';
