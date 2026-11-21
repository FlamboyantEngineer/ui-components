'use client';

import { type ReactNode, useMemo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  type ChatQuestionAnswer,
  chatQuestionHooks as hooks,
  type ChatQuestionItem,
  listAnswerLabels,
  readAnswerText,
} from './chat-question-model.js';
import { readQuestionText } from './chat-question-text.js';

/** What a summary says of one question's answer. */
function describeAnswer(
  item: ChatQuestionItem,
  answer: ChatQuestionAnswer | undefined,
  strings: UiStrings,
): string {
  if (item.selectionMode === 'none') {
    const text = readAnswerText(answer);
    return text ? strings.questionAnsweredText(text) : strings.questionNoAnswer;
  }
  const labels = answer ? listAnswerLabels(item, answer) : [];
  return labels.length > 0 ? strings.questionChose(labels) : strings.questionNoAnswer;
}

/** An answered card: each question's title with what the reader chose or wrote. */
export function QuestionSummary({
  questions,
  answers = [],
}: {
  questions: readonly ChatQuestionItem[];
  answers?: readonly ChatQuestionAnswer[] | undefined;
}) {
  const strings = useUiStrings();
  const titles = useMemo(
    () => questions.map((item) => readQuestionText(item.question).title),
    [questions],
  );
  return (
    <dl {...hooks.slot('summary')}>
      {questions.map((item, index) => (
        <div key={item.id} {...hooks.slot('summary-item')}>
          <dt {...hooks.slot('summary-question')}>{titles[index]}</dt>
          <dd {...hooks.slot('summary-answer')}>
            {describeAnswer(
              item,
              answers.find((answer) => answer.questionId === item.id),
              strings,
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A dismissed card: its first question's title and a short "Dismissed". */
export function QuestionDismissal({ title }: { title: ReactNode }) {
  const strings = useUiStrings();
  return (
    <>
      {title ? <div {...hooks.slot('question')}>{title}</div> : null}
      <p {...hooks.slot('status')}>{strings.questionDismissed}</p>
    </>
  );
}
