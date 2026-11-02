import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

export interface Place {
  id: string;
  name: string;
  children?: Place[];
  /** Children exist but load on demand. */
  isLazy?: boolean;
}

export const places: Place[] = [
  {
    id: 'europe',
    name: 'Europe',
    children: [
      {
        id: 'norway',
        name: 'Norway',
        children: [
          { id: 'oslo', name: 'Oslo' },
          { id: 'bergen', name: 'Bergen' },
          { id: 'tromso', name: 'Tromsø' },
        ],
      },
      {
        id: 'portugal',
        name: 'Portugal',
        children: [
          { id: 'lisbon', name: 'Lisbon' },
          { id: 'porto', name: 'Porto' },
        ],
      },
    ],
  },
  {
    id: 'americas',
    name: 'Americas',
    children: [
      { id: 'peru', name: 'Peru', children: [{ id: 'lima', name: 'Lima' }] },
      { id: 'ecuador', name: 'Ecuador', children: [{ id: 'quito', name: 'Quito' }] },
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    children: [{ id: 'senegal', name: 'Senegal', children: [{ id: 'dakar', name: 'Dakar' }] }],
  },
];

export const getTextValue = (place: Place) => place.name;
const modes = ['single', 'multiple'] as const;
const displays = ['label', 'path'] as const;

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function StateSample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState<Key | null>(state, {
    value: 'oslo',
    edited: 'lisbon',
    invalid: 'dakar',
    warning: 'quito',
    empty: null,
  });
  return (
    <SelectField
      mode="tree"
      {...props}
      label={`Office, ${state}`}
      labelLayout={layout}
      items={places}
      getTextValue={getTextValue}
    />
  );
}

function DisplaySample({
  mode,
  display,
}: {
  mode: (typeof modes)[number];
  display: (typeof displays)[number];
}) {
  const label = `Places, ${mode}, ${display}`;
  return mode === 'single' ? (
    <SelectField
      mode="tree"
      label={label}
      items={places}
      getTextValue={getTextValue}
      valueDisplay={display}
      defaultValue="bergen"
    />
  ) : (
    <SelectField
      mode="tree"
      label={label}
      items={places}
      getTextValue={getTextValue}
      valueDisplay={display}
      selectionMode="multiple"
      defaultValue={['portugal', 'lisbon', 'porto', 'quito']}
    />
  );
}

function SingleChoice() {
  const [value, setValue] = useState<Key | null>(null);
  return (
    <>
      <SelectField
        mode="tree"
        label="Office"
        items={places}
        getTextValue={getTextValue}
        value={value}
        onChange={setValue}
        valueDisplay="path"
        isClearable
        data-lab-field="single"
      />
      <Output name="single" value={String(value)} />
    </>
  );
}

function MultipleChoice({ propagation }: { propagation: boolean }) {
  const [value, setValue] = useState<Key[]>([]);
  const name = propagation ? 'cascade' : 'independent';
  return (
    <>
      <SelectField
        mode="tree"
        label={propagation ? 'Regions' : 'Stops'}
        items={places}
        getTextValue={getTextValue}
        selectionMode="multiple"
        selectionPropagation={propagation}
        selectableBranches={!propagation}
        value={value}
        onChange={setValue}
        data-lab-field={name}
      />
      <Output name={name} value={value.join(', ') || 'none'} />
    </>
  );
}

/** A press on a branch opens it; only leaves are chosen, unless branches are selectable. */
function BranchChoice({ selectable }: { selectable: boolean }) {
  const [value, setValue] = useState<Key | null>(null);
  const name = selectable ? 'branches' : 'leaves';
  return (
    <>
      <SelectField
        mode="tree"
        label={selectable ? 'Area' : 'City'}
        items={places}
        getTextValue={getTextValue}
        selectableBranches={selectable}
        valueDisplay="path"
        value={value}
        onChange={setValue}
        data-lab-field={name}
      />
      <Output name={name} value={String(value)} />
    </>
  );
}

function PrimitiveKeys() {
  return (
    <SelectField
      mode="tree"
      label="Kinds"
      items={[
        { id: 1, name: 'Numeric' },
        { id: '1', name: 'Textual' },
      ]}
      getTextValue={(item) => item.name}
      selectionMode="multiple"
      selectionPropagation={false}
      defaultValue={[1, '1']}
      name="kinds"
    />
  );
}

