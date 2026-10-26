import { useState, type FormEvent } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import { PinInput, type PinInputType } from '../../src/components/pin-input/pin-input.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
  type SampleValues,
} from './field-states.js';

const types = ['numeric', 'alphanumeric', 'alphabetic'] as const satisfies readonly PinInputType[];
const looks = ['plain', 'masked', 'placeholder'] as const;

const samples: SampleValues<string> = {
  value: '2468',
  edited: '2469',
  invalid: '0000',
  warning: '1111',
  empty: '',
};

const typeSamples: Record<PinInputType, string> = {
  numeric: '4071',
  alphanumeric: 'K9P2',
  alphabetic: 'QXZW',
};

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState(state, samples);
  return <PinInput label="PIN" length={4} labelLayout={layout} {...props} />;
}

/** The server accepts 135790; any other complete code shows its error until the code changes. */
function OneTimeCode() {
  const [completions, setCompletions] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string | null>(null);
  const verify = (code: string) => {
    setCompletions((current) => [...current, code]);
    setRejected(code === '135790' ? null : code);
  };
  return (
    <>
      <PinInput
        label="Verification code"
        description="Enter the 6 digits we sent. The lab accepts 135790."
        length={6}
        autoComplete="one-time-code"
        onComplete={verify}
        validate={(value) =>
          value === rejected ? { severity: 'error', message: 'That code is not right.' } : null
        }
        data-lab-field="otp"
      />
      <LabOutput name="Completed">
        {completions.length > 0 ? completions.join(', ') : 'none'}
      </LabOutput>
      <LabOutput name="Verified">{completions.at(-1) === '135790' ? 'yes' : 'no'}</LabOutput>
    </>
  );
}

/** The committed code is the caller's: the field stays dirty until Save. */
function DirtyAndRestore() {
  const [saved, setSaved] = useState('1357');
  const [value, setValue] = useState('1357');
  return (
    <>
      <PinInput
        label="Door code"
        length={4}
        value={value}
        onChange={setValue}
        committedValue={saved}
        defaultValue="0000"
        menu={['clear', 'set-default']}
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <LabOutput name="Saved">{saved}</LabOutput>
    </>
  );
}

/** The form submits the joined code; a partly filled code blocks the submit. */
function InForm() {
  const [submitted, setSubmitted] = useState('none');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(String(new FormData(event.currentTarget).get('pin')));
  };
  return (
    <Form aria-label="Unlock" validationBehavior="aria" onSubmit={submit} data-lab-form="unlock">
      <PinInput label="Unlock PIN" length={4} name="pin" mask isRequired data-lab-field="form" />
      <Button type="submit" variant="primary">
        Unlock
      </Button>
      <Button type="reset">Reset</Button>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </Form>
  );
}

mountLab(
  <>
    <LabSection title="Layouts and states" description="Every label layout against every state.">
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Character types and looks"
      description="Digits, letters and digits, or letters only; masked or with a placeholder in empty cells."
    >
      <StateMatrix
        axes={{ type: types, look: looks }}
        render={({ type, look }) => (
          <PinInput
            label="Code"
            length={4}
            type={type}
            mask={look === 'masked'}
            placeholder={look === 'placeholder' ? '○' : undefined}
            defaultValue={look === 'placeholder' ? '' : typeSamples[type]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="One-time code"
      description="Type, paste or autofill a code; onComplete runs once per complete code."
    >
      <OneTimeCode />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and the field menu"
      description="Edit the code, then restore, undo with Ctrl+Z, or use the field menu."
    >
      <DirtyAndRestore />
    </LabSection>
    <LabSection
      title="In a form"
      description="Unlock with a partly filled PIN to see the message; Reset empties the PIN again."
    >
      <InForm />
    </LabSection>
  </>,
);
