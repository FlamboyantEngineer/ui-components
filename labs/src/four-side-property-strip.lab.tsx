import { useState } from 'react';
import {
  FourSidePropertyStrip,
  type BoxAxis,
  type BoxSide,
  type FourSidePropertyStripLink,
  type FourSideValueAlign,
} from '../../src/components/four-side-property-strip/four-side-property-strip.js';
import { PropertyPanel } from '../../src/components/property-panel/property-panel.js';
import { PropertyScope } from '../../src/components/property-scope/property-scope.js';
import { UiProvider } from '../../src/core/provider.js';
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
        <input
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

const linkStarts = ['none', 'vertical', 'horizontal', 'both'] as const;

const startPairs: Record<(typeof linkStarts)[number], readonly BoxAxis[]> = {
  none: [],
  vertical: ['vertical'],
  horizontal: ['horizontal'],
  both: ['vertical', 'horizontal'],
};

/**
 * A strip holding its values, whose link toggles set all four sides or each opposite pair. The
 * bracket below the cells joins the sides one edit sets together.
 */
function Linked({
  link,
  start,
}: {
  link: FourSidePropertyStripLink;
  start: (typeof linkStarts)[number];
}) {
  return (
    <FourSidePropertyStrip
      label="Padding"
      unit="px"
      link={link}
      defaultLinked={startPairs[start]}
      defaultValue={{ top: '8', bottom: '8', left: '12', right: '12' }}
      renderSide={(side, field) => (
        <input
          aria-label={`Padding ${link} ${start} ${side}`}
          value={field.value ?? ''}
          size={3}
          onChange={(event) => field.onChange(event.target.value)}
        />
      )}
    />
  );
}