const lazyRoots: Place[] = [
  { id: 'asia', name: 'Asia', isLazy: true },
  { id: 'oceania', name: 'Oceania', isLazy: true },
];

const lazyChildren: Record<string, Place[]> = {
  asia: [
    { id: 'nepal', name: 'Nepal' },
    { id: 'vietnam', name: 'Vietnam' },
  ],
  oceania: [{ id: 'fiji', name: 'Fiji' }],
};

function LazyBranches() {
  const [items, setItems] = useState(lazyRoots);
  const [value, setValue] = useState<Key | null>('vietnam');
  const load = (place: Place) =>
    new Promise<void>((resolve) => {
      window.setTimeout(() => {
        setItems((current) =>
          current.map((root) =>
            root.id === place.id
              ? { ...root, isLazy: false, children: lazyChildren[root.id] }
              : root,
          ),
        );
        resolve();
      }, 400);
    });
  return (
    <>
      <SelectField
        mode="tree"
        label="Destination"
        items={items}
        getTextValue={getTextValue}
        hasChildItems={(place) => Boolean(place.isLazy)}
        onLoadChildren={load}
        value={value}
        onChange={setValue}
        data-lab-field="lazy"
      />
      <Output name="lazy" value={String(value)} />
    </>
  );
}

/** A chosen branch takes along a child added after it was chosen. */
function GrowingBranch() {
  const [children, setChildren] = useState<Place[]>([{ id: 'alpha', name: 'Alpha' }]);
  const [value, setValue] = useState<Key[]>(['team', 'alpha']);
  return (
    <>
      <SelectField
        mode="tree"
        selectionMode="multiple"
        label="Team"
        items={[{ id: 'team', name: 'Whole team', children }]}
        getTextValue={getTextValue}
        selectableBranches
        value={value}
        onChange={setValue}
        data-lab-field="growing"
      />
      <button
        type="button"
        disabled={children.length > 1}
        onClick={() => setChildren((current) => [...current, { id: 'blue', name: 'Blue' }])}
      >
        Add Blue
      </button>
      <Output name="growing" value={value.join(', ')} />
    </>
  );
}

export const treeChoices = (
  <div data-lab-family="tree">
    <LabSection
      title="Tree choices: Field states"
      description="Every field state in every label layout."
    >
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <StateSample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Tree choices: Choice and display"
      description="Single and multiple choice, read as labels or as paths; a chosen branch shows as one chip. Labels name the selected nodes; paths include their ancestors, and removing a branch keeps the other choices."
    >
      <StateMatrix
        axes={{ mode: modes, display: displays }}
        render={({ mode, display }) => <DisplaySample mode={mode} display={display} />}
      />
    </LabSection>
    <LabSection
      title="Tree choices: Single choice"
      description="Search keeps each match's ancestors; Down moves from the search to the tree; a press, Enter or Space on a leaf chooses it and closes, and on a branch opens or closes it."
    >
      <SingleChoice />
    </LabSection>
    <LabSection
      title="Tree choices: Multiple choice"
      description="Cascading checkboxes choose a branch's leaves, and a branch whose leaves are all chosen reads as one chip; without cascading, each row, branches included, is chosen on its own. Chips remove a branch or a row."
    >
      <MultipleChoice propagation />
      <MultipleChoice propagation={false} />
    </LabSection>
    <LabSection
      title="Tree choices: Branches and leaves"
      description="A press on a branch opens or closes it, so only leaves are chosen; with selectableBranches, a press on an open branch chooses it."
    >
      <BranchChoice selectable={false} />
      <BranchChoice selectable />
    </LabSection>
    <LabSection
      title="Tree choices: Primitive keys"
      description="Numeric and text ids keep distinct chips and form inputs."
    >
      <PrimitiveKeys />
    </LabSection>
    <LabSection
      title="Tree choices: Lazy branches"
      description="Branches load their children when expanded; the chosen key reads as itself until its node loads."
    >
      <LazyBranches />
    </LabSection>
    <LabSection
      title="Tree choices: Growing branch"
      description="A chosen branch takes along a child added later, so the branch is never claimed whole while a child is left out."
    >
      <GrowingBranch />
    </LabSection>
  </div>
);
