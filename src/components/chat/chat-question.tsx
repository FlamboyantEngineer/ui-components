'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { containsFocus, isFocusLost } from '../../utils/focus-target.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { useRetainedStateReset } from '../../utils/use-retained-state.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { usePartStateKey } from './chat-part-state.js';
import {
  type ChatQuestionAnswer,
  type ChatQuestionAnsweredMark,
  type ChatQuestionData,
  chatQuestionHooks as hooks,
} from './chat-question-model.js';
import { PendingQuestions } from './chat-question-pending.js';
import { useQuestionRequest } from './chat-question-request.js';
import { QuestionDismissal, QuestionSummary } from './chat-question-summary.js';
import { readQuestionText } from './chat-question-text.js';

export type {
  ChatQuestionAnswer,
  ChatQuestionAnsweredMark,
  ChatQuestionData,
  ChatQuestionItem,
  ChatQuestionOption,
  ChatQuestionSelectionMode,
  ChatQuestionStatus,
} from './chat-question-model.js';

export interface ChatQuestionProps extends RefProps<HTMLDivElement>, BaseProps, ChatQuestionData {
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
  /**
   * How the tab of an answered question shows it: `icon` (the default) draws a check before its
   * label; `style` draws nothing, leaving the tab's `data-answered` to the stylesheet.
   */
  answeredMark?: ChatQuestionAnsweredMark | undefined;
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
    if (root && (isFocusLost(root) || containsFocus(root))) {
      root.focus();
    }
  }, [status]);
  const settle = () => {
    isSettling.current = true;
  };
  return { rootRef, settle };
}

/**
 * The card's name, from the words of its first question's title, and that title for a dismissed
 * card.
 */
function useCardName(questions: ChatQuestionData['questions']) {
  const strings = useUiStrings();
  const first = questions[0]?.question;
  const text = useMemo(() => (first === undefined ? undefined : readQuestionText(first)), [first]);
  return {
    name: text === undefined ? undefined : strings.questionAsked(text.words, questions.length),
    title: text?.title,
  };
}

/**
 * An inline card in which an agent asks the reader one or several questions: a `group` named from
 * the first question, answered by radios, checkboxes or the reader's own words and submitted
 * together, read-only without `onSubmit`. A pending card announces itself politely once and is
 * locked while the answers or the dismissal it sent are unsettled; an answered card sums up the
 * answers and a dismissed one says so.
 */
export function ChatQuestion({
  ref,
  id,
  questions,
  status,
  answers,
  onSubmit,
  onDismiss,
  answeredMark = 'icon',
  className,
  ...rest
}: ChatQuestionProps) {
  const stateKey = usePartStateKey(id);
  const { rootRef, settle } = useSettledFocus(status);
  const rootRefs = useMergedRefs(rootRef, ref);
  // The live region exists before its text arrives, so the text is announced: the empty region must
  // be committed first.
  const [isAnnounced, setAnnounced] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the empty live region commits first
  useLayoutEffect(() => setAnnounced(true), []);
  const { name, title } = useCardName(questions);
  const isPending = status === 'pending';
  useRetainedStateReset(
    [`question-drafts:${stateKey}`, `question-step:${stateKey}`, `question-request:${stateKey}`],
    !isPending,
  );
  const request = useQuestionRequest(isPending ? stateKey : undefined);
  const data = {
    status,
    stepped: questions.length > 1,
    submitting: request.running !== null,
    answeredMark,
  };
  return (
    <div
      {...hooks.root({ className, props: rest, data })}
      id={id}
      ref={rootRefs}
      role="group"
      aria-label={name}
      tabIndex={isPending ? undefined : -1}
    >
      {isPending ? (
        <PendingQuestions
          key={stateKey}
          retainKey={stateKey}
          questions={questions}
          running={request.running}
          failure={request.failure}
          answeredMark={answeredMark}
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
      {status === 'dismissed' ? <QuestionDismissal title={title} /> : null}
      {isPending ? (
        <VisuallyHidden as="span" className={hooks.slotClass('announcement')} role="status">
          {isAnnounced ? name : null}
        </VisuallyHidden>
      ) : null}
    </div>
  );
}
