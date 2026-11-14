import { useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import { NumberField, toCanonicalDecimal } from '../../src/components/number-field/index.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix } from './chrome/index.js';
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
  return (
    <NumberField valueType="decimal" label="Weight" labelLayout={layout} step="0.25" {...props} />
  );
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
      <NumberField
        valueType="decimal"
        label="Exact value"
        name="exact"
        value={value}
        onChange={setValue}
        onCommit={setCommitted}
        description="Type past 2^53 or past twenty fraction digits; the arrows step it by 1."
        data-lab-field="exact"
      />
      <Button label="Submit exact decimal" type="submit" />
      <Button
        label="Set a long fraction"
        onPress={() => setValue('-0.1000000000000000000000000000001')}
      />
      <LabOutput name="Exact value">{value ?? 'none'}</LabOutput>
      <LabOutput name="Exact committed">{committed ?? 'none'}</LabOutput>
      <LabOutput name="Exact submitted">{submitted}</LabOutput>
    </form>
  );
}

/** Steps of 0.1 stay exact; the scale rounds typed digits and the bounds hold the value. */
function Rules() {
  const [value, setValue] = useState<string | null>('0.2');
  return (
    <>
      <NumberField
        valueType="decimal"
        label="Ratio"
        showStepper
        step="0.1"
        minValue="0"
        maxValue="1"
        value={value}
        onChange={setValue}
        description="From 0 to 1 in steps of 0.1: three steps from 0 are 0.3."
        data-lab-field="ratio"
      />
      <LabOutput name="Ratio">{value ?? 'none'}</LabOutput>
      <NumberField
        valueType="decimal"
        label="Price"
        scale={2}
        defaultValue="19.99"
        formatOptions={{ minimumFractionDigits: 2 }}
        description="Two fraction digits, rounded half away from zero, always shown."
        data-lab-field="price"
      />
      <NumberField
        valueType="decimal"
        label="Rate"
        scale={2}
        roundingMode="halfEven"
        maxValue="10"
        commitBehavior="validate"
        defaultValue="2.5"
        description="Rounds half to even and reports a value above 10 instead of clamping it."
        data-lab-field="rate"
      />
      <NumberField
        valueType="decimal"
        label="Tolerance"
        scale={3}
        roundingMode="trunc"
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
          <NumberField
            valueType="decimal"
            label={`Amount (${locale})`}
            defaultValue="-1234567.891"
            data-lab-field={`locale-${locale}`}
          />
        </UiProvider>
      ))}
    </>
  );
}

export function NumberFieldExactSections() {
  return (
    <>
      <LabSection
        title="Exact decimal states"
        description="Every field state in every label layout."
      >
        <StateMatrix
          axes={{ state: fieldStates, layout: fieldLayouts }}
          render={({ state, layout }) => <Sample state={state} layout={layout} />}
        />
      </LabSection>
      <LabSection
        title="Exact decimal values"
        description="The value is a canonical decimal string; the input shows it in the locale and the form submits it exactly."
      >
        <Exact />
      </LabSection>
      <LabSection
        title="Exact decimal steps, scale and rounding"
        description="Exact steps and bounds; a scale with halfExpand, halfEven or trunc rounding; snap or validate on commit."
      >
        <Rules />
      </LabSection>
      <LabSection
        title="Exact decimal locales"
        description="German groups with dots, French with narrow spaces, Egyptian Arabic writes its own digits; each reads them back."
      >
        <Locales />
      </LabSection>
      <LabSection
        title="Canonical decimal utility"
        description="toCanonicalDecimal gives the form every value the field sets takes."
      >
        <LabHelperCalls
          calls={['+1.50', '-0', '007', '.5', '1e5'].map(
            (text) => [`toCanonicalDecimal('${text}')`, String(toCanonicalDecimal(text))] as const,
          )}
        />
      </LabSection>
      <LabSection
        title="Exact decimal placeholder"
        description="The host's own hint while the field is empty."
      >
        <div data-lab-demo="placeholder">
          <NumberField valueType="decimal" label="Tare" placeholder="0.00" />
        </div>
      </LabSection>
    </>
  );
}
