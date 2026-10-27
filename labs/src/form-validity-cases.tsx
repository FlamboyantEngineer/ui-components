// A form lab case: a Save action outside the submit that asks the form whether what its fields show
// can be saved, without revealing their validation, moving focus or submitting.

import { useState, useSyncExternalStore } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ColorField } from '../../src/components/color-field/color-field.js';
import { DateTimeField } from '../../src/components/date-time-field/date-time-field.js';
import { Form, useFormValidity, type FormValidity } from '../../src/components/form/form.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabOutput } from './lab-output.js';

const noBlockers: FormValidity['getBlockers'] = () => [];
const ignore = () => () => undefined;

/** The save bar: Save stores the values only while nothing blocks; Check shows what blocks. */
function SaveBar({ values }: { values: Record<string, unknown> }) {
  const validity = useFormValidity();
  const blockers = useSyncExternalStore(
    validity?.subscribe ?? ignore,
    validity?.getBlockers ?? noBlockers,
  );
  const [saved, setSaved] = useState('nothing yet');
  const save = () => {
    if (validity?.isBlocked()) setSaved('refused');
    else setSaved(JSON.stringify(values));
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <Button onPress={save}>Save</Button>
      <Button variant="secondary" onPress={() => validity?.validate()}>
        Check
      </Button>
      <LabOutput name="Blocking">
        {blockers.length === 0
          ? 'nothing'
          : blockers.map((blocker) => `${blocker.label} (${blocker.status})`).join(', ')}
      </LabOutput>
      <LabOutput name="Saved">{saved}</LabOutput>
    </div>
  );
}

/** A record edited in place and saved by a toolbar action rather than a submit. */
export function ExternalSave() {
  const [title, setTitle] = useState('Spring fair');
  const [day, setDay] = useState<string | null>('2026-04-13');
  const [colour, setColour] = useState<string | null>('#336699');
  return (
    <div data-lab-form="external-save">
      <Form aria-label="Event" validationMode="submit" onSubmit={(event) => event.preventDefault()}>
        <TextField label="Title" isRequired value={title} onChange={setTitle} />
        <DateTimeField label="Day" value={day} onChange={setDay} />
        <DateTimeField label="Stay" mode="date-range" />
        <ColorField label="Badge colour" allowsTyping value={colour} onChange={setColour} />
        <SaveBar values={{ title, day, colour }} />
      </Form>
    </div>
  );
}
