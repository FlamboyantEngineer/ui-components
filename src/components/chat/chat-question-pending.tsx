'use client';

import { useUiStrings } from '../../core/provider.js';
import { readOwn } from '../../utils/read-own.js';
import { useRetainedState } from '../../utils/use-retained-state.js';
import { Button } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import {
  Questionnaire,
  type QuestionnaireAnswers,
  QuestionnaireActions,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
} from '../questionnaire/questionnaire.js';
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
  /** Every question is on one step: no Back or Next. */
  isSingle: boolean;
  /** Next is available: the shown question has an answer, or the card is read-only. */
  canStep: boolean;
  isComplete: boolean;
  running: QuestionRequestKind | null;
  canSubmit: boolean;
  onDismiss?: (() => void) | undefined;
}

/**
 * The questionnaire's actions: Back (after the first question), Next or, on the last question,
 * Submit when the card can be answered, then Dismiss when it can be dismissed. Next and Submit stay
 * focusable while unavailable, with a hint saying why. While a request runs, its button is pending
 * and the others are unavailable.
 */
function QuestionActions(props: QuestionActionsProps) {
  const { isSingle, canStep, isComplete, running, canSubmit, onDismiss } = props;
  const strings = useUiStrings();
  if (isSingle && !canSubmit && !onDismiss) return null;
  return (
    <QuestionnaireActions className={hooks.slotClass('actions')}>
      <QuestionnairePrevious className={hooks.slotClass('back')} isDisabled={running !== null}>
        {strings.back}
      </QuestionnairePrevious>
      <QuestionnaireNext
        className={hooks.slotClass('next')}
        isDisabled={!canStep || running !== null}
        focusableWhenDisabled
        tooltip={canStep ? undefined : strings.questionAnswerToContinue}
      />
      {canSubmit ? (
        <QuestionnaireSubmit
          className={hooks.slotClass('submit')}
          isDisabled={!isComplete || running === 'dismiss'}
          isPending={running === 'submit'}
          focusableWhenDisabled
          tooltip={isComplete ? undefined : strings.questionAnswerAllToSubmit}
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
    </QuestionnaireActions>
  );
}

/**
 * Which questions have an answer, by id, for the questionnaire: the drafts live outside its form,
 * retained while the card is out of view.
 */
function toAnswered(questions: readonly ChatQuestionItem[], drafts: Drafts): QuestionnaireAnswers {
  return Object.fromEntries(
    questions.map((item) => [
      item.id,
      isQuestionAnswered(item, readOwn(drafts, item.id)) ? [item.id] : [],
    ]),
  );
}

/**
 * A pending card, as a stepping `Questionnaire`: its questions as tabs with a counter, the shown
 * question, the reader's drafts, Back, Next, Submit and Dismiss, and why the last request failed.
 * Any tab shows its question and keeps focus; Back and Next move focus to the answer of the question
 * they show; Enter in an answer field steps on, or submits from the last question, and on a question
 * left unanswered shows why. Without `onSubmit`, or while a request runs, the answers are read-only;
 * a read-only card steps through its questions without answers.
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
  const keys = questions.map((item) => item.id);
  const current = questions[step];
  const canAnswer = onSubmit !== undefined && running === null;
  const isComplete = questions.every((item) => isQuestionAnswered(item, readOwn(drafts, item.id)));
  const isStepAnswered = current ? isQuestionAnswered(current, readOwn(drafts, current.id)) : true;
  const submit = () =>
    onSubmit?.(questions.map((item) => toAnswer(item, readOwn(drafts, item.id))));
  return (
    <Questionnaire
      className={hooks.slotClass('form')}
      items={keys}
      currentKey={current?.id}
      onCurrentKeyChange={(key) => setStep(Math.max(keys.indexOf(key), 0))}
      answers={toAnswered(questions, drafts)}
      isReadOnly={!canAnswer}
      onSubmit={submit}
    >
      <QuestionTabs
        questions={questions}
        drafts={drafts}
        step={step}
        answeredMark={answeredMark}
        onSelect={setStep}
      >
        {questions.map((item) => (
          <QuestionItem
            key={item.id}
            item={item}
            draft={normalizeDraft(item, readOwn(drafts, item.id))}
            onDraftChange={(draft) => setDrafts((all) => ({ ...all, [item.id]: draft }))}
            isRequired={canAnswer}
          />
        ))}
      </QuestionTabs>
      {failure ? <InlineError className={hooks.slotClass('error')}>{failure}</InlineError> : null}
      <QuestionActions
        isSingle={questions.length <= 1}
        canStep={isStepAnswered || !onSubmit}
        isComplete={isComplete}
        running={running}
        canSubmit={onSubmit !== undefined}
        onDismiss={onDismiss}
      />
    </Questionnaire>
  );
}
