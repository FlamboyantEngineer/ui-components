import { useState } from 'react';
import {
  createFilterMatcher,
  FilterBar,
  type FilterCondition,
  isFilterConditionComplete,
} from '../../src/components/filter-bar/filter-bar.js';
import { LabSection } from './chrome/index.js';
import { bookFields, getBookValue, sampleBooks } from './filter-samples.js';
import { LabOutput } from './lab-output.js';

/** A mix: a value still to type, an operator that needs none, a half range and a full list. */
const startingConditions: FilterCondition[] = [
  { field: 'title', operator: 'starts-with', value: '' },
  { field: 'published', operator: 'not-empty', value: null },
  { field: 'pages', operator: 'between', value: { min: 150, max: null } },
  { field: 'genre', operator: 'any-of', value: ['history', 'travel'] },
];

/** Each condition with whether it is complete, and the books only the complete ones narrow. */
function Completeness() {
  const [conditions, setConditions] = useState<FilterCondition[]>(startingConditions);
  const matches = createFilterMatcher({ conditions, fields: bookFields, getValue: getBookValue });
  return (
    <div data-lab-demo="completeness" style={{ maxWidth: 760 }}>
      <FilterBar
        aria-label="Completeness filters"
        fields={bookFields}
        value={conditions}
        onChange={setConditions}
      />
      <ol data-lab-output="complete">
        {conditions.map((condition, index) => {
          const field = bookFields.find((candidate) => candidate.id === condition.field);
          const isComplete = field ? isFilterConditionComplete(condition, field) : false;
          return (
            <li key={index} data-lab-condition={condition.field}>
              {`${field?.label ?? String(condition.field)} ${condition.operator} ${JSON.stringify(condition.value)}: ${isComplete ? 'complete' : 'incomplete'}`}
            </li>
          );
        })}
      </ol>
      <LabOutput name="books">
        {`${String(sampleBooks.filter(matches).length)} of ${String(sampleBooks.length)}`}
      </LabOutput>
    </div>
  );
}

export function FilterBarCompletenessCases() {
  return (
    <LabSection
      title="Complete and incomplete conditions"
      description="isFilterConditionComplete says whether a condition has every value its operator needs: Is not empty needs none, a page range needs both ends and a title needs text. Only complete conditions narrow the books; fill the title or the range's other end and watch both lists change."
    >
      <Completeness />
    </LabSection>
  );
}