/** Linked flow-relative sides in a narrow panel, left to right and right to left. */
function LinkedLogical({
  link,
  direction,
}: {
  link: FourSidePropertyStripLink;
  direction: 'ltr' | 'rtl';
}) {
  return (
    <UiProvider locale={direction === 'rtl' ? 'ar-EG' : 'en-US'}>
      <div dir={direction} data-lab-column="260" style={{ width: 260 }}>
        <PropertyPanel aria-label={`Linked logical ${link} ${direction}`}>
          <FourSidePropertyStrip
            label="Inset"
            sides="logical"
            unit="rem"
            link={link}
            defaultLinked={['block', 'inline']}
            defaultValue={{
              'block-start': '4',
              'block-end': '4',
              'inline-start': '16',
              'inline-end': '16',
            }}
            renderSide={(side, field) => (
              <input
                aria-label={`Inset ${link} ${direction} ${side}`}
                value={field.value ?? ''}
                size={3}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </PropertyPanel>
      </div>
    </UiProvider>
  );
}

/** One controlled link state, shared as the strip switches between pairs and all sides. */
function SwitchingModes() {
  const [link, setLink] = useState<FourSidePropertyStripLink>('pairs');
  const [linked, setLinked] = useState<readonly BoxAxis[]>(['horizontal']);
  return (
    <div data-lab-demo="switching" data-lab-column="400" style={{ width: 400 }}>
      <label>
        <input
          type="checkbox"
          checked={link === 'all'}
          onChange={(event) => setLink(event.target.checked ? 'all' : 'pairs')}
        />{' '}
        Link all four sides together
      </label>
      <PropertyPanel aria-label="Margin across modes">
        <FourSidePropertyStrip
          label="Margin"
          link={link}
          linked={linked}
          onLinkedChange={setLinked}
          defaultValue={{ top: '0', bottom: '0', left: '8', right: '8' }}
          renderSide={(side, field) => (
            <input
              aria-label={`Margin switching ${side}`}
              value={field.value ?? ''}
              size={3}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </PropertyPanel>
      <output data-lab-output="linked">Linked pairs: {linked.join(', ') || 'none'}</output>
    </div>
  );
}

/** Flow-relative sides in a right-to-left panel: the start cell edits the right side. */
function Logical({ direction }: { direction: 'ltr' | 'rtl' }) {
  return (
    <UiProvider locale={direction === 'rtl' ? 'ar-EG' : 'en-US'}>
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
              <input
                aria-label={`Inset ${direction} ${side}`}
                value={field.value ?? ''}
                size={3}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </PropertyPanel>
      </div>
    </UiProvider>
  );
}

const alignments = ['default', 'start', 'center', 'end'] as const;
const alignShapes = ['physical pairs', 'logical all', 'right to left', 'narrow'] as const;

/** Negative, decimal, short and long values, to align in each side's box. */
const alignValues = { top: '-12.5', bottom: '0.25', left: '4', right: '1024' };

/** A strip whose values sit where `align` says, in several shapes and control widths. */
function Aligned({
  align,
  shape,
}: {
  align: (typeof alignments)[number];
  shape: (typeof alignShapes)[number];
}) {
  const valueAlign: FourSideValueAlign | undefined = align === 'default' ? undefined : align;
  const name = `Offset ${align} ${shape}`;
  const input = (
    side: string,
    field: { value: string | undefined; onChange: (v: string) => void },
  ) => (
    <input
      aria-label={`${name} ${side}`}
      value={field.value ?? ''}
      size={shape === 'narrow' ? 5 : 7}
      onChange={(event) => field.onChange(event.target.value)}
    />
  );
  const width = shape === 'narrow' ? 260 : 400;
  if (shape === 'physical pairs') {
    return (
      <div data-lab-column={width} style={{ width }}>
        <PropertyPanel aria-label={name}>
          <FourSidePropertyStrip
            label="Offset"
            unit="px"
            valueAlign={valueAlign}
            link="pairs"
            defaultLinked={['horizontal']}
            defaultValue={alignValues}
            renderSide={input}
          />
        </PropertyPanel>
      </div>
    );
  }
  const isRtl = shape === 'right to left';
  return (
    <UiProvider locale={isRtl ? 'ar-EG' : 'en-US'}>
      <div dir={isRtl ? 'rtl' : 'ltr'} data-lab-column={width} style={{ width }}>
        <PropertyPanel aria-label={name}>
          <FourSidePropertyStrip
            label="Offset"
            sides="logical"
            unit="px"
            valueAlign={valueAlign}
            link="all"
            defaultValue={{
              'block-start': alignValues.top,
              'block-end': alignValues.bottom,
              'inline-start': alignValues.left,
              'inline-end': alignValues.right,
            }}
            renderSide={input}
          />
        </PropertyPanel>
      </div>
    </UiProvider>
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
      description="A bracket below the cells joins the sides one edit sets: pairs bracket top with bottom and left with right, all brackets the four. Each bracket's toggle links its own sides, so either pair, both or neither can be linked; with all, the four sides are linked while both pairs are. Linked brackets are solid with an accent glyph, unlinked ones dashed. Tab reaches each toggle after the cells, and Space or Enter presses it."
    >
      <StateMatrix
        axes={{ link: ['pairs', 'all'], start: linkStarts }}
        render={({ link, start }) => (
          <div data-lab-column="400" style={{ width: 400 }}>
            <PropertyPanel aria-label={`Linked ${link} ${start}`}>
              <Linked link={link} start={start} />
            </PropertyPanel>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Switching modes"
      description="One controlled list of linked pairs, kept as the strip switches between pairs and all sides: linking all four lists both pairs, and unlinking them lists neither."
    >
      <SwitchingModes />
    </LabSection>
    <LabSection
      title="Linked logical sides"
      description="Linked flow-relative sides in rem in a 260 pixel panel, left to right and right to left: each bracket follows its cells in the reading direction, and the unit stays level with the inputs above the brackets."
    >
      <StateMatrix
        axes={{ link: ['pairs', 'all'], direction: ['ltr', 'rtl'] }}
        render={({ link, direction }) => <LinkedLogical link={link} direction={direction} />}
      />
    </LabSection>
    <LabSection
      title="Value alignment"
      description="valueAlign places each side's value at the start, centre or end of its box, in the reading direction; without it, the controls keep their own alignment. Negative, decimal and long values, linked pairs and all sides, flow-relative sides right to left and narrow controls."
    >
      <StateMatrix
        axes={{ align: alignments, shape: alignShapes }}
        render={({ align, shape }) => <Aligned align={align} shape={shape} />}
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
