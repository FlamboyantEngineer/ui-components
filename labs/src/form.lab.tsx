import { useRef, useState, type FormEvent } from 'react';
import { BooleanField } from '../../src/components/boolean-field/boolean-field.js';
import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Combobox } from '../../src/components/combobox/combobox.js';
import { ChoiceGroup, Choice } from '../../src/components/choice-group/choice-group.js';
import { Fieldset, type FieldValidationMode } from '../../src/components/field/field.js';
import { Form } from '../../src/components/form/form.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { ColorField } from '../../src/components/color-field/color-field.js';
import { DateTimeField } from '../../src/components/date-time-field/date-time-field.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { ExternalSave } from './form-validity-cases.js';
import { LabOutput } from './lab-output.js';

const modes = [
  'immediate',
  'change',
  'blur',
  'submit',
] as const satisfies readonly FieldValidationMode[];

const courses = [
  { value: 'starter', label: 'Starter' },
  { value: 'main', label: 'Main' },
  { value: 'dessert', label: 'Dessert' },
];

/** The submitted entries, as `name=value` pairs. */
function readEntries(event: FormEvent<HTMLFormElement>): string {
  event.preventDefault();
  const entries = [...new FormData(event.currentTarget).entries()];
  return entries.map(([name, value]) => `${name}=${String(value)}`).join(', ') || 'nothing';
}

/** Every field is required: a submit shows their messages and focuses the first invalid one. */
function Booking() {
  const [submitted, setSubmitted] = useState('none');
  return (
    <Form
      aria-label="Booking"
      method="post"
      validationBehavior="aria"
      onSubmit={(event) => setSubmitted(readEntries(event))}
      data-lab-form="booking"
    >
      <TextField label="Name" name="name" isRequired />
      <NumberField
        label="Guests"
        name="guests"
        isRequired
        minValue={1}
        maxValue={8}
        commitBehavior="validate"
      />
      <ChoiceGroup selectionMode="multiple" label="Courses" name="courses" isRequired>
        {courses.map((option) => (
          <Choice key={option.value} value={option.value}>
            {option.label}
          </Choice>
        ))}
      </ChoiceGroup>
      <BooleanField
        label="Accept the house rules"
        name="rules"
        validate={(value) =>
          value === true ? null : { severity: 'error', message: 'Accept the house rules to book.' }
        }
      />
      <Button type="submit" variant="primary">
        Book
      </Button>
      <LabOutput name="Booking">{submitted}</LabOutput>
    </Form>
  );
}

/** The server rejects the name ada; its error shows until the name changes. */
function SignUp() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('none');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('username'));
    const isTaken = name.trim().toLowerCase() === 'ada';
    setErrors(isTaken ? { username: 'This username is taken.' } : {});
    setStatus(isTaken ? 'rejected' : `created ${name}`);
  };
  return (
    <Form
      aria-label="Sign up"
      validationBehavior="aria"
      validationErrors={errors}
      onSubmit={submit}
    >
      <TextField
        label="Username"
        name="username"
        isRequired
        description="The server says ada is taken."
        data-lab-field="username"
      />
      <Button type="submit">Sign up</Button>
      <LabOutput name="Sign up">{status}</LabOutput>
    </Form>
  );
}

/** The browser's constraint validation blocks the submit; the fields show their own messages. */
function Newsletter() {
  const [submitted, setSubmitted] = useState('none');
  return (
    <Form aria-label="Newsletter" onSubmit={(event) => setSubmitted(readEntries(event))}>
      <TextField label="Email" name="email" type="email" isRequired data-lab-field="email" />
      <Button type="submit">Subscribe</Button>
      <LabOutput name="Newsletter">{submitted}</LabOutput>
    </Form>
  );
}

/** Picking up in store disables the address fieldset, whose fields then never block. */
function Delivery() {
  const [isPickup, setIsPickup] = useState(false);
  const [submitted, setSubmitted] = useState('none');
  return (
    <Form
      aria-label="Delivery"
      validationBehavior="aria"
      onSubmit={(event) => setSubmitted(readEntries(event))}
    >
      <Switch isSelected={isPickup} onChange={setIsPickup}>
        Pick up in store
      </Switch>
      <Fieldset legend="Delivery address" isDisabled={isPickup} data-lab-field="address">
        <TextField label="Street" name="street" isRequired />
        <TextField label="City" name="city" isRequired />
        <SegmentedChoice
          aria-label="Delivery window"
          defaultValue="morning"
          options={[
            { value: 'morning', label: 'Morning' },
            { value: 'evening', label: 'Evening' },
          ]}
        />
        <Switch>Leave at the door</Switch>
      </Fieldset>
      <Button type="submit">Continue</Button>
      <LabOutput name="Delivery">{submitted}</LabOutput>
    </Form>
  );
}

