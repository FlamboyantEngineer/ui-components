import { useCallback, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type { FieldIssue, FieldValidation } from '../../src/components/field/field.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const sizes = [
  { id: 'small', label: 'Small' },
  { id: 'large', label: 'Large' },
];

/** Every issue, one per line. */
function listIssues(_validation: FieldValidation, issues: readonly FieldIssue[]) {
  return (
    <ul>
      {issues.map((issue) => (
        <li key={issue.message}>{issue.message}</li>
      ))}
    </ul>
  );
}

/** A code with several rules, so it can break one or more of them at once. */
function codeIssues(value: string): FieldIssue[] {
  return [
    ...(value.length < 4
      ? [{ severity: 'error' as const, message: 'Use 4 characters or more.' }]
      : []),
    ...(/\s/.test(value) ? [{ severity: 'error' as const, message: 'No spaces.' }] : []),
    ...(/[a-z]/.test(value)
      ? [{ severity: 'warning' as const, message: 'Capitals read better.' }]
      : []),
  ];
}

const taken = new Set(['ADA', 'GRACE']);

/** Fields of several kinds with errors in tooltips, beside a row that must never move. */
function TooltipFields() {
  const [hasErrors, setHasErrors] = useState(false);
  const checkName = useCallback(async (value: string, signal: AbortSignal) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    signal.throwIfAborted();
    return taken.has(value.toUpperCase())
      ? [{ severity: 'error' as const, message: 'That name is taken.' }]
      : [];
  }, []);
  const forced = hasErrors
    ? { severity: 'error' as const, message: 'Fix this before saving.' }
    : null;
  return (
    <Stack space="sm">
      <Cluster space="sm" align="start" data-lab-tooltip-row>
        <TextField
          label="Code"
          defaultValue="ab c"
          messageDisplay="tooltip"
          validate={codeIssues}
          renderMessage={listIssues}
          data-lab-field="tooltip-code"
        />
        <TextField
          label="Handle"
          description="Ada and Grace are taken; the check takes a moment."
          defaultValue="Ada"
          messageDisplay="tooltip"
          validateAsync={checkName}
          data-lab-field="tooltip-async"
        />
        <NumberField
          label="Quantity"
          defaultValue={3}
          messageDisplay="tooltip"
          validate={(value) =>
            forced ??
            (value !== null && value > 5 ? { severity: 'error', message: 'At most 5.' } : null)
          }
          data-lab-field="tooltip-number"
        />
        <SelectField
          label="Size"
          options={sizes}
          defaultValue="small"
          messageDisplay="tooltip"
          validate={() => forced}
          data-lab-field="tooltip-select"
        />
      </Cluster>
      <div data-lab-below-row>The row above keeps its height as errors come and go.</div>
      <Button onPress={() => setHasErrors((on) => !on)}>
        {hasErrors ? 'Clear errors' : 'Show errors'}
      </Button>
      <LabOutput name="Forced errors">{hasErrors ? 'on' : 'off'}</LabOutput>
    </Stack>
  );
}

export function TooltipMessagesSection() {
  return (
    <LabSection
      title="Messages in tooltips"
      description="With messageDisplay set to tooltip, every message stays out of the layout: the field still turns invalid and its control is still described and announced, and the message shows in a tooltip while the field is focused (Tab to it, or tap it on touch) or hovered. Escape hides it. Type in Code to move between valid, one error and several issues; Handle checks asynchronously; Show errors adds an error to the number and select fields. Unlike compact density, nothing below moves."
    >
      <TooltipFields />
    </LabSection>
  );
}
