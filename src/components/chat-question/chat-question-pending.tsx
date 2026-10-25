import { useLayoutEffect, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { QuestionItem } from './chat-question-item.js';
import {
  chatQuestionHooks as hooks,
  emptyDraft,
  isQuestionAnswered,
  toAnswer,
  type ChatQuestionAnswer,
  type ChatQuestionItem,
  type QuestionDraft,
} from './chat-question-model.js';

type Drafts = Readonly<Record<string, QuestionDraft>>;

interface PendingQuestionsProps {
  questions: readonly ChatQuestionItem[];
  onSubmit: (answers: ChatQuestionAnswer[]) => void;
  onDismiss?: (() => void) | undefined;
}

interface QuestionActionsProps {
  /** The shown question's position from 0. */
  step: number;
  count: number;
  isStepAnswered: boolean;
  isComplete: boolean;
  onStep: (step: number) => void;
  onSubmit: () => void;
  onDismiss?: (() => void) | undefined;
}

/** Focuses a question's answer: the chosen radio, else its first radio, checkbox or text field. */
function focusAnswer(element: HTMLElement | null) {
  const target =
    element?.querySelector<HTMLInputElement>('input[type="radio"]:checked') ??
    element?.querySelector<HTMLInputElement>('input:not([type="hidden"])');
  target?.focus();
}

/** The chips of a stepped card: each question's header, the shown one current. */
function QuestionSteps({
  questions,
  drafts,
  step,
}: {
  questions: readonly ChatQuestionItem[];
  drafts: Drafts;
  step: number;
}) {
  const strings = useUiStrings();
  return (
    <ol {...hooks.slot('steps')} aria-label={strings.questionSteps}>
      {questions.map((item, index) => (
        <li
          key={item.id}
          {...hooks.slot('step', {
            current: index === step,
            answered: isQuestionAnswered(item, drafts[item.id]),
          })}
          aria-current={index === step ? 'step' : undefined}
        >
          {item.header || strings.questionStep(index + 1)}
        </li>
      ))}
    </ol>
  );
}

/**
 * Back (after the first question), Next or, on the last question, Submit, then Dismiss when the
 * card can be dismissed. Next and Submit stay focusable while unavailable, with a hint saying why.
 */
function QuestionActions(props: QuestionActionsProps) {
  const { step, count, isStepAnswered, isComplete, onStep, onSubmit, onDismiss } = props;
  const strings = useUiStrings();
  const isLast = step >= count - 1;
  return (
    <div {...hooks.slot('actions')}>
      {step > 0 ? (
        <Button className={hooks.slotClass('back')} onPress={() => onStep(step - 1)}>
          {strings.back}
        </Button>
      ) : null}
      {isLast ? (
        <Button
          className={hooks.slotClass('submit')}
          variant="primary"
          isDisabled={!isComplete}
          focusableWhenDisabled
          tooltip={isComplete ? undefined : strings.questionAnswerAllToSubmit}
          onPress={onSubmit}
        >
          {strings.questionSubmit}
        </Button>
      ) : (
        <Button
          className={hooks.slotClass('next')}
          variant="primary"
          isDisabled={!isStepAnswered}
          focusableWhenDisabled
          tooltip={isStepAnswered ? undefined : strings.questionAnswerToContinue}
          onPress={() => onStep(step + 1)}
        >
          {strings.next}
        </Button>
      )}
      {onDismiss ? (
        <Button className={hooks.slotClass('dismiss')} variant="ghost" onPress={onDismiss}>
          {strings.dismiss}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * A pending card: one question, or several asked one at a time behind chips and a progress hint,
 * with the reader's drafts, Back, Next, Submit and Dismiss. Stepping moves focus to the answer of
 * the question shown; Enter in an answer field steps on, or submits from the last question.
 */
export function PendingQuestions({ questions, onSubmit, onDismiss }: PendingQuestionsProps) {
  const strings = useUiStrings();
  const [drafts, setDrafts] = useState<Drafts>({});
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set());
  const itemRef = useRef<HTMLDivElement>(null);
  const hasStepped = useRef(false);
  useLayoutEffect(() => {
    if (!hasStepped.current) return;
    hasStepped.current = false;
    focusAnswer(itemRef.current);
  }, [step]);
  const current = questions[step];
  const isStepped = questions.length > 1;
  const firstOpen = questions.findIndex((item) => !isQuestionAnswered(item, drafts[item.id]));
  const isStepAnswered = current ? isQuestionAnswered(current, drafts[current.id]) : true;
  const goTo = (index: number) => {
    hasStepped.current = true;
    setStep(index);
  };
  const submit = () => onSubmit(questions.map((item) => toAnswer(item, drafts[item.id])));
  const advance = () => {
    if (!current) return;
    if (!isStepAnswered) setRevealed((ids) => new Set(ids).add(current.id));
    else if (step < questions.length - 1) goTo(step + 1);
    else if (firstOpen === -1) submit();
    else goTo(firstOpen);
  };
  return (
    <>
      {isStepped ? <QuestionSteps questions={questions} drafts={drafts} step={step} /> : null}
      {isStepped ? (
        <span {...hooks.slot('progress')}>
          {strings.questionProgress(step + 1, questions.length)}
        </span>
      ) : null}
      {current ? (
        <QuestionItem
          key={current.id}
          ref={itemRef}
          item={current}
          draft={drafts[current.id] ?? emptyDraft}
          onDraftChange={(draft) => setDrafts((all) => ({ ...all, [current.id]: draft }))}
          isRevealed={revealed.has(current.id)}
          onEnter={advance}
          showsHeader={!isStepped}
        />
      ) : null}
      <QuestionActions
        step={step}
        count={questions.length}
        isStepAnswered={isStepAnswered}
        isComplete={firstOpen === -1}
        onStep={goTo}
        onSubmit={submit}
        onDismiss={onDismiss}
      />
    </>
  );
}
