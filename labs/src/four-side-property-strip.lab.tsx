import { useState } from 'react';
import { I18nProvider, Input } from '../../src/primitives/index.js';
import {
  FourSidePropertyStrip,
  type BoxSide,
  type FourSidePropertyStripLink,
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

/** A strip holding its values, whose link toggle sets all four sides or each opposite pair. */
function Linked({ link }: { link: FourSidePropertyStripLink }) {
  return (
    <FourSidePropertyStrip
      label="Padding"
      unit="px"
      link={link}
      defaultLinked={link === 'all'}
      defaultValue={{ top: '8', bottom: '8', left: '12', right: '12' }}
      renderSide={(side, field) => (
        <Input
          aria-label={`Padding ${link} ${side}`}
          value={field.value ?? ''}
          size={3}
          onChange={(event) => field.onChange(event.target.value)}
        />
      )}
    />
  );
}

/** Flow-relative sides in a right-to-left panel: the start cell edits the right side. */
function Logical({ direction }: { direction: 'ltr' | 'rtl' }) {
  return (
    <I18nProvider locale={direction === 'rtl' ? 'ar-EG' : 'en-US'}>
      <div dir={direction} data-lab-direction={direction}>
        <PropertyPanel aria-label={`Logical ${direction}`}>
          <FourSidePropertyStrip
            label="Inset"
            sides="logical"
            defaultValue={{
              'block-start': '4',
              'block-end': '4',
              'inline-start': '16',
              'inline-end': '0',
            }}
            renderSide={(side, field) => (
              <Input
                aria-label={`Inset ${direction} ${side}`}
                value={field.value ?? ''}
                size={3}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </PropertyPanel>
      </div>
    </I18nProvider>
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
    <LabSection
      title="Linked sides"
      description="The toggle links the sides: pairs link top with bottom and left with right; all links the four. The right strip starts linked."
    >
      <StateMatrix
        axes={{ link: ['pairs', 'all'] }}
        render={({ link }) => (
          <div data-lab-column="400" style={{ width: 400 }}>
            <PropertyPanel aria-label={`Linked ${link}`}>
              <Linked link={link} />
            </PropertyPanel>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Logical sides"
      description="Top, bottom, start and end, left to right and right to left: the start cell comes first in the reading direction."
    >
      <StateMatrix
        axes={{ direction: ['ltr', 'rtl'] }}
        render={({ direction }) => (
          <div data-lab-column="400" style={{ width: 400 }}>
            <Logical direction={direction} />
          </div>
        )}
      />
    </LabSection>
  </>,
);
