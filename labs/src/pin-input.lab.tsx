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
const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const sizeStates = ['filled', 'partial', 'masked', 'invalid', 'disabled'] as const;
const wrongCode = () => ({ severity: 'error' as const, message: 'That code is wrong.' });
const sizeSample: Record<(typeof sizeStates)[number], string> = {
  filled: '4071',
  partial: '40',
  masked: '4071',
  invalid: '4071',
  disabled: '4071',
};

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
        enterKeyHint="done"
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
        menu={['clear', 'reset', 'set-default']}
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <LabOutput name="Saved">{saved}</LabOutput>
    </>
  );
}

/** The caller keeps three digits at most, so a pasted four-digit code never completes or commits. */
function CallerShaped() {
  const [value, setValue] = useState('');
  const [commits, setCommits] = useState<string[]>([]);
  return (
    <>
      <PinInput
        label="Short code"
        description="The caller keeps the first three digits; Tab away to commit them."
        length={4}
        value={value}
        onChange={(next) => setValue(next.slice(0, 3))}
        onCommit={(next) => setCommits((current) => [...current, next])}
        data-lab-field="capped"
      />
      <LabOutput name="Commits">{commits.length > 0 ? commits.join(', ') : 'none'}</LabOutput>
      <PinInput
        label="Imported code"
        description="A supplied code with a letter and extra digits stays invalid until edited."
        length={4}
        defaultValue="12x456"
        validationMode="immediate"
        data-lab-field="imported"
      />
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
      description="Digits, letters and digits, or letters only; masked or with a placeholder in empty cells. A letter an input method composes stays in its cell until it is committed."
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
      title="Sizes"
      description="Each size of the shared control scale against filled, partly filled, masked, invalid and disabled cells. Click a cell to see its focus ring at that size; the narrow column wraps a long label."
    >
      <StateMatrix
        axes={{ size: sizes, state: sizeStates }}
        render={({ size, state }) => (
          <PinInput
            label={`Code, ${size}, ${state}`}
            size={size}
            length={4}
            mask={state === 'masked'}
            defaultValue={sizeSample[state]}
            validate={state === 'invalid' ? wrongCode : undefined}
            validationMode="immediate"
            isDisabled={state === 'disabled'}
          />
        )}
      />
      <div style={{ inlineSize: '10rem' }} data-lab-demo="narrow-pin">
        <PinInput
          label="Verification code sent to the address on file"
          size="lg"
          length={6}
          defaultValue="123"
        />
      </div>
    </LabSection>
    <LabSection
      title="One-time code"
      description="Type, paste or autofill a code; onComplete runs once per complete code."
    >
      <OneTimeCode />
    </LabSection>
    <LabSection
      title="Codes the caller shapes"
      description="Completion follows the code the field renders, and a supplied code is checked as it is."
    >
      <CallerShaped />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and the field menu"
      description="Edit the code, or delete or cut a selected character (the later ones close up), then restore, undo with Ctrl+Z, or open the field's menu (right-click it, or Shift+F10 in it)."
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
