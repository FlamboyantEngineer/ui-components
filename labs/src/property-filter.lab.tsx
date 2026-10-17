import { useId } from 'react';
import { Input } from 'react-aria-components';
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

/** A row holding a field around a plain React Aria input, so a draft can outlive filtering. */
function TextSetting({ label, value, ...row }: TextSettingProps) {
  const id = useId();
  const state = useFieldState<string>({ defaultValue: value });
  return (
    <PropertyRow label={label} htmlFor={`${id}-control`} {...row}>
      <Field id={id} state={state} label={label} labelLayout="control-only">
        {(control) => (
          <Input
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

function FrameSettings({ name, layout }: { name: string; layout: PropertyPanelLabelLayout }) {
  return (
    <PropertyFilter aria-label={name} placeholder="Try “paper” or “font”" labelLayout={layout}>
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
  </>,
);