/** Reset asks first: while "Keep edits" is on, the form cancels the reset and nothing changes. */
const spices = [
  { id: 'cumin', label: 'Cumin' },
  { id: 'paprika', label: 'Paprika' },
  { id: 'saffron', label: 'Saffron' },
];

function ConfirmedReset() {
  const [keepsEdits, setKeepsEdits] = useState(true);
  const [resets, setResets] = useState('none');
  return (
    <>
      <Switch isSelected={keepsEdits} onChange={setKeepsEdits}>
        Keep edits
      </Switch>
      <form
        aria-label="Pantry"
        onReset={(event) => {
          if (keepsEdits) event.preventDefault();
          setResets(keepsEdits ? 'cancelled' : 'done');
        }}
      >
        <TextField label="Shelf" name="shelf" defaultValue="Spices" data-lab-field="shelf" />
        <NumberField label="Jars" name="jars" defaultValue={12} data-lab-field="jars" />
        <SearchField label="Label" name="label" defaultValue="Cumin" data-lab-field="label" />
        <Combobox
          label="Spice"
          name="spice"
          defaultItems={spices}
          defaultValue="cumin"
          data-lab-field="spice"
        />
        <DateTimeField label="Best before" name="best-before" data-lab-field="best-before" />
        <ColorField
          label="Lid colour"
          name="lid"
          allowsTyping
          defaultValue="#336699"
          data-lab-field="lid"
        />
        <Checkbox name="sealed" defaultSelected data-lab-field="sealed">
          Sealed
        </Checkbox>
        <Switch name="labelled" data-lab-field="labelled">
          Labelled
        </Switch>
        <Button type="reset">Reset</Button>
        <LabOutput name="Reset">{resets}</LabOutput>
      </form>
    </>
  );
}

/** A button outside the form submits it through the form's ref, with the same validation. */
function OutsideSubmit() {
  const form = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState('none');
  return (
    <>
      <Form
        aria-label="Note"
        ref={form}
        validationBehavior="aria"
        onSubmit={(event) => setSubmitted(readEntries(event))}
      >
        <TextField label="Note" name="note" isRequired data-lab-field="note" />
      </Form>
      <Button onPress={() => form.current?.requestSubmit()}>Submit from outside</Button>
      <LabOutput name="Note">{submitted}</LabOutput>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Submit validation"
      description="Book with empty fields: every field shows its message and the first invalid one takes focus."
    >
      <Booking />
    </LabSection>
    <LabSection
      title="Validation modes"
      description="The form's mode decides when a required field shows its message: at once, after an edit, after leaving it, or after a submit."
    >
      <StateMatrix
        axes={{ mode: modes }}
        render={({ mode }) => (
          <Form
            aria-label={`City, ${mode}`}
            validationMode={mode}
            validationBehavior="aria"
            onSubmit={(event) => event.preventDefault()}
          >
            <TextField label="City" isRequired />
            <Button type="submit">Check</Button>
          </Form>
        )}
      />
    </LabSection>
    <LabSection title="Server errors" description="Submit ada, then edit the name.">
      <SignUp />
    </LabSection>
    <LabSection
      title="Native validation"
      description="The browser blocks the submit through the field's custom validity, and checks the email format itself."
    >
      <Newsletter />
    </LabSection>
    <LabSection
      title="Fieldset"
      description="A fieldset groups fields and disables them together, with the other controls inside."
    >
      <Delivery />
    </LabSection>
    <LabSection
      title="Cancelled reset"
      description="Edit the fields (a date typed in part, a typed colour), the search, the combobox, the checkbox and the switch, then press Reset: while Keep edits is on, the form cancels the reset and the edits stay; switch it off and Reset puts the first values back."
    >
      <ConfirmedReset />
    </LabSection>
    <LabSection
      title="Submitting from outside"
      description="The form's ref lets a button outside it submit it, as a dialog's footer action does."
    >
      <OutsideSubmit />
    </LabSection>
    <LabSection
      title="Saving from a toolbar"
      description="Save asks the form whether what its fields show can be saved, without showing their validation: a date typed in part, a range with one end empty or a colour that does not read refuses it. Check shows every message and focuses the first."
    >
      <ExternalSave />
    </LabSection>
  </>,
);
