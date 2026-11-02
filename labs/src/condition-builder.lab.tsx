import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowDownGlyph, ArrowUpGlyph, DeleteGlyph } from '../../src/core/glyphs.js';
import {
  ConditionBuilder,
  createConditionMatcher,
  type ConditionGroup,
  type ConditionRule,
} from '../../src/components/condition-builder/condition-builder.js';
import type { FilterField } from '../../src/components/filter-bar/filter-bar.js';
import { ConditionBuilderMatcherCases } from './condition-builder-matcher-cases.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { bookFields, getBookValue, sampleBooks } from './filter-samples.js';

const column: CSSProperties = { width: 640 };

/** The sample fields with a choice of long labels, to show chips wrapping inside the field. */
const chipFields: readonly FilterField[] = [
  ...bookFields,
  {
    id: 'shelf',
    label: 'Shelf',
    type: 'choice',
    options: [
      { value: 'north', label: 'North reading room, upper gallery' },
      { value: 'south', label: 'South reading room, rare books cabinet' },
      { value: 'annex', label: 'Annex storage, second basement' },
    ],
  },
];

const chosenValues = {
  empty: { genre: [], readers: [], shelf: [] },
  some: { genre: ['history'], readers: ['jon'], shelf: ['north'] },
  many: {
    genre: ['fiction', 'history', 'science', 'travel', 'cooking'],
    readers: ['maria', 'jon', 'lena', 'sam'],
    shelf: ['north', 'south', 'annex'],
  },
} as const;

/** One any-of rule per multiple-value field, each holding `amount` chosen values. */
function chipTree(amount: keyof typeof chosenValues): ConditionGroup {
  const values = chosenValues[amount];
  return {
    type: 'group',
    id: 'root',
    combinator: 'and',
    rules: (['genre', 'readers', 'shelf'] as const).map((field) => ({
      type: 'rule',
      id: field,
      field,
      operator: 'any-of',
      value: [...values[field]],
    })),
  };
}

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
  const matches = useMemo(
    () => createConditionMatcher({ group: tree, fields: bookFields, getValue: getBookValue }),
    [tree],
  );
  const books = sampleBooks.filter(matches);
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

/** Saves the tree and restores it into a fresh builder, which adds nodes under ids of its own. */
function SavedTree() {
  const [saved, setSaved] = useState<ConditionGroup>(nested);
  const [tree, setTree] = useState<ConditionGroup>(nested);
  const [restores, setRestores] = useState(0);
  const ids = JSON.stringify(tree).match(/"id":"[^"]+"/g) ?? [];
  return (
    <div data-lab-demo="saved" style={{ maxWidth: 760 }}>
      <ConditionBuilder
        key={restores}
        aria-label="Saved conditions"
        fields={bookFields}
        defaultValue={saved}
        onChange={setTree}
      />
      <button type="button" onClick={() => setSaved(tree)}>
        Save the tree
      </button>{' '}
      <button
        type="button"
        onClick={() => {
          setTree(saved);
          setRestores((count) => count + 1);
        }}
      >
        Restore the saved tree
      </button>
      <p data-lab-unique>{`${new Set(ids).size} of ${ids.length} ids unique`}</p>
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
      title="Menu buttons and context menus"
      description="Every rule and nested group also opens its actions as a context menu: right-click it, touch and hold it, or press Shift+F10 or the Context Menu key on it. Fields keep their own menus. Without menu buttons, Tab stops on each rule and group instead, where Alt+Arrow keys move it."
    >
      <StateMatrix
        axes={{ buttons: ['shown', 'hidden'] }}
        render={({ buttons }) => (
          <div style={column}>
            <ConditionBuilder
              aria-label={`Conditions, buttons ${buttons}`}
              fields={bookFields}
              defaultValue={nested}
              showActionButtons={buttons === 'shown'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Menu icons"
      description="The actions have no icons by default. Here the host gives Move up, Move down and Delete icons and leaves Duplicate without one: open a rule's menu button or right-click the rule. Every label stays in line and each action still works."
    >
      <div style={column} data-lab-demo="menu-icons">
        <ConditionBuilder
          aria-label="Conditions, menu icons"
          fields={bookFields}
          defaultValue={nested}
          menuIcons={{ 'move-up': ArrowUpGlyph, 'move-down': ArrowDownGlyph, delete: DeleteGlyph }}
        />
      </div>
    </LabSection>
    <LabSection
      title="Multiple values"
      description="Choice and people values show their chosen values as chips inside the value field, before its search or trigger: none, some and many, with long labels, in a wide and a narrow builder. Arrow keys move between chips and Delete removes one."
    >
      <StateMatrix
        axes={{
          values: Object.keys(chosenValues) as Array<keyof typeof chosenValues>,
          width: ['640', '360'],
        }}
        render={({ values, width }) => (
          <div style={{ width: Number(width) }}>
            <ConditionBuilder
              aria-label={`Conditions, ${values} values, ${width}`}
              fields={chipFields}
              defaultValue={chipTree(values)}
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
      title="Right to left"
      description="In a right-to-left page the nesting rail of each group runs down its start edge, on the right."
    >
      <div dir="rtl" style={column} data-lab-demo="rtl">
        <ConditionBuilder
          aria-label="Conditions, right to left"
          fields={bookFields}
          defaultValue={nested}
        />
      </div>
    </LabSection>
    <LabSection
      title="Restoring a saved tree"
      description="Add a rule, save the tree, restore it into a fresh builder and add another: every node keeps an id of its own."
    >
      <SavedTree />
    </LabSection>
    <LabSection
      title="Filtering a catalogue"
      description="The tree narrows a list of books through a matcher made once per tree with createConditionMatcher. Add, duplicate, move (Alt+Arrow keys on a menu button) and delete rules and groups, from their menu buttons or context menus."
    >
      <LiveQuery />
    </LabSection>
    <ConditionBuilderMatcherCases />
  </>,
);
