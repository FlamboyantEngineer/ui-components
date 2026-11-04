import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { TreeCompare } from '../../src/components/tree-compare/tree-compare.js';
import type { Key } from '../../src/core/props.js';
import type { CompareTreeNode } from '../../src/utils/compare-trees.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

interface Section extends CompareTreeNode {
  number: string;
  status?: 'draft' | 'approved';
  children?: Section[];
}

interface Part extends CompareTreeNode {
  children?: Part[];
}

const section = (
  id: string,
  number: string,
  label: string,
  rest: Partial<Pick<Section, 'status' | 'children'>> = {},
): Section => ({ id, number, label, ...rest });

const BASELINE_1: Section[] = [
  section('scope', '1', 'Scope'),
  section('reqs', '2', 'Requirements', {
    children: [
      section('r10', '2.1', 'Requirement 10: Start-up time', { status: 'approved' }),
      section('r11', '2.2', 'Requirement 11: Power draw', { status: 'draft' }),
      section('r12', '2.3', 'Requirement 12: Operating range', { status: 'approved' }),
    ],
  }),
  section('verify', '3', 'Verification', {
    children: [section('bench', '3.1', 'Bench tests'), section('field', '3.2', 'Field trials')],
  }),
  section('glossary', '4', 'Glossary'),
];

const BASELINE_2: Section[] = [
  section('scope', '1', 'Scope'),
  section('reqs', '2', 'Requirements', {
    children: [
      section('r10', '2.1', 'Requirement 10: Start-up time', { status: 'approved' }),
      section('r11', '2.2', 'Requirement 11: Power draw', { status: 'approved' }),
      section('r13', '2.3', 'Requirement 13: Storage temperature', { status: 'draft' }),
    ],
  }),
  section('verify', '3', 'Verification', {
    children: [
      section('field', '3.1', 'Field trials'),
      section('r12', '3.2', 'Requirement 12: Operating range', { status: 'approved' }),
      section('bench', '3.3', 'Bench tests'),
    ],
  }),
];

const BIKE_A: Part[] = [
  {
    id: 'frame',
    label: 'Frame set',
    children: [
      { id: 'frame-body', label: 'Frame, aluminium' },
      { id: 'fork', label: 'Fork' },
      { id: 'headset', label: 'Headset' },
    ],
  },
  {
    id: 'wheels',
    label: 'Wheels',
    children: [
      { id: 'rim', label: 'Rim, 29 inch' },
      { id: 'tyre', label: 'Tyre, 2.2 inch' },
      { id: 'hub', label: 'Hub' },
    ],
  },
  {
    id: 'drive',
    label: 'Drivetrain',
    children: [
      { id: 'chain', label: 'Chain' },
      { id: 'crank', label: 'Crank set' },
    ],
  },
];

const BIKE_B: Part[] = [
  {
    id: 'frame',
    label: 'Frame set',
    children: [
      { id: 'frame-body', label: 'Frame, carbon' },
      { id: 'fork', label: 'Fork' },
    ],
  },
  {
    id: 'wheels',
    label: 'Wheels',
    children: [
      { id: 'rim', label: 'Rim, 29 inch' },
      { id: 'tyre', label: 'Tyre, 2.4 inch' },
    ],
  },
  {
    id: 'drive',
    label: 'Drivetrain',
    children: [
      { id: 'hub', label: 'Hub' },
      { id: 'chain', label: 'Chain' },
      { id: 'crank', label: 'Crank set' },
      { id: 'cassette', label: 'Cassette, 12 speed' },
    ],
  },
  { id: 'cockpit', label: 'Cockpit', children: [{ id: 'headset', label: 'Headset' }] },
];

const ALL_PARTS = ['frame', 'wheels', 'drive', 'cockpit'];

function createNestedRevision(label: string): CompareTreeNode[] {
  let nodes: CompareTreeNode[] = [{ id: 'leaf', label }];
  for (let level = 10; level >= 0; level -= 1) {
    nodes = [{ id: `level-${level}`, label: `Level ${level}`, children: nodes }];
  }
  return nodes;
}

