import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { TreeSelectField } from '../../src/components/tree-select-field/tree-select-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

interface Place {
  id: string;
  name: string;
  children?: Place[];
  /** Children exist but load on demand. */
  isLazy?: boolean;
}

const places: Place[] = [
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

const getTextValue = (place: Place) => place.name;
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
    <TreeSelectField
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
    <TreeSelectField
      label={label}
      items={places}
      getTextValue={getTextValue}
      valueDisplay={display}
      defaultValue="bergen"
    />
  ) : (
    <TreeSelectField
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
      <TreeSelectField
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
      <TreeSelectField
        label={propagation ? 'Regions' : 'Stops'}
        items={places}
        getTextValue={getTextValue}
        selectionMode="multiple"
        selectionPropagation={propagation}
        value={value}
        onChange={setValue}
        data-lab-field={name}
      />
      <Output name={name} value={value.join(', ') || 'none'} />
    </>
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
      <TreeSelectField
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

mountLab(
  <>
    <LabSection title="Field states" description="Every field state in every label layout.">
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <StateSample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Choice and display"
      description="Single and multiple choice, read as labels or as paths; a chosen branch shows as one chip."
    >
      <StateMatrix
        axes={{ mode: modes, display: displays }}
        render={({ mode, display }) => <DisplaySample mode={mode} display={display} />}
      />
    </LabSection>
    <LabSection
      title="Single choice"
      description="Search keeps each match's ancestors; Down moves from the search to the tree; a press, Enter or Space chooses and closes."
    >
      <SingleChoice />
    </LabSection>
    <LabSection
      title="Multiple choice"
      description="Checkboxes cascade through a branch, or choose each row on its own; chips remove a branch or a row."
    >
      <MultipleChoice propagation />
      <MultipleChoice propagation={false} />
    </LabSection>
    <LabSection
      title="Lazy branches"
      description="Branches load their children when expanded; the chosen key reads as itself until its node loads."
    >
      <LazyBranches />
    </LabSection>
  </>,
);
