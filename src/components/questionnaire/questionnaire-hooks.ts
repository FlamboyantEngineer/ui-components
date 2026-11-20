'use client';

import { createContext } from 'react';
import { createHooks } from '../../core/hooks.js';

/** Whether a question has an answer, was passed over with Skip, or neither. */
export type QuestionnaireItemStatus = 'unanswered' | 'answered' | 'skipped';

/** The answers by question name: the values its choices and input submit, empty ones left out. */
export type QuestionnaireAnswers = Record<string, string[]>;

export const questionnaireHooks = createHooks('questionnaire', [
  'progress',
  'item',
  'title',
  'description',
  'choices',
  'choice',
  'input',
  'error',
  'actions',
  'previous',
  'skip',
  'next',
  'submit',
]);

/** The questionnaire as its parts read it. */
export interface QuestionnaireState {
  /** The questions show one at a time, in the order of `items`. */
  isStepping: boolean;
  /** The question shown while stepping. */
  currentKey: string | null;
  /** The shown question's position from 0, and how many there are. */
  position: number;
  count: number;
  statusOf: (name: string) => QuestionnaireItemStatus;
  isInvalid: (name: string) => boolean;
  isRequired: (name: string) => boolean;
  /** Re-reads the answers once a change to them has committed. */
  noteChange: () => void;
  goPrevious: () => void;
  goNext: () => void;
  skip: () => void;
  /** Next, or submits from the last question. */
  advance: () => void;
}

/** One question as its parts read it. */
export interface QuestionnaireItemState {
  name: string;
  titleId: string;
  isDisabled: boolean;
  isInvalid: boolean;
  isRequired: boolean;
  /** The ids of its description and its error, while they render. */
  descriptionId: string;
  errorId: string;
  /** Records that its description or error renders, so the question is described by them. */
  showPart: (part: 'description' | 'error', isShown: boolean) => void;
}

export const QuestionnaireContext = createContext<QuestionnaireState | null>(null);

export const QuestionnaireItemContext = createContext<QuestionnaireItemState | null>(null);

/** The questionnaire around a part, which every part needs. */
export function readQuestionnaire<T>(value: T | null, part: string): T {
  if (value === null) throw new Error(`${part} must be inside a Questionnaire and its item.`);
  return value;
}