const nestedBefore = createNestedRevision('Earlier leaf');
const nestedAfter = createNestedRevision('Revised leaf');

/** Sections are equal when their title and their status match. */
const isSameSection = (left: Section, right: Section) =>
  left.label === right.label && left.status === right.status;

function renderSection(node: Section) {
  return (
    <>
      {`${node.number} ${node.label}`}{' '}
      {node.status ? (
        <Badge tone={node.status === 'approved' ? 'success' : 'neutral'} announce={false}>
          {node.status}
        </Badge>
      ) : null}
    </>
  );
}

/** A fresh copy of every node, as a parent that rebuilds its data on each render passes. */
function copySections<T extends { children?: readonly T[] | undefined }>(nodes: readonly T[]): T[] {
  return nodes.map((node) => ({ ...node, children: node.children && copySections(node.children) }));
}

/**
 * Two baselines of a specification outline, numbered, with statuses compared too. The parent
 * rebuilds both trees on every render, and equal trees keep the reader's expansion.
 */
function Baselines() {
  const [changesOnly, setChangesOnly] = useState(false);
  const [refreshes, setRefreshes] = useState(0);
  return (
    <div data-lab-demo="baselines">
      <TreeCompare
        aria-label="Specification, baseline 1 against baseline 2"
        left={copySections(BASELINE_1)}
        right={copySections(BASELINE_2)}
        leftLabel="Baseline 1"
        rightLabel="Baseline 2"
        isEqual={isSameSection}
        renderLabel={renderSection}
        changesOnly={changesOnly}
        onChangesOnlyChange={setChangesOnly}
      />
      <p>{changesOnly ? 'Showing only differences.' : 'Showing every section.'}</p>
      <Button size="sm" onPress={() => setRefreshes(refreshes + 1)}>
        Reload the same baselines
      </Button>
      <output data-lab-output="refreshes">{`Reloaded ${refreshes} times`}</output>
    </div>
  );
}

/** Two revisions of a product structure, with the expansion controlled from outside. */
function ProductStructure() {
  const [expanded, setExpanded] = useState<Set<Key>>(new Set(['drive', 'cockpit']));
  return (
    <div data-lab-demo="parts">
      <Button size="sm" onPress={() => setExpanded(new Set(ALL_PARTS))}>
        Expand all
      </Button>{' '}
      <Button size="sm" onPress={() => setExpanded(new Set())}>
        Collapse all
      </Button>
      <TreeCompare
        aria-label="Bicycle, revision A against revision B"
        left={BIKE_A}
        right={BIKE_B}
        leftLabel="Revision A"
        rightLabel="Revision B"
        expandedKeys={expanded}
        onExpandedChange={setExpanded}
      />
    </div>
  );
}

const starts = {
  changed: { label: 'Paths to changes (default)', keys: undefined },
  none: { label: 'All collapsed', keys: [] },
  some: { label: 'Wheels and Level 0', keys: ['wheels', 'level-0'] },
} as const satisfies Record<string, { label: string; keys: readonly Key[] | undefined }>;

type StartChoice = keyof typeof starts;

const isStartChoice = (value: unknown): value is StartChoice =>
  typeof value === 'string' && Object.hasOwn(starts, value);

/** The parts and a nested branch in one comparison, so a starting set can open both. */
const startLeft: CompareTreeNode[] = [...BIKE_A, ...nestedBefore];
const startRight: CompareTreeNode[] = [...BIKE_B, ...nestedAfter];

/**
 * The starting expansion of an uncontrolled comparison (`defaultExpandedKeys`): every row closed,
 * or a chosen subset, instead of the paths to changes. The reader expands and collapses from there;
 * Start again remounts the comparison at the chosen set.
 */
