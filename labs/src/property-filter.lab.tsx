import { useId, useState } from 'react';
import { Field, useFieldState } from '../../src/components/field/field.js';
import { PropertyFilter } from '../../src/components/property-filter/property-filter.js';
import {
  PropertyCard,
  PropertyGroup,
  PropertyRow,
  PropertySection,
  type PropertyPanelLabelLayout,
  type PropertyRowProps,
} from '../../src/components/property-panel/property-panel.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const widths = { narrow: 300, wide: 440 } as const;

type TextSettingProps = Omit<PropertyRowProps, 'children' | 'htmlFor' | 'label'> & {
  label: string;
  value: string;
};

/** A row holding a field around a plain native input, so a draft can outlive filtering. */
function TextSetting({ label, value, ...row }: TextSettingProps) {
  const id = useId();
  const state = useFieldState<string>({ defaultValue: value });
  return (
    <PropertyRow label={label} htmlFor={`${id}-control`} {...row}>
      <Field id={id} state={state} label={label} labelLayout="control-only">
        {(control) => (
          <input
            {...control}
            value={state.value}
            onChange={(event) => state.setValue(event.target.value)}
            onBlur={() => state.commit()}
          />
        )}
      </Field>
    </PropertyRow>
  );
}

type FrameSettingsProps = Pick<
  Parameters<typeof PropertyFilter>[0],
  'query' | 'onQueryChange' | 'filter'
> & { name: string; layout: PropertyPanelLabelLayout };

function FrameSettings({ name, layout, ...search }: FrameSettingsProps) {
  return (
    <PropertyFilter
      aria-label={name}
      placeholder="Try “paper” or “font”"
      labelLayout={layout}
      {...search}
    >
      <PropertySection title="Page setup">
        <PropertyGroup heading="Paper">
          <TextSetting label="Paper size" value="A4" />
          <TextSetting label="Orientation" value="Portrait" />
        </PropertyGroup>
        <TextSetting label="Margins" value="12" unit="mm" keywords={['Top', 'Bottom']} />
      </PropertySection>
      <PropertySection title="Text styles">
        <PropertyCard name="Heading" summary="Serif 22">
          <TextSetting label="Font" value="Serif" isOverridden />
        </PropertyCard>
        <PropertyCard name="Body" summary="Sans 11">
          <TextSetting label="Font size" value="11" unit="pt" />
        </PropertyCard>
      </PropertySection>
    </PropertyFilter>
  );
}

/** Matches a word that starts with the query, so “or” finds Orientation but not Portrait. */
const wordStart = (text: string, query: string) =>
  text
    .toLocaleLowerCase()
    .split(/\s+/)
    .some((word) => word.startsWith(query.trim().toLocaleLowerCase()));

/** The query lives with the host, which could store it or put it in the address. */
function SharedQuery() {
  const [query, setQuery] = useState('font');
  return (
    <div data-lab-shared style={{ width: widths.wide }}>
      <p>
        <button type="button" onClick={() => setQuery('paper')}>
          Show paper settings
        </button>{' '}
        <output data-lab-output>Query: {query || 'none'}</output>
      </p>
      <FrameSettings
        name="Shared query"
        layout="responsive"
        query={query}
        onQueryChange={setQuery}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts"
      description="A filter panel in each label layout, 300 and 440 pixels wide. Type to filter; Escape or the clear button empties the query."
    >
      <StateMatrix
        axes={{ layout: ['responsive', 'inline'], width: ['narrow', 'wide'] }}
        render={({ layout, width }) => (
          <div data-lab-column={widths[width]} style={{ width: widths[width] }}>
            <FrameSettings name={`Frame ${layout} ${width}`} layout={layout} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Controlled query and matching"
      description="Left, the host holds the query: the button sets it and the output follows typing. Right, a filter that matches word starts: “or” finds Orientation, not Portrait."
    >
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <SharedQuery />
        <div data-lab-word-start style={{ width: widths.wide }}>
          <FrameSettings name="Word starts" layout="responsive" filter={wordStart} />
        </div>
      </div>
    </LabSection>
  </>,
);
