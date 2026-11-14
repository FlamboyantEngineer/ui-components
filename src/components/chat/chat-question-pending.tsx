'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { readOwn } from '../../utils/read-own.js';
import { useRetainedState } from '../../utils/use-retained-state.js';
import { Button } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { QuestionItem } from './chat-question-item.js';
import {
  type ChatQuestionAnswer,
  type ChatQuestionAnsweredMark,
  chatQuestionHooks as hooks,
  type ChatQuestionItem,
  isQuestionAnswered,
  normalizeDraft,
  type QuestionDraft,
  toAnswer,
} from './chat-question-model.js';
import type { QuestionRequestKind } from './chat-question-request.js';
import { QuestionTabs } from './chat-question-tabs.js';

type Drafts = Readonly<Record<string, QuestionDraft>>;

interface PendingQuestionsProps {
  retainKey?: string | undefined;
  questions: readonly ChatQuestionItem[];
  /** Sends the answers; without it the card is read-only. */
  onSubmit?: ((answers: ChatQuestionAnswer[]) => void) | undefined;
  onDismiss?: (() => void) | undefined;
  /** The request the card sent that has not settled: it locks the answers and the actions. */
  running: QuestionRequestKind | null;
  /** Why the last request failed. */
  failure: string | null;
  answeredMark: ChatQuestionAnsweredMark;
}

interface QuestionActionsProps {
  /** The shown question's position from 0. */
  step: number;
  count: number;
  /** Next is available: the shown question has an answer, or the card is read-only. */
  canStep: boolean;
  isComplete: boolean;
  running: QuestionRequestKind | null;
  onStep: (step: number) => void;
  onSubmit?: (() => void) | undefined;
  onDismiss?: (() => void) | undefined;
}

/** Focuses a question's answer: the chosen radio, else its first radio, checkbox or text field. */
function focusAnswer(element: HTMLElement | null) {
  const target =
    element?.querySelector<HTMLInputElement>('input[type="radio"]:checked') ??
    element?.querySelector<HTMLInputElement>('input:not([type="hidden"])');
  target?.focus();
}

/** A primary button that stays focusable while unavailable, with a hint saying why. */
function PrimaryAction({
  slot,
  label,
  hint,
  isAvailable,
  isDisabled,
  isPending,
  onPress,
}: {
  slot: 'next' | 'submit';
  label: string;
  /** Why the button is unavailable. */
  hint: string;
  isAvailable: boolean;
  /** Unavailable for another reason, without the hint: another request runs. */
  isDisabled: boolean;
  isPending?: boolean | undefined;
  onPress: () => void;
}) {
  return (
    <Button
      className={hooks.slotClass(slot)}
      variant="primary"
      isDisabled={!isAvailable || isDisabled}
      isPending={isPending}
      focusableWhenDisabled
      tooltip={isAvailable ? undefined : hint}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}

/**
 * Back (after the first question), Next or, on the last question, Submit when the card can be
 * answered, then Dismiss when it can be dismissed. While a request runs, its button is pending and
 * the others are unavailable.
 */
function QuestionActions(props: QuestionActionsProps) {
  const { step, count, canStep, isComplete, running, onStep, onSubmit, onDismiss } = props;
  const strings = useUiStrings();
  const isLast = step >= count - 1;
  if (step === 0 && isLast && !onSubmit && !onDismiss) return null;
  return (
    <div {...hooks.slot('actions')}>
      {step > 0 ? (
        <Button
          className={hooks.slotClass('back')}
          isDisabled={running !== null}
          onPress={() => onStep(step - 1)}
        >
          {strings.back}
        </Button>
      ) : null}
      {isLast ? null : (
        <PrimaryAction
          slot="next"
          label={strings.next}
          hint={strings.questionAnswerToContinue}
          isAvailable={canStep}
          isDisabled={running !== null}
          onPress={() => onStep(step + 1)}
        />
      )}
      {isLast && onSubmit ? (
        <PrimaryAction
          slot="submit"
          label={strings.questionSubmit}
          hint={strings.questionAnswerAllToSubmit}
          isAvailable={isComplete}
          isDisabled={running === 'dismiss'}
          isPending={running === 'submit'}
          onPress={onSubmit}
        />
      ) : null}
      {onDismiss ? (
        <Button
          className={hooks.slotClass('dismiss')}
          variant="ghost"
          isDisabled={running === 'submit'}
          isPending={running === 'dismiss'}
          onPress={onDismiss}
        >
          {strings.dismiss}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * A pending card: its questions as tabs with a counter, the shown question, the reader's drafts,
 * Back, Next, Submit and Dismiss, and why the last request failed. Any tab shows its question and
 * keeps focus; Back and Next move focus to the answer of the question they show; Enter in an answer
 * field steps on, or submits from the last question. Without `onSubmit`, or while a request runs,
 * the answers are read-only; a read-only card steps through its questions without answers.
 */
export function PendingQuestions(props: PendingQuestionsProps) {
  const { questions, onSubmit, onDismiss, running, failure, answeredMark } = props;
  const [drafts, setDrafts] = useRetainedState<Drafts>(
    props.retainKey && `question-drafts:${props.retainKey}`,
    {},
  );
  const [step, setStep] = useRetainedState(
    props.retainKey && `question-step:${props.retainKey}`,
    0,
  );
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set());
  const itemRef = useRef<HTMLDivElement>(null);
  const hasStepped = useRef(false);
  useLayoutEffect(() => {
    if (!hasStepped.current) return;
    hasStepped.current = false;
    focusAnswer(itemRef.current);
  }, [step]);
  const current = questions[step];
  const canAnswer = onSubmit !== undefined && running === null;
  const firstOpen = questions.findIndex(
    (item) => !isQuestionAnswered(item, readOwn(drafts, item.id)),
  );
  const isStepAnswered = current ? isQuestionAnswered(current, readOwn(drafts, current.id)) : true;
  const goTo = (index: number) => {
    hasStepped.current = true;
    setStep(index);
  };
  const submit = () =>
    onSubmit?.(questions.map((item) => toAnswer(item, readOwn(drafts, item.id))));
  const advance = () => {
    if (!current || !canAnswer) return;
    if (!isStepAnswered) setRevealed((ids) => new Set(ids).add(current.id));
    else if (step < questions.length - 1) goTo(step + 1);
    else if (firstOpen === -1) submit();
    else goTo(firstOpen);
  };
  return (
    <>
      <QuestionTabs
        questions={questions}
        drafts={drafts}
        step={step}
        answeredMark={answeredMark}
        onSelect={setStep}
      >
        {current ? (
          <QuestionItem
            key={current.id}
            ref={itemRef}
            item={current}
            draft={normalizeDraft(current, readOwn(drafts, current.id))}
            onDraftChange={(draft) => setDrafts((all) => ({ ...all, [current.id]: draft }))}
            isReadOnly={!canAnswer}
            isRevealed={revealed.has(current.id)}
            onEnter={advance}
          />
        ) : null}
      </QuestionTabs>
      {failure ? <InlineError className={hooks.slotClass('error')}>{failure}</InlineError> : null}
      <QuestionActions
        step={step}
        count={questions.length}
        canStep={isStepAnswered || !onSubmit}
        isComplete={firstOpen === -1}
        running={running}
        onStep={goTo}
        onSubmit={onSubmit && submit}
        onDismiss={onDismiss}
      />
    </>
  );
}
