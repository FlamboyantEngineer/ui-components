import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { TreeCompare } from '../../src/components/tree-compare/tree-compare.js';
import type { Key } from '../../src/core/props.js';
import type { CompareTreeNode } from '../../src/utils/compare-trees.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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

/** Two baselines of a specification outline, numbered, with statuses compared too. */
function Baselines() {
  const [changesOnly, setChangesOnly] = useState(false);
  return (
    <div data-lab-demo="baselines">
      <TreeCompare
        aria-label="Specification, baseline 1 against baseline 2"
        left={BASELINE_1}
        right={BASELINE_2}
        leftLabel="Baseline 1"
        rightLabel="Baseline 2"
        isEqual={isSameSection}
        renderLabel={renderSection}
        changesOnly={changesOnly}
        onChangesOnlyChange={setChangesOnly}
      />
      <p>{changesOnly ? 'Showing only differences.' : 'Showing every section.'}</p>
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
      description="Numbered sections drawn through renderLabel, a custom isEqual that also compares statuses, and the filter controlled by the owner. Requirement 12 moved from Requirements to Verification; F7 and Shift+F7 step between differences."
    >
      <Baselines />
    </LabSection>
    <LabSection
      title="Product structure"
      description="The expansion controlled from outside with expand all and collapse all. The hub and the headset moved; follow a moved row's arrow button to its other position."
    >
      <ProductStructure />
    </LabSection>
  </>,
);
