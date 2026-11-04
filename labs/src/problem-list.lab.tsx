import { type FormEvent, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import {
  ProblemList,
  type ProblemListItem,
} from '../../src/components/problem-list/problem-list.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const contents = ['empty', 'errors', 'warnings', 'mixed'] as const;
const targets = ['plain', 'jump'] as const;

const errors: ProblemListItem[] = [
  { id: 1, label: 'Title', message: 'Add a title.' },
  { id: '1', label: 'Owner', message: 'Choose an owner.' },
];
const warnings: ProblemListItem[] = [
  { id: 'budget', label: 'Budget', message: 'The budget is unusually high.', severity: 'warning' },
];
const byContent: Record<(typeof contents)[number], ProblemListItem[]> = {
  empty: [],
  errors,
  warnings,
  mixed: [...errors, ...warnings, { id: 'links', message: 'Two links are broken.' }],
};

/** A form whose problem list fills on the first submit and empties as the fields are fixed. */
function EventForm() {
  const [sent, setSent] = useState('nothing');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSent(`${String(data.get('name'))} × ${String(data.get('seats'))}`);
  };
  return (
    <div style={{ width: 380 }}>
      <Form aria-label="Booking" onSubmit={submit} data-lab-form="booking">
        <ProblemList title="Fix these to book" />
        <TextField label="Name" name="name" isRequired />
        <TextField
          label="Email"
          name="email"
          validate={(value) =>
            value.includes('@')
              ? null
              : { severity: 'warning', message: 'Check the address; it has no @.' }
          }
        />
        <NumberField label="Seats" name="seats" isRequired minValue={1} maxValue={8} />
        <Button type="submit" variant="primary">
          Book
        </Button>
      </Form>
      <LabOutput name="booked">{sent}</LabOutput>
    </div>
  );
}

/** A document's checks, each moving focus to the section it is about. */
function DocumentChecks() {
  const [picked, setPicked] = useState<Key>('none');
  const checks: ProblemListItem[] = [
    { id: 'scope', label: 'Scope', message: 'Name the systems in scope.', targetId: 'doc-scope' },
    {
      id: 'risks',
      label: 'Risks',
      message: 'Two risks have no owner.',
      severity: 'warning',
      targetId: 'doc-risks',
    },
  ];
  return (
    <div style={{ width: 380 }} data-lab-document="checks">
      <ProblemList title="Checks before release" problems={checks} onAction={setPicked} />
      <h3 id="doc-scope" tabIndex={-1}>
        Scope
      </h3>
      <p>The release covers the ordering service.</p>
      <h3 id="doc-risks" tabIndex={-1}>
        Risks
      </h3>
      <p>Supplier delays; data migration.</p>
      <LabOutput name="picked">{String(picked)}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Contents"
      description="No problems, errors only, warnings only and a mix, as plain text or as buttons that report the problem picked."
    >
      <StateMatrix
        axes={{ content: contents, target: targets }}
        render={({ content, target }) => (
          <div style={{ width: 300 }}>
            <ProblemList
              // Each list is a named region, so the matrix names them apart; one keeps the default.
              title={
                content === 'empty' && target === 'plain' ? undefined : `${content}, ${target}`
              }
              problems={byContent[content]}
              onAction={target === 'jump' ? () => {} : undefined}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the severity bar sits on the start edge, on the right."
    >
      <div dir="rtl" style={{ width: 300 }} data-lab-demo="rtl">
        <ProblemList title="Problems, right to left" problems={errors} />
      </div>
    </LabSection>
    <LabSection
      title="With a form"
      description="Book without filling the form: the list collects the fields' problems, each moves focus to its field, and it empties as you fix them."
    >
      <EventForm />
    </LabSection>
    <LabSection
      title="Document checks"
      description="Problems a caller gives, each moving focus to the section it is about."
    >
      <DocumentChecks />
    </LabSection>
  </>,
);
