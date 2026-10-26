import { useState } from 'react';
import type { Key, Selection } from '../../src/core/props.js';
import {
  Tag,
  TagGroup,
  type TagGroupSize,
  type TagTone,
} from '../../src/components/tag-group/tag-group.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

interface Fruit {
  id: string;
  name: string;
}

const tones = [
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
] as const satisfies readonly TagTone[];
const sizes = ['sm', 'md', 'lg'] as const satisfies readonly TagGroupSize[];
const states = ['read-only', 'removable', 'disabled', 'selected', 'empty'] as const;
const fruit: Fruit[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'pear', name: 'Pear' },
  { id: 'plum', name: 'Plum' },
];

function StateSample({ state, size }: { state: (typeof states)[number]; size: TagGroupSize }) {
  const items = state === 'empty' ? [] : fruit.slice(0, 2);
  return (
    <TagGroup
      aria-label={`Fruit, ${state}`}
      size={size}
      items={items}
      onRemove={state === 'removable' || state === 'disabled' ? () => {} : undefined}
      disabledKeys={state === 'disabled' ? ['pear'] : undefined}
      selectionMode={state === 'selected' ? 'multiple' : undefined}
      defaultSelectedKeys={state === 'selected' ? ['apple'] : undefined}
      renderEmptyState={() => 'No fruit'}
    >
      {(item) => <Tag id={item.id}>{item.name}</Tag>}
    </TagGroup>
  );
}

function Basket() {
  const [items, setItems] = useState(fruit);
  return (
    <>
      <TagGroup
        aria-label="Basket"
        items={items}
        onRemove={(keys) => setItems((current) => current.filter((item) => !keys.has(item.id)))}
        renderEmptyState={() => 'The basket is empty.'}
        data-lab-field="basket"
      >
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>
      <LabOutput name="Basket">{items.map((item) => item.name).join(', ') || 'empty'}</LabOutput>
      <button type="button" onClick={() => setItems(fruit)}>
        Refill
      </button>
    </>
  );
}

function Picker() {
  const [selected, setSelected] = useState<Selection | Iterable<Key>>(() =>
    (function* () {
      yield 'pear';
    })(),
  );
  const names =
    selected === 'all' ? ['all'] : selected instanceof Set ? [...selected].map(String) : ['pear'];
  return (
    <>
      <TagGroup
        aria-label="Favourites"
        items={fruit}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        disallowEmptySelection
        tone="info"
        data-lab-field="picker"
      >
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>
      <LabOutput name="Selected">{names.join(', ') || 'none'}</LabOutput>
    </>
  );
}

function Marked() {
  return (
    <TagGroup aria-label="Cities" tone="neutral" onRemove={() => {}} data-lab-field="marked">
      <Tag id="lisbon">Lisbon</Tag>
      <Tag id="oslo" tone="success" data-change="added">
        Oslo
      </Tag>
      <Tag id="quito" tone="warning">
        Quito
      </Tag>
      <Tag id="lima" textValue="Lima, capital">
        <strong>Lima</strong> (capital)
      </Tag>
    </TagGroup>
  );
}

mountLab(
  <>
    <LabSection
      title="Primitive keys"
      description="Numeric and text ids that read alike remain distinct choices."
    >
      <TagGroup aria-label="Primitive keys" selectionMode="multiple" defaultSelectedKeys={[1]}>
        <Tag id={1}>Numeric</Tag>
        <Tag id="1">Textual</Tag>
      </TagGroup>
    </LabSection>
    <LabSection title="Tones and sizes" description="Removable tags in every tone and size.">
      <StateMatrix
        axes={{ tone: tones, size: sizes }}
        render={({ tone, size }) => (
          <TagGroup aria-label={`Fruit, ${tone}`} tone={tone} size={size} onRemove={() => {}}>
            <Tag id="apple">Apple</Tag>
            <Tag id="pear">Pear</Tag>
          </TagGroup>
        )}
      />
    </LabSection>
    <LabSection
      title="States"
      description="Read-only, removable, with a disabled tag, with a selected tag, and empty."
    >
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => <StateSample state={state} size={size} />}
      />
    </LabSection>
    <LabSection
      title="Removal"
      description="Remove a tag with its button, or focus it and press Delete or Backspace."
    >
      <Basket />
    </LabSection>
    <LabSection
      title="Selection"
      description="Pick several tags; at least one stays selected. Initial controlled selection comes from a one-shot generator."
    >
      <Picker />
    </LabSection>
    <LabSection
      title="Tag tones and caller attributes"
      description="Tags override the group tone; a caller attribute marks an added tag; rich content takes a text value."
    >
      <Marked />
    </LabSection>
  </>,
);
