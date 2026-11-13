// The field base's behaviours, shown on a field of the lab's own type: changes tracked against a
// committed value with the restore button, help in a tooltip or in the menu only, decorations, a
// pending check, an owner's error, an asynchronous check, a custom message, the message in a
// tooltip, the replaced value stacked, compact density, each label layout, a plain input, the
// context menu with its custom entries and icons, validation on leaving and the browser's own
// validation. Each field lab renders it with its own sample values.

import { type Key, type ReactNode, useCallback, useState } from 'react';
import { Badge } from '../../src/components/badge/index.js';
import type {
  FieldChangeLayout,
  FieldDensity,
  FieldIssue,
  FieldIssues,
  FieldLabelLayout,
  FieldMenuEntry,
  FieldMenuIcons,
  FieldMessageDisplay,
  FieldValidation,
  FieldValidationBehavior,
  FieldValidationMode,
} from '../../src/components/field/index.js';
import { PlusGlyph } from '../../src/core/glyphs.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** The field base's props each case passes, beside the field's own. */
export interface FieldBehaviourProps<T> {
  label: string;
  value?: T | undefined;
  onChange?: ((value: T) => void) | undefined;
  defaultValue?: T | undefined;
  committedValue?: T | undefined;
  tracksChanges?: boolean | undefined;
  emptyValue?: T | undefined;
  onCommit?: ((value: T) => void) | undefined;
  validate?: ((value: T) => FieldIssues) | undefined;
  validateAsync?: ((value: T, signal: AbortSignal) => Promise<FieldIssues>) | undefined;
  validationDebounce?: number | undefined;
  validationMode?: FieldValidationMode | undefined;
  validationBehavior?: FieldValidationBehavior | undefined;
  isRequired?: boolean | undefined;
  isPending?: boolean | undefined;
  errorMessage?: string | undefined;
  description?: ReactNode;
  help?: ReactNode;
  showHelpButton?: boolean | undefined;
  showRestoreButton?: boolean | undefined;
  decoration?: ReactNode;
  labelLayout?: FieldLabelLayout | undefined;
  density?: FieldDensity | undefined;
  changeLayout?: FieldChangeLayout | undefined;
  messageDisplay?: FieldMessageDisplay | undefined;
  menu?: readonly FieldMenuEntry[] | undefined;
  menuIcons?: FieldMenuIcons | undefined;
  onMenuAction?: ((key: Key) => void) | undefined;
  renderMessage?:
    ((validation: FieldValidation, issues: readonly FieldIssue[]) => ReactNode) | undefined;
  onLeave?: (() => void) | undefined;
}

export interface FieldBehavioursProps<T> {
  /** The value the field was saved with. */
  committed: T;
  /** Another value, the edit a dirty field shows. */
  changed: T;
  /** The value the Clear action sets. */
  empty: T;
  /** A value the checks refuse. */
  refused: T;
  /** Whether a value is one the checks refuse. */
  isRefused: (value: T) => boolean;
  /** What a refused value is, for the descriptions. */
  refusedText: string;
  /** Renders the lab's field with the case's props. */
  render: (props: FieldBehaviourProps<T>) => ReactNode;
}

const MENU: FieldMenuEntry[] = [
  'clear',
  'reset',
  'set-default',
  'help',
  { type: 'separator', id: 'rule' },
  { id: 'copy', label: 'Copy value', icon: PlusGlyph },
];

const LABEL_LAYOUTS: FieldLabelLayout[] = [
  'label-control',
  'control-label',
  'label-colon-control',
  'control-only',
];

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

/** One case of the behaviours, named for the browser tests. */
function Case({ name, children }: { name: string; children: ReactNode }) {
  return <div data-lab-demo={`behaviour-${name}`}>{children}</div>;
}

/** A field whose value, held here, starts at the edit rather than the saved value: dirty. */
function Edited<T>({
  changed,
  props,
  render,
}: {
  changed: T;
  props: FieldBehaviourProps<T>;
  render: (props: FieldBehaviourProps<T>) => ReactNode;
}) {
  const [value, setValue] = useState(changed);
  return render({ ...props, value, onChange: setValue });
}

