import type { MessageArguments } from './message-format.js';
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
  /** Names the tabs of a card's questions. */
  questionSteps: string;
  /** Stands in for the short label of a question that has none, by its position from 1. */
  questionStep: (position: number) => string;
  /** Where the reader is in a card's questions, as read out. */
  questionProgress: (position: number, count: number) => string;
  /** Where the reader is in a card's questions, as the counter after the tabs shows it. */
  questionCounter: (position: number, count: number) => string;
  /** Describes the tab of a question that has an answer. */
  questionAnsweredTab: string;
  /** Explains why Next is unavailable: the shown question has no answer yet. */
  questionAnswerToContinue: string;
  /** Explains why Submit is unavailable: a question has no answer yet. */
  questionAnswerAllToSubmit: string;
  /** Says the reader's answers did not reach the agent, when the failure gives no message. */
  questionSubmitFailed: string;
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

/** The message values each text function reads its arguments as. */
export const chatQuestionArguments: MessageArguments<ChatQuestionStrings> = {
  questionStep: (position) => ({ position }),
  questionProgress: (position, count) => ({ position, count }),
  questionCounter: (position, count) => ({ position, count }),
  questionPreview: (label) => ({ label }),
  questionAsked: (question, count) => ({ question, count }),
  questionChose: (answers) => ({ answers }),
  questionAnsweredText: (text) => ({ text }),
};
