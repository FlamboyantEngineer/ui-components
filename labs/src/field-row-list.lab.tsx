import { type CSSProperties, useState } from 'react';
import { FieldRowList } from '../../src/components/field-row-list/index.js';
import { NumberField } from '../../src/components/number-field/index.js';
import { SelectField, type SelectFieldOption } from '../../src/components/select-field/index.js';
import { Switch } from '../../src/components/switch/index.js';
import { TextField } from '../../src/components/text-field/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

/** A step of a generic test sequence: its kind chooses which number it holds. */
interface SequenceStep {
  id: string;
  kind: StepKind;
  amount: number | null;
}

type StepKind = 'hold' | 'ramp' | 'repeat';

/** Each kind's numeric field: its label, bounds and step. */
const kinds: Record<StepKind, { label: string; min: number; max: number; step: number }> = {
  hold: { label: 'Duration (s)', min: 0.1, max: 600, step: 0.1 },
  ramp: { label: 'Target (%)', min: 0, max: 100, step: 1 },
  repeat: { label: 'Count', min: 1, max: 20, step: 1 },
};

const kindOptions: SelectFieldOption[] = [
  { id: 'hold', label: 'Hold' },
  { id: 'ramp', label: 'Ramp' },
  { id: 'repeat', label: 'Repeat' },
];

const defaultAmounts: Record<StepKind, number> = { hold: 5, ramp: 50, repeat: 3 };

const sequence: SequenceStep[] = [
  { id: 'warm-up', kind: 'hold', amount: 30 },
  { id: 'rise', kind: 'ramp', amount: 80 },
  { id: 'cycle', kind: 'repeat', amount: 4 },
];

interface Label {
  id: string;
  name: string;
}

const labels: Label[] = [
  { id: 'north', name: 'North' },
  { id: 'south', name: 'South' },
];

const column: CSSProperties = { width: 520 };

function StepFields({
  step,
  isDisabled,
  onChange,
}: {
  step: SequenceStep;
  isDisabled: boolean;
  onChange: (step: SequenceStep) => void;
}) {
  const field = kinds[step.kind];
  return (
    <>
      <SelectField
        label="Kind"
        options={kindOptions}
        value={step.kind}
        isDisabled={isDisabled}
        onChange={(kind) => {
          if (kind === null || kind === step.kind) return;
          const next = kind as StepKind;
          onChange({ ...step, kind: next, amount: defaultAmounts[next] });
        }}
      />
      <NumberField
        // A new kind is a new field: its bounds and validation start over.
        key={step.kind}
        label={field.label}
        description={`${field.min} to ${field.max}`}
        minValue={field.min}
        maxValue={field.max}
        step={field.step}
        commitBehavior="validate"
        value={step.amount}
        isDisabled={isDisabled}
        onChange={(amount) => onChange({ ...step, amount })}
      />
    </>
  );
}

/** The caller side: owns the steps, applies adds and removes and makes ids. */
function SequenceEditor({
  initial = sequence,
  isDisabled = false,
  name,
  demo,
}: {
  initial?: readonly SequenceStep[];
  isDisabled?: boolean;
  name: string;
  demo?: string;
}) {
  const [steps, setSteps] = useState<readonly SequenceStep[]>(initial);
  const [next, setNext] = useState(1);
  return (
    <div style={column} data-lab-demo={demo}>
      <FieldRowList
        aria-label={name}
        rows={steps}
        minRows={1}
        maxRows={5}
        addLabel="Add step"
        isDisabled={isDisabled}
        onAdd={() => {
          setSteps([...steps, { id: `step-${next}`, kind: 'hold', amount: defaultAmounts.hold }]);
          setNext(next + 1);
        }}
        onRemove={(id) => setSteps(steps.filter((step) => step.id !== id))}
        renderRow={(step, context) => (
          <StepFields
            step={step}
            isDisabled={context.isDisabled}
            onChange={(changed) =>
              setSteps(steps.map((item) => (item.id === changed.id ? changed : item)))
            }
          />
        )}
      />
      {demo ? <pre data-lab-value>{JSON.stringify(steps, null, 1)}</pre> : null}
    </div>
  );
}

function DisabledDemo() {
  const [isDisabled, setDisabled] = useState(true);
  return (
    <div data-lab-demo="disabled">
      <Switch isSelected={isDisabled} onChange={setDisabled}>
        Disable the sequence
      </Switch>
      <SequenceEditor name="Locked sequence" isDisabled={isDisabled} />
    </div>
  );
}

const states = {
  empty: { rows: [] as readonly Label[], min: 0, max: undefined, disabled: false },
  filled: { rows: labels, min: 0, max: undefined, disabled: false },
  'at minimum': { rows: labels, min: 2, max: undefined, disabled: false },
  'at maximum': { rows: labels, min: 0, max: 2, disabled: false },
  disabled: { rows: labels, min: 0, max: undefined, disabled: true },
} as const;

mountLab(
  <>
    <LabSection
      title="States"
      description="No rows, rows, rows at the minimum (remove disabled) and at the maximum (add disabled), and a disabled list whose fields keep their values. The buttons only ask; these lists do not change."
    >
      <StateMatrix
        axes={{ state: Object.keys(states) as Array<keyof typeof states> }}
        render={({ state }) => (
          <div style={{ width: 360 }}>
            <FieldRowList
              aria-label={`Labels, ${state}`}
              rows={states[state].rows}
              minRows={states[state].min}
              maxRows={states[state].max}
              isDisabled={states[state].disabled}
              onAdd={() => {}}
              onRemove={() => {}}
              renderRow={(row) => (
                <TextField label="Name" labelLayout="control-only" defaultValue={row.name} />
              )}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Typed rows"
      description="Each step's kind chooses its numeric field: Hold takes a duration, Ramp a target percentage and Repeat a count, each with its own bounds, and a value outside them is reported. The caller applies every add and remove; the sequence keeps one to five steps, and focus follows the added step or the one that takes a removed step's place."
    >
      <SequenceEditor name="Test sequence" demo="typed" />
    </LabSection>
    <LabSection
      title="Disabled"
      description="Disabling the list disables its buttons and every field in its rows through its fieldset; the values stay visible. Turn the switch off to edit again."
    >
      <DisabledDemo />
    </LabSection>
    <LabSection
      title="Visible legend"
      description="A legend names the list and shows above it, as on any fieldset. Without add and remove callbacks the list has no buttons."
    >
      <div style={column}>
        <FieldRowList
          legend="Channels"
          rows={labels}
          renderRow={(row) => (
            <TextField label="Channel" labelLayout="control-only" defaultValue={row.name} />
          )}
        />
      </div>
    </LabSection>
  </>,
);
