import { useState } from 'react';
import { Input } from 'react-aria-components';
import {
  FourSidePropertyStrip,
  type BoxSide,
} from '../../src/components/four-side-property-strip/four-side-property-strip.js';
import { PropertyPanel } from '../../src/components/property-panel/property-panel.js';
import { PropertyScope } from '../../src/components/property-scope/property-scope.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states = ['plain', 'unit', 'overridden', 'required', 'wide', 'hint'] as const;
const start: Record<BoxSide, string> = { top: '10', bottom: '10', left: '16', right: '16' };

/** Four plain inputs, one per side, each named after its side. */
function Margins({ state, name }: { state: (typeof states)[number]; name: string }) {
  const [values, setValues] = useState(start);
  return (
    <FourSidePropertyStrip
      label="Margins"
      unit={state === 'unit' ? 'mm' : undefined}
      isOverridden={state === 'overridden'}
      isRequired={state === 'required'}
      wide={state === 'wide'}
      hint={state === 'hint' ? 'Space inside the frame' : undefined}
      renderSide={(side) => (
        <Input
          aria-label={`${name} ${side}`}
          value={values[side]}
          size={3}
          onChange={(event) => setValues({ ...values, [side]: event.target.value })}
        />
      )}
    />
  );
}

function Filtered() {
  const [query, setQuery] = useState('right');
  return (
    <>
      <label>
        Query <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <PropertyPanel aria-label="Filtered strip">
        <PropertyScope query={query}>
          <Margins state="unit" name="Filtered margin" />
        </PropertyScope>
      </PropertyPanel>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Each row option in both label layouts, 400 pixels wide."
    >
      <StateMatrix
        axes={{ state: states, layout: ['responsive', 'inline'] }}
        render={({ state, layout }) => {
          const name = `Margin ${state} ${layout}`;
          return (
            <div data-lab-column="400" style={{ width: 400 }}>
              <PropertyPanel aria-label={name} labelLayout={layout}>
                <Margins state={state} name={name} />
              </PropertyPanel>
            </div>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Filtering"
      description="The side names are keywords: a query for a side keeps the row."
    >
      <div data-lab-filtered style={{ width: 400 }}>
        <Filtered />
      </div>
    </LabSection>
  </>,
);
