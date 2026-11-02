import { useMemo, useState } from 'react';
import {
  ConditionBuilder,
  createConditionMatcher,
  matchesConditionGroup,
  type ConditionGroup,
} from '../../src/components/condition-builder/condition-builder.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { bookFields, getBookValue, sampleBooks } from './filter-samples.js';

/** All of: available, and any of a title rule still being written or a recent publication. */
const startingTree: ConditionGroup = {
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
        { type: 'rule', id: 'title', field: 'title', operator: 'starts-with', value: '' },
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

const options = { fields: bookFields, getValue: getBookValue };

/** The same tree through the reusable matcher and the one-shot helper, book by book. */
function BothMatchers() {
  const [tree, setTree] = useState<ConditionGroup>(startingTree);
  const compiled = useMemo(() => createConditionMatcher({ group: tree, ...options }), [tree]);
  const rows = sampleBooks.map((book) => ({
    title: book.title,
    compiled: compiled(book),
    oneShot: matchesConditionGroup(book, tree, options),
  }));
  const agree = rows.every((row) => row.compiled === row.oneShot);
  return (
    <div data-lab-demo="matchers" style={{ maxWidth: 760 }}>
      <ConditionBuilder
        aria-label="Matcher conditions"
        fields={bookFields}
        value={tree}
        onChange={setTree}
      />
      <table data-lab-matcher-table="">
        <caption>Each book through both helpers</caption>
        <thead>
          <tr>
            <th scope="col">Book</th>
            <th scope="col">createConditionMatcher</th>
            <th scope="col">matchesConditionGroup</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.title} data-lab-book={row.title}>
              <th scope="row">{row.title}</th>
              <td>{row.compiled ? 'matches' : 'no'}</td>
              <td>{row.oneShot ? 'matches' : 'no'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <LabOutput name="matched">
        {String(rows.filter((row) => row.compiled).length)} of {String(rows.length)}
      </LabOutput>
      <LabOutput name="agree">{agree ? 'yes' : 'no'}</LabOutput>
    </div>
  );
}

export function ConditionBuilderMatcherCases() {
  return (
    <LabSection
      title="One-shot and compiled matchers"
      description="createConditionMatcher compiles the tree once into a test to run over many records; matchesConditionGroup tests one record in one call. Edit the tree, including the nested Any group and its title rule that has no value yet, which neither helper counts: both columns stay the same."
    >
      <BothMatchers />
    </LabSection>
  );
}
