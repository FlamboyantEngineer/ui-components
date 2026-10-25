/** Strings of the cards in which an agent asks the reader questions in a chat. */
export interface ChatQuestionStrings {
  /** Sends the reader's answers to an agent's questions. */
  questionSubmit: string;
  /** The choice that answers a question in the reader's own words. */
  questionOther: string;
  /** Names the field that holds the reader's own words once they choose Other. */
  questionOtherAnswer: string;
  /** The hint inside an empty answer field. */
  questionAnswerPlaceholder: string;
  /** Marks the option the agent recommends. */
  questionRecommended: string;
  /** Names the list of a card's questions. */
  questionSteps: string;
  /** Stands in for the short label of a question that has none, by its position from 1. */
  questionStep: (position: number) => string;
  /** Where the reader is in a card that asks its questions one at a time. */
  questionProgress: (position: number, count: number) => string;
  /** Explains why Next is unavailable: the shown question has no answer yet. */
  questionAnswerToContinue: string;
  /** Explains why Submit is unavailable: a question has no answer yet. */
  questionAnswerAllToSubmit: string;
  /** Names the preview of an option, by the option's label. */
  questionPreview: (label: string) => string;
  /** Announces a new card by its first question and how many questions it asks. */
  questionAsked: (question: string, count: number) => string;
  /** Sums up a choice: the labels chosen, then any words given for Other. */
  questionChose: (answers: readonly string[]) => string;
  /** Sums up an answer given in the reader's own words. */
  questionAnsweredText: (text: string) => string;
  /** Stands in for the answer of a question left unanswered. */
  questionNoAnswer: string;
  /** Marks a card the reader dismissed without answering. */
  questionDismissed: string;
}

/** `A`, `A and B`, `A, B and C`. */
function joinAnswers(answers: readonly string[]): string {
  if (answers.length < 2) return answers.join('');
  return `${answers.slice(0, -1).join(', ')} and ${answers.at(-1)}`;
}

export const chatQuestionStrings: ChatQuestionStrings = {
  questionSubmit: 'Submit',
  questionOther: 'Other',
  questionOtherAnswer: 'Other answer',
  questionAnswerPlaceholder: 'Type your answer',
  questionRecommended: 'Recommended',
  questionSteps: 'Questions',
  questionStep: (position) => `Question ${position}`,
  questionProgress: (position, count) => `Question ${position} of ${count}`,
  questionAnswerToContinue: 'Answer this question to continue.',
  questionAnswerAllToSubmit: 'Answer every question to submit.',
  questionPreview: (label) => `Preview of ${label}`,
  questionAsked: (question, count) =>
    count === 1 ? `Question: ${question}` : `${count} questions: ${question}`,
  questionChose: (answers) => `You chose ${joinAnswers(answers)}`,
  questionAnsweredText: (text) => `You answered: ${text}`,
  questionNoAnswer: 'No answer',
  questionDismissed: 'Dismissed',
};
