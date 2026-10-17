import { useState } from 'react';
import { ExpandToggle } from '../../src/components/expand-toggle/expand-toggle.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = ['collapsed', 'expanded', 'disabled', 'leaf'] as const;

interface FruitNode {
  name: string;
  children?: FruitNode[];
}

const fruit: FruitNode[] = [
  { name: 'Citrus', children: [{ name: 'Lemon' }, { name: 'Orange' }, { name: 'Lime' }] },
  { name: 'Berries', children: [{ name: 'Strawberry' }, { name: 'Blueberry' }] },
  { name: 'Banana' },
];

function Row({
  node,
  depth,
  onOpen,
}: {
  node: FruitNode;
  depth: number;
  onOpen: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li>
      <div
        data-lab-row={node.name}
        style={{ display: 'flex', alignItems: 'center', gap: 4, paddingInlineStart: depth * 20 }}
        onClick={() => onOpen(node.name)}
      >
        <ExpandToggle
          isExpandable={Boolean(node.children)}
          isExpanded={expanded}
          onExpandedChange={setExpanded}
          aria-controls={node.children ? `group-${node.name}` : undefined}
        />
        <span>{node.name}</span>
      </div>
      {node.children && expanded ? (
        <ul id={`group-${node.name}`} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {node.children.map((child) => (
            <Row key={child.name} node={child} depth={depth + 1} onOpen={onOpen} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function FruitTree() {
  const [opened, setOpened] = useState('none');
  return (
    <div data-lab-case="tree">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {fruit.map((node) => (
          <Row key={node.name} node={node} depth={0} onOpen={setOpened} />
        ))}
      </ul>
      <p>
        Last row clicked: <output data-lab-output="opened">{opened}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection title="Sizes and states" description="A leaf keeps an empty box of the same size.">
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => (
          <ExpandToggle
            size={size}
            defaultExpanded={state === 'expanded'}
            isDisabled={state === 'disabled'}
            isExpandable={state !== 'leaf'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Rows"
      description="Clicking a row's label counts as opening it; its toggle expands it without opening it. Leaves stay aligned with their siblings."
    >
      <FruitTree />
    </LabSection>
  </>,
);
