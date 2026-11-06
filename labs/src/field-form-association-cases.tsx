import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { TagsInput } from '../../src/components/tags-input/tags-input.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

/** A form whose fields sit in a side panel outside it, each naming it with `form`. */
function DetachedForm() {
  const [submitted, setSubmitted] = useState('');
  return (
    <div data-lab-demo="form-association">
      <form
        id="lab-detached-form"
        aria-label="Order"
        onSubmit={(event) => {
          event.preventDefault();
          const entries = [...new FormData(event.currentTarget).entries()];
          setSubmitted(entries.map(([name, value]) => `${name}=${String(value)}`).join(', '));
        }}
      >
        <Button type="submit">Submit order</Button> <Button type="reset">Reset order</Button>
      </form>
      <aside aria-label="Order details">
        <TextField
          label="Reference"
          name="reference"
          form="lab-detached-form"
          defaultValue="A-12"
          isRequired
          validationBehavior="native"
        />
        <TagsInput
          label="Items"
          name="item"
          form="lab-detached-form"
          defaultValue={['Pen', 'Pen']}
          allowsDuplicates
        />
        <NumberField
          range
          label="Delivery hours"
          startName="from"
          endName="to"
          form="lab-detached-form"
          maxValue={24}
          defaultValue={[9, 17]}
        />
      </aside>
      <output data-lab-output="form-association">{submitted}</output>
    </div>
  );
}

export function FieldFormAssociationSection() {
  return (
    <LabSection
      title="Form association"
      description="The fields sit in a panel outside the form and name it with form. Submit sends the reference, each item (repeated values included) and both delivery hours; Reset order puts the starting values back; an empty reference blocks the submit through native validation."
    >
      <DetachedForm />
    </LabSection>
  );
}
