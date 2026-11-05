import { type CSSProperties, useState } from 'react';
import {
  createFilterCondition,
  createFilterMatcher,
  FilterBar,
  type FilterCondition,
  type FilterField,
  matchesFilterCondition,
} from '../../src/components/filter-bar/filter-bar.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { FilterBarCompletenessCases } from './filter-bar-completeness-cases.js';
import { bookFields, getBookValue, sampleBooks } from './filter-samples.js';
import { LabHelperCalls } from './lab-helper-calls.js';

const column: CSSProperties = { width: 420 };

const types = ['text', 'number', 'date', 'choice', 'person', 'boolean'] as const;

type FieldType = (typeof types)[number];

const complete: Readonly<Record<FieldType, FilterCondition>> = {
  text: { field: 'title', operator: 'contains', value: 'sea' },
  number: { field: 'pages', operator: 'between', value: { min: 150, max: 300 } },
  date: { field: 'published', operator: 'after', value: '2020-01-01' },
  choice: { field: 'genre', operator: 'any-of', value: ['history', 'travel'] },
  person: { field: 'readers', operator: 'none-of', value: ['jon'] },
  boolean: { field: 'isAvailable', operator: 'equals', value: false },
};

const incomplete: Readonly<Record<FieldType, FilterCondition>> = {
  text: { field: 'title', operator: 'starts-with', value: '' },
  number: { field: 'pages', operator: 'at-least', value: null },
  date: { field: 'published', operator: 'between', value: null },
  // Saved without their lists: the editor shows an empty list to fill.
  choice: { field: 'genre', operator: 'none-of', value: null },
  person: { field: 'readers', operator: 'any-of', value: null },
  boolean: { field: 'isAvailable', operator: 'equals', value: null },
};

function Catalogue() {
  const [filters, setFilters] = useState<FilterCondition[]>([
    { field: 'genre', operator: 'any-of', value: ['history', 'travel'] },
  ]);
  const [query, setQuery] = useState('');
  const matches = createFilterMatcher({
    conditions: filters,
    fields: bookFields,
    getValue: getBookValue,
  });
  const books = sampleBooks.filter(
    (book) => matches(book) && book.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div data-lab-demo="catalogue" style={{ maxWidth: 760 }}>
      <FilterBar
        aria-label="Book filters"
        fields={bookFields}
        value={filters}
        onChange={setFilters}
        search={
          <SearchField
            label="Search books"
            placeholder="Search books"
            size="sm"
            value={query}
            onChange={setQuery}
          />
        }
      />
      <p data-lab-count>{`${books.length} of ${sampleBooks.length} books`}</p>
      <ul data-lab-results>
        {books.map((book) => (
          <li key={book.title}>{book.title}</li>
        ))}
      </ul>
      <pre data-lab-value>{JSON.stringify(filters)}</pre>
    </div>
  );
}

const titleField: FilterField = { id: 'title', label: 'Title', type: 'text' };
const publishedField: FilterField = { id: 'published', label: 'Published', type: 'date' };
const pagesRange: FilterField = {
  id: 'pages',
  label: 'Pages',
  type: 'number',
  operators: ['between'],
};
const padded: FilterCondition = { field: 'title', operator: 'equals', value: ' Alpha ' };
const earlyDay: FilterCondition = { field: 'published', operator: 'equals', value: '0099-01-02' };
const earlyDate = new Date(2000, 0, 2, 12);
earlyDate.setFullYear(99);

mountLab(
  <>
    <LabSection
      title="Field types"
      description="One filter per field type, complete and missing its value. A filter missing its value reads only its field and operator and filters nothing; the choice and person ones hold no list at all, and their editors open on an empty one."
    >
      <StateMatrix
        axes={{ type: types, state: ['complete', 'incomplete'] }}
        render={({ type, state }) => (
          <div style={column}>
            <FilterBar
              aria-label={`${type} filter, ${state}`}
              fields={bookFields}
              defaultValue={[(state === 'complete' ? complete : incomplete)[type]]}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Empty and many"
      description="No filters shows only the add menu; several filters wrap and end with Clear all."
    >
      <StateMatrix
        axes={{ filters: ['none', 'several'] }}
        render={({ filters }) => (
          <div style={column}>
            <FilterBar
              aria-label={`Filters, ${filters}`}
              fields={bookFields}
              defaultValue={filters === 'none' ? [] : Object.values(complete).slice(0, 4)}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Filtering a catalogue"
      description="A search field in the search slot and the filters narrow a list of books through createFilterMatcher. Add a filter, edit a chip, remove one or clear all."
    >
      <Catalogue />
    </LabSection>
    <LabSection
      title="Matching helpers"
      description="Text compares without case but as written, spaces included; a Date in any year from 1 to 9999 reads as its four-digit day; each new condition gets its own empty range."
    >
      <LabHelperCalls
        calls={[
          [
            "matchesFilterCondition(' ALPHA ', { operator: 'equals', value: ' Alpha ' }, title)",
            String(matchesFilterCondition(' ALPHA ', padded, titleField)),
          ],
          [
            "matchesFilterCondition('Alpha', { operator: 'equals', value: ' Alpha ' }, title)",
            String(matchesFilterCondition('Alpha', padded, titleField)),
          ],
          [
            "matchesFilterCondition(new Date(99, 0, 2), { operator: 'equals', value: '0099-01-02' }, published)",
            String(matchesFilterCondition(earlyDate, earlyDay, publishedField)),
          ],
          [
            'createFilterCondition(pagesRange).value === createFilterCondition(pagesRange).value',
            String(
              createFilterCondition(pagesRange).value === createFilterCondition(pagesRange).value,
            ),
          ],
        ]}
      />
    </LabSection>
    <FilterBarCompletenessCases />
  </>,
);
