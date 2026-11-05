import { useRef, useState } from 'react';
import { Disclosure, DisclosurePanel } from '../../src/components/disclosure/disclosure.js';
import { ExpandToggle } from '../../src/components/expand-toggle/expand-toggle.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { ExpandToggleHostCases } from './expand-toggle-host-cases.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = ['collapsed', 'expanded', 'disabled', 'leaf', 'pending'] as const;

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

function LazyRow() {
  const [children, setChildren] = useState<string[] | null>(null);
  const [isPending, setPending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const finish = useRef<(() => void) | null>(null);
  return (
    <div data-lab-case="lazy">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <ExpandToggle
          isExpanded={expanded}
          isPending={isPending}
          pendingLabel="Loading stone fruit"
          aria-controls="lazy-children"
          onExpandedChange={(next) => {
            if (!next || children) {
              setExpanded(next);
              return;
            }
            setPending(true);
            finish.current = () => {
              setChildren(['Cherry', 'Peach', 'Plum']);
              setPending(false);
              setExpanded(true);
            };
          }}
        />
        <span>Stone fruit</span>{' '}
        <button type="button" data-lab-action="finish" onClick={() => finish.current?.()}>
          Finish loading
        </button>
      </div>
      {expanded && children ? (
        <ul id="lazy-children">
          {children.map((child) => (
            <li key={child}>{child}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A disclosure disabled until the reader enables it, with the toggle's reports printed. */
function DisabledDisclosure() {
  const [isDisabled, setDisabled] = useState(true);
  const [reports, setReports] = useState(0);
  return (
    <div data-lab-case="disabled-disclosure">
      <button type="button" onClick={() => setDisabled(!isDisabled)}>
        {isDisabled ? 'Enable the disclosure' : 'Disable the disclosure'}
      </button>
      <Disclosure isDisabled={isDisabled}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ExpandToggle label="Berry details" onExpandedChange={() => setReports(reports + 1)} />
          <span>Berries</span>
        </div>
        <DisclosurePanel>Currants and gooseberries ripen in summer.</DisclosurePanel>
      </Disclosure>
      <output data-lab-output>{`Reported ${reports} changes`}</output>
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
            isPending={state === 'pending'}
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
    <LabSection
      title="Disclosure"
      description="Inside a Disclosure the toggle is its trigger: the disclosure wires its expanded state and aria-controls to the panel."
    >
      <div data-lab-case="disclosure">
        <Disclosure>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ExpandToggle label="Citrus details" />
            <span>Citrus</span>
          </div>
          <DisclosurePanel>Lemon, orange and lime grow in warm climates.</DisclosurePanel>
        </Disclosure>
      </div>
    </LabSection>
    <LabSection
      title="Disabled disclosure"
      description="A disabled Disclosure disables its toggle too: it leaves the tab order and reports nothing until the disclosure is enabled again."
    >
      <DisabledDisclosure />
    </LabSection>
    <LabSection
      title="Loading children"
      description="Expanding a row whose children are not loaded yet shows a busy indicator in the toggle until they arrive."
    >
      <LazyRow />
    </LabSection>
    <ExpandToggleHostCases />
  </>,
);
