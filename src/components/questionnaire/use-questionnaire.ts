'use client';

import { type FormEvent, useLayoutEffect, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { containsFocus } from '../../utils/composed-focus.js';
import {
  type QuestionnaireAnswers,
  questionnaireHooks as hooks,
  type QuestionnaireState,
} from './questionnaire-hooks.js';

interface QuestionnaireOptions {
  items: readonly string[] | undefined;
  currentKey: string | undefined;
  defaultCurrentKey: string | undefined;
  onCurrentKeyChange: ((key: string) => void) | undefined;
  onSubmit: ((answers: QuestionnaireAnswers) => void) | undefined;
  /** The answers kept outside the form (controlled), read instead of its controls. */
  answers: QuestionnaireAnswers | undefined;
  isReadOnly: boolean;
}

/** What the form's questions hold now: which are answered and which are required. */
interface Snapshot {
  answered: ReadonlySet<string>;
  required: ReadonlySet<string>;
}

const emptySnapshot: Snapshot = { answered: new Set(), required: new Set() };

function readItems(form: HTMLFormElement | null) {
  return Array.from(
    form?.querySelectorAll<HTMLFieldSetElement>(`.${hooks.slotClass('item')}`) ?? [],
  );
}

/** The non-empty values each question submits, by name: from `given` when the caller keeps them. */
function readAnswers(
  form: HTMLFormElement | null,
  given: QuestionnaireAnswers | undefined,
): QuestionnaireAnswers {
  const data = form && !given ? new FormData(form) : null;
  const answers: QuestionnaireAnswers = {};
  for (const item of readItems(form)) {
    const values: unknown[] = given ? (given[item.name] ?? []) : (data?.getAll(item.name) ?? []);
    answers[item.name] = values
      .filter((value): value is string => typeof value === 'string')
      .filter((value) => value.trim() !== '');
  }
  return answers;
}

function readSnapshot(
  form: HTMLFormElement | null,
  given: QuestionnaireAnswers | undefined,
): Snapshot {
  const answers = readAnswers(form, given);
  return {
    answered: new Set(Object.keys(answers).filter((name) => (answers[name] ?? []).length > 0)),
    required: new Set(
      readItems(form)
        .filter((item) => item.hasAttribute('data-required'))
        .map((item) => item.name),
    ),
  };
}

function isSameSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  return a.size === b.size && [...a].every((name) => b.has(name));
}

/**
 * Moves focus to a question's answer: its chosen radio, else its first control, else itself. Focus
 * already in the question stays where it is, such as in the field the reader pressed Enter in.
 */
function focusItem(form: HTMLFormElement | null, name: string | null) {
  const item = readItems(form).find((candidate) => candidate.name === name);
  if (containsFocus(item)) return;
  const control =
    item?.querySelector<HTMLInputElement>('input[type="radio"]:checked:not(:disabled)') ??
    item?.querySelector<HTMLInputElement>('input:not([type="hidden"]):not(:disabled)');
  (control ?? item)?.focus();
}

/** Re-reads the questions after every render and on every change, keeping the last equal read. */
function useSnapshot(given: QuestionnaireAnswers | undefined) {
  const formRef = useRef<HTMLFormElement>(null);
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  // Bumped on each change to the answers: the next commit re-reads them.
  const [, setChanges] = useState(0);
  const noteChange = () => setChanges((count) => count + 1);
  const refresh = () => {
    const next = readSnapshot(formRef.current, given);
    setSnapshot((shown) =>
      isSameSet(shown.answered, next.answered) && isSameSet(shown.required, next.required)
        ? shown
        : next,
    );
    return next;
  };
  // The answers live in the form's controls, which only the committed DOM shows; an equal read
  // keeps the shown state, so this settles after one pass.

  useLayoutEffect(() => void refresh());
  return { formRef, snapshot, refresh, noteChange };
}

/**
 * The questionnaire's state: the shown question while stepping through `items`, which questions
 * are answered, required, skipped or invalid, and the steps that move between them. Next and Submit
 * stop at a required question without an answer and mark it invalid.
 */
export function useQuestionnaire(options: QuestionnaireOptions) {
  const items = options.items ?? null;
  const { formRef, snapshot, refresh, noteChange } = useSnapshot(options.answers);
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(() => new Set());
  const [marked, setMarked] = useState<ReadonlySet<string>>(() => new Set());
  const [current, setCurrent] = useControllableState<string | undefined>(
    options.currentKey,
    options.defaultCurrentKey,
    (key) => key !== undefined && options.onCurrentKeyChange?.(key),
  );
  const found = items && current !== undefined ? items.indexOf(current) : -1;
  const position = Math.max(found, 0);
  const currentKey = items?.[position] ?? null;
  const count = items?.length ?? 0;
  const movedFocus = useRef(false);
  useLayoutEffect(() => {
    if (!movedFocus.current) return;
    movedFocus.current = false;
    focusItem(formRef.current, currentKey);
  }, [currentKey, formRef]);
  const goTo = (index: number) => {
    const key = items?.[index];
    if (key === undefined) return;
    movedFocus.current = true;
    setCurrent(key);
  };
  const mark = (names: readonly string[]) => setMarked((shown) => new Set([...shown, ...names]));
  const missing = (read: Snapshot, names: readonly string[]) =>
    names.filter((name) => read.required.has(name) && !read.answered.has(name));
  const goNext = () => {
    if (currentKey === null) return;
    const unanswered = missing(refresh(), [currentKey]);
    if (unanswered.length > 0) {
      mark(unanswered);
      focusItem(formRef.current, currentKey);
    } else goTo(position + 1);
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items && position < count - 1) return goNext();
    const read = refresh();
    const unanswered = missing(read, [...read.required]);
    const first = readItems(formRef.current).find((item) => unanswered.includes(item.name));
    if (!first) return options.onSubmit?.(readAnswers(formRef.current, options.answers));
    mark(unanswered);
    if (items?.includes(first.name)) goTo(items.indexOf(first.name));
    focusItem(formRef.current, first.name);
  };
  const state: QuestionnaireState = {
    isStepping: items !== null,
    isReadOnly: options.isReadOnly,
    currentKey,
    position,
    count,
    statusOf: (name: string) =>
      snapshot.answered.has(name) ? 'answered' : skipped.has(name) ? 'skipped' : 'unanswered',
    isInvalid: (name: string) => marked.has(name) && !snapshot.answered.has(name),
    isRequired: (name: string) => snapshot.required.has(name),
    noteChange,
    goPrevious: () => goTo(position - 1),
    goNext,
    skip: () => {
      if (currentKey !== null) setSkipped((shown) => new Set(shown).add(currentKey));
      goTo(position + 1);
    },
    advance: () => (items && position < count - 1 ? goNext() : formRef.current?.requestSubmit()),
  };
  return { formRef, state, onSubmit };
}
