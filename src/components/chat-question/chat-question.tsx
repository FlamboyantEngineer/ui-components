import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VisuallyHidden } from '../../primitives/index.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  chatQuestionHooks as hooks,
  type ChatQuestionAnswer,
  type ChatQuestionData,
} from './chat-question-model.js';
import { PendingQuestions } from './chat-question-pending.js';
import { useQuestionRequest } from './chat-question-request.js';
import { QuestionDismissal, QuestionSummary } from './chat-question-summary.js';

export type {
  ChatQuestionAnswer,
  ChatQuestionData,
  ChatQuestionItem,
  ChatQuestionOption,
  ChatQuestionSelectionMode,
  ChatQuestionStatus,
} from './chat-question-model.js';

export interface ChatQuestionProps extends BaseProps, ChatQuestionData {
  /** Identifies the card, and is its root element's id. */
  id: string;
  /**
   * Receives the answers, one per question in order, when the reader submits. A returned promise
   * locks the card until it settles; a rejection keeps the answers and shows why. Without it a
   * pending card is read-only.
   */
  onSubmit?: ((answers: ChatQuestionAnswer[]) => void | Promise<unknown>) | undefined;
  /** Draws a Dismiss button that calls this; a returned promise is awaited like `onSubmit`'s. */
  onDismiss?: (() => void | Promise<unknown>) | undefined;
}

/**
 * Once the reader's Submit or Dismiss has settled the card, keeps focus in it: the button they
 * pressed leaves with the pending card, so focus moves to the card unless it went elsewhere.
 */
function useSettledFocus(status: ChatQuestionData['status']) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isSettling = useRef(false);
  useLayoutEffect(() => {
    if (status === 'pending' || !isSettling.current) return;
    isSettling.current = false;
    const root = rootRef.current;
    const active = root?.ownerDocument.activeElement;
    if (root && (!active || active === root.ownerDocument.body || root.contains(active))) {
      root.focus();
    }
  }, [status]);
  const settle = () => {
    isSettling.current = true;
  };
  return { rootRef, settle };
}

/**
 * An inline card in which an agent asks the reader one or several questions: a `group` named from
 * the first question, answered by radios, checkboxes or the reader's own words and submitted
 * together, read-only without `onSubmit`. A pending card announces itself politely once and is
 * locked while the answers or the dismissal it sent are unsettled; an answered card sums up the
 * answers and a dismissed one says so.
 */
export function ChatQuestion({
  id,
  questions,
  status,
  answers,
  onSubmit,
  onDismiss,
  className,
  ...rest
}: ChatQuestionProps) {
  const strings = useUiStrings();
  const { rootRef, settle } = useSettledFocus(status);
  // The live region exists before its text arrives, so the text is announced.
  const [isAnnounced, setAnnounced] = useState(false);
  useEffect(() => setAnnounced(true), []);
  const first = questions[0]?.question;
  const name = first === undefined ? undefined : strings.questionAsked(first, questions.length);
  const isPending = status === 'pending';
  const request = useQuestionRequest(isPending ? id : undefined);
  const data = { status, stepped: questions.length > 1, submitting: request.running !== null };
  return (
    <div
      {...hooks.root({ className, props: rest, data })}
      id={id}
      ref={rootRef}
      role="group"
      aria-label={name}
      tabIndex={isPending ? undefined : -1}
    >
      {isPending ? (
        <PendingQuestions
          key={id}
          questions={questions}
          running={request.running}
          failure={request.failure}
          onSubmit={
            onSubmit &&
            ((given) =>
              request.run('submit', () => {
                settle();
                return onSubmit(given);
              }))
          }
          onDismiss={
            onDismiss &&
            (() =>
              request.run('dismiss', () => {
                settle();
                return onDismiss();
              }))
          }
        />
      ) : null}
      {status === 'answered' ? <QuestionSummary questions={questions} answers={answers} /> : null}
      {status === 'dismissed' ? <QuestionDismissal question={first} /> : null}
      {isPending ? (
        <VisuallyHidden
          elementType="span"
          className={hooks.slotClass('announcement')}
          role="status"
        >
          {isAnnounced ? name : null}
        </VisuallyHidden>
      ) : null}
    </div>
  );
}
