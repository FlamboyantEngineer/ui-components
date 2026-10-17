import { useState } from 'react';
import { Input, Label, SearchField } from 'react-aria-components';
import {
  PropertyCard,
  PropertyGroup,
  PropertyPanel,
  PropertyRow,
  PropertySection,
} from '../../src/components/property-panel/property-panel.js';
import { PropertyScope } from '../../src/components/property-scope/property-scope.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const queries = { none: '', title: 'colour', label: 'height', card: 'shadow', 'no match': 'zinc' };

function Swatches({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <PropertyScope query={query} onClear={onClear}>
      <PropertySection title="Colours">
        <PropertyRow label="Fill">Teal</PropertyRow>
        <PropertyRow label="Stroke" isOverridden>
          Navy
        </PropertyRow>
      </PropertySection>
      <PropertySection title="Sizes" defaultExpanded={false}>
        <PropertyGroup heading="Box">
          <PropertyRow label="Width" unit="px">
            320
          </PropertyRow>
          <PropertyRow label="Height" unit="px">
            200
          </PropertyRow>
        </PropertyGroup>
        <PropertyCard name="Shadow" summary="4 px">
          <PropertyRow label="Blur" unit="px">
            4
          </PropertyRow>
        </PropertyCard>
      </PropertySection>
    </PropertyScope>
  );
}

/** A host-owned search box above a scope, as a host with its own header would draw it. */
function HostSearch() {
  const [query, setQuery] = useState('');
  return (
    <PropertyPanel
      aria-label="Host search"
      header={
        <SearchField value={query} onChange={setQuery}>
          <Label>Find a setting</Label> <Input />
        </SearchField>
      }
    >
      <Swatches query={query} onClear={() => setQuery('')} />
    </PropertyPanel>
  );
}

mountLab(
  <>
    <LabSection
      title="Queries"
      description="The same settings under no query, a section title, a row label, a card name and a query nothing matches, with and without a clear button."
    >
      <StateMatrix
        axes={{
          query: Object.keys(queries) as Array<keyof typeof queries>,
          clear: ['without', 'with'],
        }}
        render={({ query, clear }) => (
          <div data-lab-column="320" style={{ width: 320 }}>
            <PropertyPanel aria-label={`Query ${query} ${clear} clear`}>
              <Swatches query={queries[query]} onClear={clear === 'with' ? () => {} : undefined} />
            </PropertyPanel>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Host search box"
      description="The host owns the query; its no-match message clears it."
    >
      <div data-lab-host-search style={{ width: 360 }}>
        <HostSearch />
      </div>
    </LabSection>
  </>,
);
