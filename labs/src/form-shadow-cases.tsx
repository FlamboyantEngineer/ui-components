// A form inside a web component's shadow root, whose native reset and form data stay inside it.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { FileUpload } from '../../src/components/file-upload/file-upload.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabOutput } from './lab-output.js';
import { ShadowRootApp } from './shadow-root-host.js';

const views = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
];

const attached = [{ id: 'sample', name: 'sample.txt', file: new File(['notes'], 'sample.txt') }];

/** Reads what the form submits: its view and the name of its attached file. */
function readForm(form: HTMLFormElement): string {
  const data = new FormData(form);
  const file = data.get('attachment');
  return `view=${String(data.get('view'))}; attachment=${file instanceof File ? file.name : 'none'}`;
}

/** The form inside the shadow root, which cancels its reset while Keep edits is on. */
function ShadowForm() {
  const [keepsEdits, setKeepsEdits] = useState(false);
  const [submitted, setSubmitted] = useState('none');
  return (
    <form
      aria-label="Shadow form"
      onReset={(event) => {
        if (keepsEdits) event.preventDefault();
      }}
    >
      <TextField label="Fruit" defaultValue="Fig" />
      <SegmentedChoice aria-label="View" name="view" options={views} defaultValue="day" />
      <FileUpload label="Attachment" name="attachment" files={attached} onSelect={() => {}} />
      <Switch isSelected={keepsEdits} onChange={setKeepsEdits}>
        Keep shadow edits
      </Switch>
      <Button type="reset">Reset</Button>
      <Button
        onPress={(event) => {
          const form = (event.target as HTMLElement).closest('form');
          if (form) setSubmitted(readForm(form));
        }}
      >
        Read form data
      </Button>
      <LabOutput name="Shadow form">{submitted}</LabOutput>
    </form>
  );
}

/** A form inside a web component's shadow root: its reset and form data never reach the document. */
export function ShadowFormCase() {
  return (
    <ShadowRootApp demo="shadow-form">
      <ShadowForm />
    </ShadowRootApp>
  );
}
