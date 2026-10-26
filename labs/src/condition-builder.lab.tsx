import { useState, type CSSProperties } from 'react';
import {
  ConditionBuilder,
  matchesConditionGroup,
  type ConditionGroup,
  type ConditionRule,
} from '../../src/components/condition-builder/condition-builder.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { bookFields, getBookValue, sampleBooks } from './filter-samples.js';

const column: CSSProperties = { width: 640 };

const flat: ConditionGroup = {
  type: 'group',
  id: 'root',
  combinator: 'and',
  rules: [
    { type: 'rule', id: 'genre', field: 'genre', operator: 'any-of', value: ['history', 'travel'] },
    { type: 'rule', id: 'pages', field: 'pages', operator: 'at-most', value: 400 },
  ],
};

const nested: ConditionGroup = {
  type: 'group',
  id: 'root',
  combinator: 'and',
  rules: [
    { type: 'rule', id: 'available', field: 'isAvailable', operator: 'equals', value: true },
    {
      type: 'group',
      id: 'either',
      combinator: 'or',
      rules: [
        { type: 'rule', id: 'title', field: 'title', operator: 'contains', value: 'sea' },
        {
          type: 'rule',
          id: 'published',
          field: 'published',
          operator: 'after',
          value: '2020-01-01',
        },
      ],
    },
  ],
};

const incomplete: ConditionGroup = {
  type: 'group',
  id: 'root',
  combinator: 'or',
  rules: [
    { type: 'rule', id: 'title', field: 'title', operator: 'starts-with', value: '' },
    { type: 'rule', id: 'pages', field: 'pages', operator: 'greater-than', value: 2000 },
  ],
};

const states = {
  empty: { type: 'group', id: 'root', combinator: 'and', rules: [] },
  flat,
  nested,
  invalid: incomplete,
} as const satisfies Record<string, ConditionGroup>;

/** Refuses page counts above any real book, to show a caller's validation message. */
function validatePages(rule: ConditionRule): string | null {
  const isTooLong = rule.field === 'pages' && typeof rule.value === 'number' && rule.value > 1500;
  return isTooLong ? 'Books in this catalogue have at most 1,500 pages.' : null;
}

function LiveQuery() {
  const [tree, setTree] = useState<ConditionGroup>(nested);
  const books = sampleBooks.filter((book) =>
    matchesConditionGroup(book, tree, { fields: bookFields, getValue: getBookValue }),
  );
  return (
    <div data-lab-demo="live" style={{ maxWidth: 760 }}>
      <ConditionBuilder
        aria-label="Book conditions"
        fields={bookFields}
        value={tree}
        onChange={setTree}
        validate={validatePages}
      />
      <p data-lab-count>{`${books.length} of ${sampleBooks.length} books`}</p>
      <ul data-lab-results>
        {books.map((book) => (
          <li key={book.title}>{book.title}</li>
        ))}
      </ul>
      <pre data-lab-value>{JSON.stringify(tree, null, 1)}</pre>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="An empty group, a flat group, a nested any group, and rules with a missing value and a value the caller's validation refuses."
    >
      <StateMatrix
        axes={{ state: Object.keys(states) as Array<keyof typeof states> }}
        render={({ state }) => (
          <div style={column}>
            <ConditionBuilder
              aria-label={`Conditions, ${state}`}
              fields={bookFields}
              defaultValue={states[state]}
              validate={validatePages}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Depth limit"
      description="With maxDepth 2, a nested group offers Add rule but no Add group."
    >
      <div style={column} data-lab-demo="depth">
        <ConditionBuilder
          aria-label="Conditions, two levels"
          fields={bookFields}
          defaultValue={nested}
          maxDepth={2}
        />
      </div>
    </LabSection>
    <LabSection
      title="Filtering a catalogue"
      description="The tree narrows a list of books through matchesConditionGroup. Add, duplicate, move (Alt+Arrow keys on a menu button) and delete rules and groups."
    >
      <LiveQuery />
    </LabSection>
  </>,
);
