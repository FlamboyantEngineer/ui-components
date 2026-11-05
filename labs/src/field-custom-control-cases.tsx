// Field cases for custom controls: the public control bridge, a value contract, own history,
// blur commits, previous values in each change layout, and errors for several form names.

import { type FormEvent, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  Field,
  type FieldChangeLayout,
  type FieldErrorSource,
  type FieldInputProps,
  FieldPreviousValue,
  toAriaControlProps,
  useFieldControl,
  useFieldState,
} from '../../src/components/field/field.js';
import { Form, type FormBlocker } from '../../src/components/form/form.js';
import { Switch } from '../../src/components/switch/switch.js';
import { PlusGlyph } from '../../src/core/glyphs.js';
import { StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

interface Reminder {
  isOn: boolean;
  minutes: number;
}

const noReminder: Reminder = { isOn: false, minutes: 15 };

/** Two reminders are the same when both are off, whatever minutes they kept, or when on alike. */
const isSameReminder = (left: Reminder, right: Reminder) =>
  left.isOn === right.isOn && (!left.isOn || left.minutes === right.minutes);

/** A reminder that is off holds nothing, so a required reminder must be on. */
const isReminderOff = (reminder: Reminder) => !reminder.isOn;

const describeReminder = (reminder: Reminder) =>
  reminder.isOn ? `on, ${reminder.minutes} min` : `off (${reminder.minutes} min kept)`;

/**
 * A composite control built the public way: `useFieldControl` makes its state from its props with
 * a value contract (`isEqual`, `isEmpty`), and `toAriaControlProps` hands the field's naming and
 * states to the library switch. The minutes input is a second part of the same field, which
 * commits on blur only once focus leaves the whole field (`commitOnBlur`), not when it moves
 * between the parts, to the field's menu or into the menu's popup.
 */
function ReminderField(props: FieldInputProps<Reminder>) {
  const { state, field } = useFieldControl(props, {
    initialValue: noReminder,
    emptyValue: noReminder,
    isEqual: isSameReminder,
    isEmpty: isReminderOff,
  });
  const { value } = state;
  return (
    <Field state={state} {...field} commitOnBlur>
      {(control) => (
        <span>
          <Switch
            {...toAriaControlProps(control)}
            isSelected={value.isOn}
            onChange={(isOn) => state.setValue({ ...value, isOn })}
          />{' '}
          <input
            type="number"
            aria-label="Minutes before"
            min={0}
            value={value.minutes}
            disabled={control.disabled}
            readOnly={control.readOnly}
            onChange={(event) => state.setValue({ ...value, minutes: Number(event.target.value) })}
          />
        </span>
      )}
    </Field>
  );
}

export function CustomControl() {
  const [reminder, setReminder] = useState<Reminder>(noReminder);
  const [commits, setCommits] = useState<string[]>([]);
  return (
    <div data-lab-demo="custom-control">
      <ReminderField
        label="Reminder"
        description="Off counts as empty; off with other minutes is still the same value."
        isRequired
        value={reminder}
        onChange={setReminder}
        onCommit={(next) => setCommits((list) => [...list, describeReminder(next)])}
        data-lab-field="reminder"
      />
      <LabOutput name="Reminder value">{describeReminder(reminder)}</LabOutput>
      <LabOutput name="Reminder commits">{commits.join(' | ') || 'none'}</LabOutput>
    </div>
  );
}

/**
 * A control that keeps its own undo history (`hasOwnHistory`): the field records none, so its
 * own undo stays unavailable, and the control's own button steps back through its history.
 */
export function OwnHistory() {
  const [history, setHistory] = useState<number[]>([]);
  const state = useFieldState<number>({ defaultValue: 0 }, { hasOwnHistory: true });
  const add = (step: number) => {
    setHistory((list) => [...list, state.value]);
    state.setValue(state.value + step);
    state.commit();
  };
  const undo = () => {
    const previous = history.at(-1);
    if (previous === undefined) return;
    setHistory((list) => list.slice(0, -1));
    state.setValue(previous);
    state.commit();
  };
  return (
    <div data-lab-demo="own-history">
      <Field state={state} label="Visitors">
        {(control) => <output {...control}>{state.value}</output>}
      </Field>
      <Button onPress={() => add(1)}>Add a visitor</Button>{' '}
      <Button onPress={undo} isDisabled={history.length === 0}>
        Step the tally back
      </Button>
      <LabOutput name="Field can undo">{String(state.canUndo)}</LabOutput>
      <LabOutput name="Tally history">{history.join(', ') || 'empty'}</LabOutput>
    </div>
  );
}

const layouts = ['inline', 'stacked', 'hidden'] as const satisfies readonly FieldChangeLayout[];
const markers = ['text', 'icon', 'locked'] as const;

/**
 * A colour field edited from Blue to Green, whose control marks the previous value with
 * `FieldPreviousValue`: plain text or an icon with its label, a restore button named by
 * `restoreLabel`, and a locked field whose restore is disabled. `changeLayout` places the marker
 * before the control or above it, or hides it, leaving the whole-field Restore.
 */
function PreviousColour({
  layout,
  marker,
}: {
  layout: FieldChangeLayout;
  marker: (typeof markers)[number];
}) {
  const [restored, setRestored] = useState(0);
  const [colour, setColour] = useState('Green');
  const state = useFieldState<string>({
    committedValue: 'Blue',
    value: colour,
    onChange: setColour,
    isReadOnly: marker === 'locked',
  });
  return (
    <>
      <Field state={state} label={`Colour, ${layout}, ${marker}`} changeLayout={layout}>
        {(control) => (
          <span>
            {state.isDirty || marker === 'locked' ? (
              <FieldPreviousValue
                restoreLabel="the earlier colour"
                isDisabled={marker === 'locked'}
                onRestore={() => {
                  setRestored((count) => count + 1);
                  state.restore();
                }}
              >
                {marker === 'icon' ? (
                  <>
                    <PlusGlyph aria-hidden /> Blue
                  </>
                ) : (
                  'Blue'
                )}
              </FieldPreviousValue>
            ) : null}
            <input
              {...control}
              value={state.value}
              onChange={(event) => state.setValue(event.target.value)}
            />
          </span>
        )}
      </Field>
      <LabOutput name={`Restored ${layout} ${marker}`}>{restored}</LabOutput>
    </>
  );
}

export function PreviousValues() {
  return (
    <StateMatrix
      axes={{ marker: markers, layout: layouts }}
      render={({ layout, marker }) => <PreviousColour layout={layout} marker={marker} />}
    />
  );
}

interface PriceRange {
  low: number;
  high: number;
}

const rangeSources: FieldErrorSource<PriceRange>[] = [
  { name: 'low', select: (range) => range.low },
  { name: 'high', select: (range) => range.high },
];

/**
 * One field over two submitted parts, `low` and `high`: a server error for either name shows on
 * the field until that part changes (`errorSources`). Text that is not a whole number stays in
 * its input as a draft issue (`setDraftIssue`) while the value keeps the last number accepted.
 */
function PriceRangeField() {
  const { state, field } = useFieldControl(
    { label: 'Price range', name: 'price' },
    { initialValue: { low: 10, high: 40 }, errorSources: rangeSources },
  );
  const [drafts, setDrafts] = useState<Record<keyof PriceRange, string | null>>({
    low: null,
    high: null,
  });
  const edit = (part: keyof PriceRange, text: string) => {
    const next = { ...drafts, [part]: /^\d+$/.test(text) ? null : text };
    setDrafts(next);
    if (next[part] === null) state.setValue({ ...state.value, [part]: Number(text) });
    state.setDraftIssue(
      next.low === null && next.high === null
        ? null
        : { severity: 'error', message: 'Enter whole numbers.' },
    );
  };
  return (
    <>
      <Field state={state} {...field}>
        {(control) => (
          <span>
            <input
              {...control}
              // The field's label names the pair; each input names its own part.
              aria-labelledby={undefined}
              aria-label="Lowest price"
              value={drafts.low ?? state.value.low}
              onChange={(event) => edit('low', event.target.value)}
            />{' '}
            <input
              aria-label="Highest price"
              value={drafts.high ?? state.value.high}
              onChange={(event) => edit('high', event.target.value)}
            />
            <input type="hidden" name="low" value={state.value.low} />
            <input type="hidden" name="high" value={state.value.high} />
          </span>
        )}
      </Field>
      <LabOutput name="Accepted range">{`${state.value.low} to ${state.value.high}`}</LabOutput>
    </>
  );
}

const serverErrors = {
  low: 'The lowest price is under the floor.',
  high: 'Too high for this shop.',
};

/** The range in a library `Form`: load the server's errors, then change one part at a time. */
export function ErrorSources() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blockers, setBlockers] = useState<readonly FormBlocker[]>([]);
  const [submitted, setSubmitted] = useState('not yet');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitted(`low=${String(data.get('low'))}, high=${String(data.get('high'))}`);
  };
  return (
    <div data-lab-demo="error-sources">
      <Form
        aria-label="Price form"
        validationErrors={errors}
        onValidityChange={setBlockers}
        onSubmit={submit}
      >
        <PriceRangeField />
        <Button type="submit" variant="primary">
          Submit prices
        </Button>
      </Form>
      <Button onPress={() => setErrors(serverErrors)}>Load server errors</Button>
      <LabOutput name="Price blockers">
        {blockers.map((blocker) => blocker.message ?? blocker.status).join(' | ') || 'none'}
      </LabOutput>
      <LabOutput name="Prices submitted">{submitted}</LabOutput>
    </div>
  );
}
