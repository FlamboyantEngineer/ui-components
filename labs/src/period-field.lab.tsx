import { useState } from 'react';
import { PeriodField } from '../../src/components/period-field/index.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { FieldBehaviours } from './field-behaviours.js';
import { LabForm } from './lab-form.js';
import { LabOutput } from './lab-output.js';

const states = {
  empty: {},
  chosen: { defaultValue: '2026-03' },
  'read-only': { defaultValue: '2026-09', isReadOnly: true },
  disabled: { defaultValue: '2026-01', isDisabled: true },
  required: { isRequired: true },
  unreadable: { defaultValue: '2026-13', validationMode: 'immediate' },
} as const;

function BillingMonth() {
  const [month, setMonth] = useState<string | null>('2026-03');
  return (
    <div data-lab-demo="billing">
      <LabForm label="Invoice">
        <PeriodField
          label="Billing month"
          name="month"
          minValue="2025-06"
          maxValue="2027-02"
          value={month}
          onChange={setMonth}
        />
      </LabForm>
      <LabOutput name="month">{month ?? 'none'}</LabOutput>
    </div>
  );
}

function FiscalYear() {
  const [year, setYear] = useState<string | null>(null);
  return (
    <div data-lab-demo="fiscal">
      <PeriodField
        label="Fiscal year"
        granularity="year"
        minValue="2019"
        maxValue="2034"
        value={year}
        onChange={setYear}
      />
      <LabOutput name="year">{year ?? 'none'}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and sizes"
      description="No period yet, a chosen month, read-only, disabled, required without a period and a value the field cannot read, in every field size."
    >
      <StateMatrix
        axes={{
          state: Object.keys(states) as Array<keyof typeof states>,
          size: ['sm', 'md', 'lg'],
        }}
        render={({ state, size }) => <PeriodField label="Period" size={size} {...states[state]} />}
      />
    </LabSection>
    <LabSection
      title="Month with bounds"
      description="A billing month from June 2025 to February 2027, submitted as YYYY-MM. Months beyond the bounds are disabled, and the page buttons stop at the bounds' years. Arrow keys move across and down the grid."
    >
      <BillingMonth />
    </LabSection>
    <LabSection
      title="Year"
      description="A fiscal year from 2019 to 2034, submitted as YYYY, on pages of twelve years. Without a value the grid opens on the current year."
    >
      <FiscalYear />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In Arabic, the page buttons and the arrow keys are mirrored, and the months use the locale's names."
    >
      <UiProvider locale="ar">
        <div dir="rtl" data-lab-demo="rtl">
          <PeriodField label="الشهر" defaultValue="2026-03" />
        </div>
      </UiProvider>
    </LabSection>
    <FieldBehaviours<string | null>
      committed="2026-03"
      changed="2026-05"
      empty={null}
      refused="2026-01"
      isRefused={(value) => value === '2026-01'}
      refusedText="January 2026"
      render={(props) => <PeriodField placeholder="Pick a month" {...props} />}
    />
  </>,
);
