import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import type { FieldSeverity } from '../field/field.js';
import { Icon } from '../icon/icon.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

/** A problem a problem list shows. */
export interface ProblemListItem {
  /** Unique among the list's problems. */
  id: Key;
  /** What is wrong. */
  message: string;
  /** Defaults to `error`. */
  severity?: FieldSeverity | undefined;
  /** The label of the field or part the problem is about. */
  label?: string | undefined;
  /** The id of the element focused when the reader picks the problem. */
  targetId?: string | undefined;
}

/** A problem as the list draws it, with the way to reach its field when it has one. */
export interface ShownProblem extends ProblemListItem {
  severity: FieldSeverity;
  /** Moves focus to the problem's field; without it the problem is plain text. */
  focus: (() => void) | undefined;
}

export const problemListHooks = createHooks('problem-list', [
  'title',
  'summary',
  'items',
  'item',
  'jump',
  'icon',
  'label',
  'message',
]);

const hooks = problemListHooks;

/** The glyph, the severity read aloud, the label and the message of one problem. */
function ProblemText({ problem }: { problem: ShownProblem }) {
  const strings = useUiStrings();
  return (
    <>
      <Icon glyph={problem.severity} className={hooks.slotClass('icon')} />
      <VisuallyHidden>{`${strings.problemSeverity(problem.severity)}: `}</VisuallyHidden>
      {problem.label ? <span {...hooks.slot('label')}>{problem.label}</span> : null}
      <span {...hooks.slot('message')}>{problem.message}</span>
    </>
  );
}

/** The problems, each a button that reaches its field when it can, else plain text. */
export function ProblemItems({
  problems,
  onAction,
}: {
  problems: readonly ShownProblem[];
  onAction: ((id: Key) => void) | undefined;
}) {
  return (
    <ul {...hooks.slot('items')}>
      {problems.map((problem) => (
        <li key={problem.id} {...hooks.slot('item', { severity: problem.severity })}>
          {problem.focus || onAction ? (
            <Button
              className={hooks.slotClass('jump')}
              variant="bare"
              onPress={() => {
                problem.focus?.();
                onAction?.(problem.id);
              }}
            >
              <ProblemText problem={problem} />
            </Button>
          ) : (
            <ProblemText problem={problem} />
          )}
        </li>
      ))}
    </ul>
  );
}
