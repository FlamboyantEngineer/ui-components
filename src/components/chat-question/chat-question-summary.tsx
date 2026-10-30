'use client';

import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  chatQuestionHooks as hooks,
  listAnswerLabels,
  readAnswerText,
  type ChatQuestionAnswer,
  type ChatQuestionItem,
} from './chat-question-model.js';

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

/** An answered card: each question with what the reader chose or wrote. */
export function QuestionSummary({
  questions,
  answers = [],
}: {
  questions: readonly ChatQuestionItem[];
  answers?: readonly ChatQuestionAnswer[] | undefined;
}) {
  const strings = useUiStrings();
  return (
    <dl {...hooks.slot('summary')}>
      {questions.map((item) => (
        <div key={item.id} {...hooks.slot('summary-item')}>
          <dt {...hooks.slot('summary-question')}>{item.question}</dt>
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

/** A dismissed card: its first question and a short "Dismissed". */
export function QuestionDismissal({ question }: { question: string | undefined }) {
  const strings = useUiStrings();
  return (
    <>
      {question ? <p {...hooks.slot('question')}>{question}</p> : null}
      <p {...hooks.slot('status')}>{strings.questionDismissed}</p>
    </>
  );
}
