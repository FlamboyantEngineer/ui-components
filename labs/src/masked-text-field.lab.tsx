import { useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import { MaskedTextField } from '../../src/components/masked-text-field/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  type FieldStateName,
  fieldStates,
  useLabFieldState,
} from './field-states.js';
import { LabOutput } from './lab-output.js';

const phoneMask = '(999) 999-9999';

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState(state, {
    value: '5550100',
    edited: '5550199',
    invalid: '5550000',
    warning: '5559999',
    empty: '',
  });
  return <MaskedTextField label="Extension" mask="999-9999" labelLayout={layout} {...props} />;
}

/** A phone-shaped mask: the raw digits are the value; the input writes the separators. */
function PhoneShaped() {
  const [value, setValue] = useState('');
  const [committed, setCommitted] = useState('');
  const [submitted, setSubmitted] = useState('none');
  return (
    <form
      aria-label="Phone form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('phone')));
      }}
    >
      <MaskedTextField
        label="Phone"
        mask={phoneMask}
        name="phone"
        autoComplete="tel-national"
        value={value}
        onChange={setValue}
        onCommit={setCommitted}
        description="Digits only; the mask checks the shape, not the number."
        data-lab-field="phone"
      />
      <Button label="Submit phone" type="submit" />
      <Button label="Fill a sample" onPress={() => setValue('5550123456')} />
      <LabOutput name="Raw">{value || 'none'}</LabOutput>
      <LabOutput name="Committed">{committed || 'none'}</LabOutput>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </form>
  );
}

/** A reference code: three letters written in upper case, a dash, four digits. */
function ReferenceCode() {
  const [submitted, setSubmitted] = useState('none');
  return (
    <form
      aria-label="Reference form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('reference')));
      }}
    >
      <MaskedTextField
        label="Reference code"
        mask="AAA-9999"
        name="reference"
        formValue="formatted"
        description="Letters are written in upper case; the form receives the formatted text."
        data-lab-field="reference"
      />
      <Button label="Submit reference" type="submit" />
      <LabOutput name="Reference submitted">{submitted}</LabOutput>
    </form>
  );
}

/** A custom token: hexadecimal digits in upper case, grouped in fours. */
function CustomTokens() {
  const [value, setValue] = useState('');
  return (
    <>
      <MaskedTextField
        label="Device key"
        mask="HHHH HHHH HHHH"
        tokens={{
          H: { pattern: /^[0-9a-f]$/i, transform: (character) => character.toUpperCase() },
        }}
        value={value}
        onChange={setValue}
        data-lab-field="key"
      />
      <LabOutput name="Key">{value || 'none'}</LabOutput>
    </>
  );
}

mountLab(
  <>
    <LabSection title="States" description="Every field state in every label layout.">
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Phone-shaped mask"
      description="Type, paste or autofill: only digits stay, the separators appear as slots after them fill, and Backspace next to a separator removes the digit before it."
    >
      <PhoneShaped />
    </LabSection>
    <LabSection
      title="Reference code"
      description="A neutral code mask with upper-case letters, submitted formatted."
    >
      <ReferenceCode />
    </LabSection>
    <LabSection title="Custom tokens" description="The host's own token for hexadecimal digits.">
      <CustomTokens />
    </LabSection>
  </>,
);