function StartingExpansion() {
  const [start, setStart] = useState<StartChoice>('none');
  const [mount, setMount] = useState(0);
  const [expanded, setExpanded] = useState<string>('not changed yet');
  return (
    <div data-lab-demo="starting-expansion">
      <SegmentedChoice
        aria-label="Start with"
        size="sm"
        sizing="content"
        options={Object.entries(starts).map(([value, { label }]) => ({ value, label }))}
        value={start}
        onChange={(value) => {
          if (!isStartChoice(value)) return;
          setStart(value);
          setExpanded('not changed yet');
        }}
      />
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setMount(mount + 1);
          setExpanded('not changed yet');
        }}
      >
        Start again
      </Button>
      <TreeCompare
        key={`${start}-${mount}`}
        aria-label="Bicycle and nested levels, starting expansion"
        left={startLeft}
        right={startRight}
        leftLabel="Earlier"
        rightLabel="Later"
        defaultExpandedKeys={starts[start].keys}
        onExpandedChange={(keys) => setExpanded([...keys].map(String).join(', ') || 'none')}
      />
      <p>
        Expanded: <output data-lab-output="expanded">{expanded}</output>
      </p>
    </div>
  );
}

/** Equal deeply nested data can be rebuilt while the visible rows keep their expansion. */
function RebuiltDeepTree() {
  const [refreshes, setRefreshes] = useState(0);
  const create = (): CompareTreeNode[] => {
    let nodes: CompareTreeNode[] = [];
    for (let id = 99; id >= 0; id--) nodes = [{ id, label: `Node ${id}`, children: nodes }];
    return nodes;
  };
  return (
    <div data-lab-demo="rebuilt-deep-tree">
      <Button onPress={() => setRefreshes((count) => count + 1)}>Reload the deep hierarchy</Button>
      <output data-lab-output="refreshes">{refreshes}</output>
      <TreeCompare aria-label="Deep hierarchy" left={create()} right={create()} />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Two revisions with every kind of difference, and two identical revisions, showing every row or only the differences. Rows with a difference below them start expanded."
    >
      <StateMatrix
        axes={{ trees: ['different', 'identical'], filter: ['all rows', 'only differences'] }}
        render={({ trees, filter }) => (
          <TreeCompare
            aria-label={`Parts, ${trees}, ${filter}`}
            left={BIKE_A}
            right={trees === 'different' ? BIKE_B : BIKE_A}
            defaultChangesOnly={filter === 'only differences'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Baselines of an outline"
      description="Numbered sections drawn through renderLabel, a custom isEqual that also compares statuses, and the filter controlled by the owner. The owner rebuilds both trees on every render, and Reload the same baselines re-renders it: equal trees keep the rows you expanded or collapsed. Requirement 12 moved from Requirements to Verification; F7 and Shift+F7 step between differences."
    >
      <Baselines />
    </LabSection>
    <LabSection
      title="Product structure"
      description="The expansion controlled from outside with expand all and collapse all. The hub and the headset moved; follow a moved row's arrow button to its other position."
    >
      <ProductStructure />
    </LabSection>
    <LabSection
      title="Starting expansion"
      description="defaultExpandedKeys sets which rows an uncontrolled comparison opens with: every row closed with an empty set, or Wheels and Level 0 only, rather than the paths to each change. Expand and collapse rows from there; Start again remounts it at the chosen set."
    >
      <StartingExpansion />
    </LabSection>
    <LabSection
      title="Rebuilt deep hierarchy"
      description="One hundred nested unchanged nodes start collapsed. Reload their data after expanding a row: the visible expansion stays. The comparison helpers handle twenty thousand levels; React's nested collection commits impose a separate limit on the rendered widget's depth."
    >
      <RebuiltDeepTree />
    </LabSection>
    <LabSection
      title="Nested changes"
      description="A change at the end of a nested branch keeps its ancestor rows visible; stepping to the difference expands that path."
    >
      <TreeCompare
        aria-label="Nested changes"
        left={nestedBefore}
        right={nestedAfter}
        data-lab-demo="nested"
      />
    </LabSection>
  </>,
);
