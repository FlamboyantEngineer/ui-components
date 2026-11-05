import { type CSSProperties, useState } from 'react';
import { FacetList, type FacetListOption } from '../../src/components/facet-list/facet-list.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const column: CSSProperties = { width: 240 };

const cities: readonly FacetListOption[] = [
  { value: 'lisbon', label: 'Lisbon', count: 128 },
  { value: 'oslo', label: 'Oslo', count: 96 },
  { value: 'nairobi', label: 'Nairobi', count: 74 },
  { value: 'lima', label: 'Lima', count: 61 },
  { value: 'hanoi', label: 'Hanoi', count: 52 },
  // Written with a combining accent, as some sources deliver it: a search for québec still finds it.
  { value: 'quebec', label: 'Que\u0301bec', count: 40 },
  { value: 'tbilisi', label: 'Tbilisi', count: 33 },
  { value: 'perth', label: 'Perth', count: 21 },
  { value: 'cork', label: 'Cork', count: 12 },
  { value: 'tromso', label: 'Tromsø', count: 8 },
  { value: 'ushuaia', label: 'Ushuaia', count: 3 },
  { value: 'nuuk', label: 'Nuuk', count: 0, isDisabled: true },
];

const fruit: readonly FacetListOption[] = [
  { value: 'apple', label: 'Apple', count: 1204 },
  { value: 'pear', label: 'Pear', count: 87 },
  { value: 'plum', label: 'Plum' },
];

const modes = {
  plain: { options: fruit, filterable: false, selectedFirst: false, value: ['pear'] },
  folded: { options: cities, filterable: false, selectedFirst: false, value: ['lima'] },
  searchable: { options: cities, filterable: true, selectedFirst: false, value: [] },
  'selected first': { options: cities, filterable: true, selectedFirst: true, value: ['cork'] },
} as const;

function Facets() {
  const [value, setValue] = useState<string[]>(['oslo']);
  return (
    <div data-lab-demo="facets" style={column}>
      <FacetList
        label="City"
        options={cities}
        value={value}
        onChange={setValue}
        limit={4}
        selectedFirst
      />
      <p data-lab-value>{value.length > 0 ? value.join(', ') : 'No city chosen'}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Modes"
      description="A short facet, a folded facet with a show more button, a facet with a search field (Québec, written with a combining accent, answers a search typed with a composed one), and one listing the ticked values first. Counts are formatted for the locale; a value without a count shows none."
    >
      <StateMatrix
        axes={{ mode: Object.keys(modes) as Array<keyof typeof modes> }}
        render={({ mode }) => {
          const config = modes[mode];
          return (
            <div style={column}>
              <FacetList
                label={`${mode === 'plain' ? 'Fruit' : 'City'} (${mode})`}
                options={config.options}
                defaultValue={config.value}
                filterable={config.filterable}
                selectedFirst={config.selectedFirst}
              />
            </div>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Narrowing a list"
      description="A controlled facet: tick cities, search within them and unfold the rest. Ticked values move to the top once focus leaves the list."
    >
      <Facets />
    </LabSection>
  </>,
);
