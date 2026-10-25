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
  /** Receives the answers, one per question in order, when the reader submits. */
  onSubmit?: ((answers: ChatQuestionAnswer[]) => void) | undefined;
  /** Draws a Dismiss button that calls this. */
  onDismiss?: (() => void) | undefined;
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
 * together. A pending card announces itself politely once; an answered card sums up the answers
 * and a dismissed one says so.
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
  return (
    <div
      {...hooks.root({ className, props: rest, data: { status, stepped: questions.length > 1 } })}
      id={id}
      ref={rootRef}
      role="group"
      aria-label={name}
      tabIndex={isPending ? undefined : -1}
    >
      {isPending ? (
        <PendingQuestions
          questions={questions}
          onSubmit={(given) => {
            settle();
            onSubmit?.(given);
          }}
          onDismiss={
            onDismiss &&
            (() => {
              settle();
              onDismiss();
            })
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
