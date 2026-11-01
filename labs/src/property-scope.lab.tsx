import { useState } from 'react';
import {
  PropertyCard,
  PropertyGroup,
  PropertyPanel,
  PropertyRow,
  PropertySection,
} from '../../src/components/property-panel/property-panel.js';
import { PropertyScope } from '../../src/components/property-scope/property-scope.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const queries = { none: '', title: 'colour', label: 'height', card: 'shadow', 'no match': 'zinc' };

function Swatches({
  query,
  onClear,
  filter,
}: {
  query: string;
  onClear?: () => void;
  filter?: (text: string, query: string) => boolean;
}) {
  return (
    <PropertyScope query={query} onClear={onClear} filter={filter}>
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
        <SearchField
          label="Find a setting"
          labelLayout="label-control"
          value={query}
          onChange={setQuery}
        />
      }
    >
      <Swatches query={query} onClear={() => setQuery('')} />
    </PropertyPanel>
  );
}

/** Matches a setting's own words exactly, so “width” finds Width but “wid” finds nothing. */
const wholeWord = (text: string, query: string) =>
  text.toLocaleLowerCase().split(/\s+/).includes(query.trim().toLocaleLowerCase());

function WholeWords() {
  const [query, setQuery] = useState('wid');
  return (
    <PropertyPanel
      aria-label="Whole words"
      header={
        <SearchField
          label="Find a whole word"
          labelLayout="label-control"
          value={query}
          onChange={setQuery}
        />
      }
    >
      <Swatches query={query} filter={wholeWord} onClear={() => setQuery('')} />
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
    <LabSection
      title="Custom matching"
      description="The host's filter matches whole words only: “wid” matches nothing, “width” keeps Width, and a lone “/”, which holds no terms, still reaches the filter."
    >
      <div data-lab-whole-words style={{ width: 360 }}>
        <WholeWords />
      </div>
    </LabSection>
  </>,
);
