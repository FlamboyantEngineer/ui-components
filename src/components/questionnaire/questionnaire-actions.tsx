'use client';

import { type ReactNode, useContext } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button, type ButtonVariant } from '../button/button.js';
import {
  QuestionnaireContext,
  questionnaireHooks as hooks,
  type QuestionnaireState,
  readQuestionnaire,
} from './questionnaire-hooks.js';

export interface QuestionnaireActionsProps extends ContainerProps<'div'>, BaseProps {}

export interface QuestionnaireActionProps extends RefProps<HTMLButtonElement>, BaseProps {
  /** Replaces the button's label, which defaults to the provider's string. */
  children?: ReactNode;
}

type ActionSlot = 'previous' | 'skip' | 'next' | 'submit';

interface ActionOptions {
  slot: ActionSlot;
  variant: ButtonVariant;
  label: string;
  /** Whether the action applies to where the reader is. */
  isShown: (state: QuestionnaireState) => boolean;
  /** Its press; without one the button submits the form. */
  onPress?: ((state: QuestionnaireState) => void) | undefined;
}

/** One action, shown only where it applies, with its slot class and its provider label. */
function QuestionnaireAction({
  options,
  props: { className, children, ...rest },
}: {
  options: ActionOptions;
  props: QuestionnaireActionProps;
}) {
  const state = readQuestionnaire(useContext(QuestionnaireContext), 'QuestionnaireActions');
  if (!options.isShown(state)) return null;
  const { onPress } = options;
  return (
    <Button
      {...rest}
      className={mergeClassNames(hooks.slotClass(options.slot), className)}
      variant={options.variant}
      type={onPress ? 'button' : 'submit'}
      onPress={onPress && (() => onPress(state))}
    >
      {children ?? options.label}
    </Button>
  );
}

const isLast = (state: QuestionnaireState) => state.position >= state.count - 1;

/** The row of Previous, Skip, Next and Submit. */
export function QuestionnaireActions({ className, ...rest }: QuestionnaireActionsProps) {
  return <div {...rest} {...hooks.slot('actions', undefined, className)} />;
}

/** Back to the previous question, while stepping past the first. */
export function QuestionnairePrevious(props: QuestionnaireActionProps) {
  const strings = useUiStrings();
  return (
    <QuestionnaireAction
      props={props}
      options={{
        slot: 'previous',
        variant: 'secondary',
        label: strings.previous,
        isShown: (state) => state.isStepping && state.position > 0,
        onPress: (state) => state.goPrevious(),
      }}
    />
  );
}

/** Passes over an optional question, which becomes `skipped`, while stepping before the last. */
export function QuestionnaireSkip(props: QuestionnaireActionProps) {
  const strings = useUiStrings();
  return (
    <QuestionnaireAction
      props={props}
      options={{
        slot: 'skip',
        variant: 'ghost',
        label: strings.skip,
        isShown: (state) =>
          state.isStepping &&
          !isLast(state) &&
          !(state.currentKey !== null && state.isRequired(state.currentKey)),
        onPress: (state) => state.skip(),
      }}
    />
  );
}

/** On to the next question, while stepping before the last; it stops at a required question without an answer. */
export function QuestionnaireNext(props: QuestionnaireActionProps) {
  const strings = useUiStrings();
  return (
    <QuestionnaireAction
      props={props}
      options={{
        slot: 'next',
        variant: 'primary',
        label: strings.next,
        isShown: (state) => state.isStepping && !isLast(state),
        onPress: (state) => state.goNext(),
      }}
    />
  );
}

/** Submits the answers, on the last question or when every question shows. */
export function QuestionnaireSubmit(props: QuestionnaireActionProps) {
  const strings = useUiStrings();
  return (
    <QuestionnaireAction
      props={props}
      options={{
        slot: 'submit',
        variant: 'primary',
        label: strings.questionSubmit,
        isShown: (state) => !state.isStepping || isLast(state),
      }}
    />
  );
}
