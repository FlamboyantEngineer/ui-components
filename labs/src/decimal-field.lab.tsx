import { useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import { DecimalField, toCanonicalDecimal } from '../../src/components/decimal-field/index.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  type FieldStateName,
  fieldStates,
  useLabFieldState,
} from './field-states.js';
import { LabHelperCalls } from './lab-helper-calls.js';
import { LabOutput } from './lab-output.js';

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState<string | null>(state, {
    value: '12.5',
    edited: '12.75',
    invalid: '99',
    warning: '0.05',
    empty: null,
  });
  return <DecimalField label="Weight" labelLayout={layout} step="0.25" {...props} />;
}

/** Values past the reach of a JavaScript number come back exactly, in the callbacks and the form. */
function Exact() {
  const [value, setValue] = useState<string | null>('9007199254740993');
  const [committed, setCommitted] = useState<string | null>('9007199254740993');
  const [submitted, setSubmitted] = useState('none');
  return (
    <form
      aria-label="Exact decimal"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('exact')));
      }}
    >
      <DecimalField
        label="Exact value"
        name="exact"
        value={value}
        onChange={setValue}
        onCommit={setCommitted}
        description="Type past 2^53 or past twenty fraction digits; the arrows step it by 1."
        data-lab-field="exact"
      />
      <Button label="Submit" type="submit" />
      <Button
        label="Set a long fraction"
        onPress={() => setValue('-0.1000000000000000000000000000001')}
      />
      <LabOutput name="Value">{value ?? 'none'}</LabOutput>
      <LabOutput name="Committed">{committed ?? 'none'}</LabOutput>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </form>
  );
}

/** Steps of 0.1 stay exact; the scale rounds typed digits and the bounds hold the value. */
function Rules() {
  const [value, setValue] = useState<string | null>('0.2');
  return (
    <>
      <DecimalField
        label="Ratio"
        step="0.1"
        minValue="0"
        maxValue="1"
        value={value}
        onChange={setValue}
        description="From 0 to 1 in steps of 0.1: three steps from 0 are 0.3."
        data-lab-field="ratio"
      />
      <LabOutput name="Ratio">{value ?? 'none'}</LabOutput>
      <DecimalField
        label="Price"
        scale={2}
        defaultValue="19.99"
        formatOptions={{ minimumFractionDigits: 2 }}
        description="Two fraction digits, rounded half away from zero, always shown."
        data-lab-field="price"
      />
      <DecimalField
        label="Rate"
        scale={2}
        roundingMode="halfEven"
        maxValue="10"
        commitBehavior="validate"
        defaultValue="2.5"
        description="Rounds half to even and reports a value above 10 instead of clamping it."
        data-lab-field="rate"
      />
      <DecimalField
        label="Tolerance"
        scale={3}
        roundingMode="trunc"
        hideStepper
        defaultValue="0.125"
        description="Drops digits past the third, with no step buttons."
        data-lab-field="tolerance"
      />
    </>
  );
}

/** The same value in three locales: each writes and reads its own separators and digits. */
function Locales() {
  return (
    <>
      {(['de-DE', 'fr-FR', 'ar-EG'] as const).map((locale) => (
        <UiProvider key={locale} locale={locale}>
          <DecimalField
            label={`Amount (${locale})`}
            defaultValue="-1234567.891"
            data-lab-field={`locale-${locale}`}
          />
        </UiProvider>
      ))}
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
      title="Exact values"
      description="The value is a canonical decimal string; the input shows it in the locale and the form submits it exactly."
    >
      <Exact />
    </LabSection>
    <LabSection
      title="Steps, scale and rounding"
      description="Exact steps and bounds; a scale with halfExpand, halfEven or trunc rounding; snap or validate on commit."
    >
      <Rules />
    </LabSection>
    <LabSection
      title="Locales"
      description="German groups with dots, French with narrow spaces, Egyptian Arabic writes its own digits; each reads them back."
    >
      <Locales />
    </LabSection>
    <LabSection
      title="Canonical decimals"
      description="toCanonicalDecimal gives the form every value the field sets takes."
    >
      <LabHelperCalls
        calls={['+1.50', '-0', '007', '.5', '1e5'].map(
          (text) => [`toCanonicalDecimal('${text}')`, String(toCanonicalDecimal(text))] as const,
        )}
      />
    </LabSection>
    <LabSection title="Placeholder" description="The host's own hint while the field is empty.">
      <div data-lab-demo="placeholder">
        <DecimalField label="Tare" placeholder="0.00" />
      </div>
    </LabSection>
  </>,
);
