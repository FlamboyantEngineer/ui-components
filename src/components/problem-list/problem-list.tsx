import { useId, useSyncExternalStore } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { FieldSeverity } from '../field/field.js';
import { useFormProblems, type FormProblem, type FormProblemSource } from '../form/form.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import {
  ProblemItems,
  problemListHooks as hooks,
  type ProblemListItem,
  type ShownProblem,
} from './problem-list-items.js';

export type { ProblemListItem } from './problem-list-items.js';

export interface ProblemListProps extends BaseProps {
  /** The problems to list. Without them, a list inside a `Form` lists the problems its fields show. */
  problems?: readonly ProblemListItem[] | undefined;
  /** The heading. Defaults to the provider's `problems` string. */
  title?: string | undefined;
  /** Called with a problem's id when the reader picks it, after focus moves to its target. */
  onAction?: ((id: Key) => void) | undefined;
}

const noProblems: readonly FormProblem[] = [];
const noSource: FormProblemSource = { subscribe: () => () => {}, getProblems: () => noProblems };

/** A problem the caller gives, reaching the element its `targetId` names. */
function fromItem(item: ProblemListItem): ShownProblem {
  const { targetId } = item;
  return {
    ...item,
    severity: item.severity ?? 'error',
    focus: targetId ? () => document.getElementById(targetId)?.focus() : undefined,
  };
}

/** A problem a field inside the form shows, reaching the field's control. */
function fromForm(problem: FormProblem): ShownProblem {
  const { key, label, issue, focus } = problem;
  return { id: key, label, message: issue.message, severity: issue.severity, focus };
}

/** The worst severity among the problems, or `null` without any. */
function worstSeverity(problems: readonly ShownProblem[]): FieldSeverity | null {
  if (problems.some(({ severity }) => severity === 'error')) return 'error';
  return problems.length > 0 ? 'warning' : null;
}

/**
 * A summary of validation problems at the top of a form or document: a heading, the count of
 * errors and warnings in a polite live region, and each problem with its severity, the label of
 * its field and its message. Picking a problem moves focus to its field. Inside a `Form`, it lists
 * the problems the form's fields show and follows them as they change; it also lists the problems
 * a caller gives, such as a document's checks.
 */
export function ProblemList({
  problems,
  title,
  onAction,
  className,
  id,
  ...rest
}: ProblemListProps) {
  const strings = useUiStrings();
  const titleId = useId();
  const Heading = `h${useHeadingLevel(undefined)}` as const;
  const formSource = useFormProblems();
  const source = (problems === undefined ? formSource : null) ?? noSource;
  const collected = useSyncExternalStore(source.subscribe, source.getProblems, source.getProblems);
  const shown = problems === undefined ? collected.map(fromForm) : problems.map(fromItem);
  const errors = shown.filter(({ severity }) => severity === 'error').length;
  const data = { severity: worstSeverity(shown), empty: shown.length === 0 };
  return (
    <section {...hooks.root({ className, props: rest, data })} id={id} aria-labelledby={titleId}>
      <Heading {...hooks.slot('title')} id={titleId}>
        {title ?? strings.problems}
      </Heading>
      <p {...hooks.slot('summary')} role="status">
        {strings.problemCount(errors, shown.length - errors)}
      </p>
      {shown.length > 0 ? <ProblemItems problems={shown} onAction={onAction} /> : null}
    </section>
  );
}