/** The field base's behaviours on the lab's field. */
export function FieldBehaviours<T>({
  committed,
  changed,
  empty,
  refused,
  isRefused,
  refusedText,
  render,
}: FieldBehavioursProps<T>) {
  const [committedLast, setCommittedLast] = useState('none');
  const [menuLast, setMenuLast] = useState('none');
  const [left, setLeft] = useState(0);
  const refuse = useCallback(
    (value: T): FieldIssues =>
      isRefused(value) ? { severity: 'error', message: `${refusedText} is not allowed` } : null,
    [isRefused, refusedText],
  );
  // The server check: refuses the same values, after a moment.
  const checkOnServer = useCallback(
    async (value: T, signal: AbortSignal): Promise<FieldIssues> => {
      await wait(400, signal);
      return isRefused(value)
        ? { severity: 'error', message: `The server refuses ${refusedText}` }
        : null;
    },
    [isRefused, refusedText],
  );
  return (
    <>
      <LabSection
        title="Field behaviours: changes"
        description="A saved value edited (dirty), with the restore button and the commit reported; the replaced value inline, stacked or hidden; and a plain input that tracks no changes."
      >
        <Case name="restore">
          <Edited
            changed={changed}
            render={render}
            props={{
              label: 'Saved value',
              committedValue: committed,
              showRestoreButton: true,
              onCommit: () => setCommittedLast('committed'),
            }}
          />
          <LabOutput name="commit">{committedLast}</LabOutput>
        </Case>
        <Case name="stacked">
          <Edited
            changed={changed}
            render={render}
            props={{
              label: 'Stacked change',
              committedValue: committed,
              changeLayout: 'stacked',
            }}
          />
        </Case>
        <Case name="hidden-change">
          <Edited
            changed={changed}
            render={render}
            props={{
              label: 'Hidden change',
              committedValue: committed,
              changeLayout: 'hidden',
            }}
          />
        </Case>
        <Case name="plain">
          {render({ label: 'Plain input', defaultValue: changed, tracksChanges: false })}
        </Case>
      </LabSection>
      <LabSection
        title="Field behaviours: help and marks"
        description="Help in a tooltip from the help button, or in the menu only; a decoration the host draws; compact density; and each label layout."
      >
        <Case name="help">
          {render({
            label: 'With help',
            defaultValue: committed,
            help: 'Help the field shows from its button and its menu.',
            decoration: <Badge tone="info">New</Badge>,
          })}
        </Case>
        <Case name="help-in-menu">
          {render({
            label: 'Help in the menu',
            defaultValue: committed,
            help: 'Only the context menu offers this help.',
            showHelpButton: false,
          })}
        </Case>
        <Case name="compact">
          {render({ label: 'Compact', defaultValue: committed, density: 'compact' })}
        </Case>
        {LABEL_LAYOUTS.map((layout) => (
          <Case key={layout} name={`layout-${layout}`}>
            {render({ label: `Layout ${layout}`, defaultValue: committed, labelLayout: layout })}
          </Case>
        ))}
      </LabSection>
      <LabSection
        title="Field behaviours: validation"
        description={`${refusedText} is refused: checked at once, by a slow server check, on leaving the field, or by the browser. The field may also be pending, carry its owner's error, word its own message or show the message in a tooltip.`}
      >
        <Case name="validate">
          {render({
            label: 'Checked at once',
            defaultValue: refused,
            validate: refuse,
            renderMessage: (validation, issues) =>
              validation.message ? `${String(issues.length)} issue: ${validation.message}` : null,
          })}
        </Case>
        <Case name="async">
          {render({
            label: 'Checked by the server',
            defaultValue: committed,
            validateAsync: checkOnServer,
            validationDebounce: 300,
          })}
        </Case>
        <Case name="on-leave">
          {render({
            label: 'Checked on leaving',
            defaultValue: committed,
            validate: refuse,
            validationMode: 'blur',
            onLeave: () => setLeft((count) => count + 1),
          })}
          <LabOutput name="left">{String(left)}</LabOutput>
        </Case>
        <Case name="native">
          {render({
            label: 'Browser validation',
            isRequired: true,
            validationBehavior: 'native',
          })}
        </Case>
        <Case name="pending">
          {render({ label: 'Pending', defaultValue: committed, isPending: true })}
        </Case>
        <Case name="owner-error">
          {render({
            label: "Owner's error",
            defaultValue: committed,
            errorMessage: 'Another record uses this value',
          })}
        </Case>
        <Case name="tooltip">
          {render({
            label: 'Message in a tooltip',
            defaultValue: committed,
            errorMessage: 'Shown while the field is focused or hovered',
            messageDisplay: 'tooltip',
          })}
        </Case>
      </LabSection>
      <LabSection
        title="Field behaviours: menu"
        description="The context menu (right-click, Shift+F10): Clear, Reset, Set to default, Help and a host entry, with Reset's icon removed; the chosen entry is reported."
      >
        <Case name="menu">
          <Edited
            changed={changed}
            render={render}
            props={{
              label: 'With a menu',
              committedValue: committed,
              emptyValue: empty,
              help: 'Help from the menu.',
              menu: MENU,
              menuIcons: { reset: null },
              onMenuAction: (key) => setMenuLast(String(key)),
            }}
          />
          <LabOutput name="menu">{menuLast}</LabOutput>
        </Case>
      </LabSection>
    </>
  );
}
