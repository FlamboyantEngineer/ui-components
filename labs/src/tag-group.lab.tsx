import { useState } from 'react';
import type { Key, Selection, Tone } from '../../src/core/props.js';
import { Tag, TagGroup, type TagGroupSize } from '../../src/components/tag-group/tag-group.js';
import { Button } from '../../src/components/button/button.js';
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
] as const satisfies readonly Tone[];
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

/** One tag at a time, removable, with a tag that disables itself rather than through the group. */
function SinglePick() {
  const [items, setItems] = useState([
    { id: 'kale', name: 'Kale', isDisabled: false },
    { id: 'leek', name: 'Leek (sold out)', isDisabled: true },
    { id: 'okra', name: 'Okra', isDisabled: false },
    { id: 'pea', name: 'Pea', isDisabled: false },
  ]);
  const [selected, setSelected] = useState<Selection | Iterable<Key>>(new Set<Key>(['kale']));
  const names = selected === 'all' ? ['all'] : [...selected].map(String);
  return (
    <>
      <TagGroup
        aria-label="Vegetable of the week"
        items={items}
        selectionMode="single"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        onRemove={(keys) => setItems((current) => current.filter((item) => !keys.has(item.id)))}
        data-lab-field="single"
      >
        {(item) => (
          <Tag id={item.id} isDisabled={item.isDisabled}>
            {item.name}
          </Tag>
        )}
      </TagGroup>
      <LabOutput name="Picked">{names.join(', ') || 'none'}</LabOutput>
      <LabOutput name="Vegetables">{items.map((item) => item.name).join(', ')}</LabOutput>
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

function Editable() {
  const [edited, setEdited] = useState('none');
  const [items, setItems] = useState<Fruit[]>([
    { id: 'pear', name: 'Pear' },
    { id: 'plum', name: 'Plum' },
  ]);
  return (
    <div data-lab-demo="tag-controls">
      <TagGroup
        aria-label="Editable fruit"
        items={items}
        onRemove={(keys) => setItems((current) => current.filter((item) => !keys.has(item.id)))}
      >
        {(item) => (
          <Tag id={item.id} textValue={item.name}>
            {item.name}{' '}
            <Button variant="bare" size="xs" onPress={() => setEdited(item.name)}>
              {`Edit ${item.name}`}
            </Button>
          </Tag>
        )}
      </TagGroup>
      <LabOutput name="edited">{edited}</LabOutput>
    </div>
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
      title="Single selection and a disabled tag"
      description="Pick one vegetable at a time: picking another replaces it. Leek disables itself with isDisabled on its Tag, not through the group: it cannot be picked, focused or removed and draws no remove button, while the other tags still pick and remove."
    >
      <SinglePick />
    </LabSection>
    <LabSection
      title="Tag tones and caller attributes"
      description="Tags override the group tone; a caller attribute marks an added tag; rich content takes a text value."
    >
      <Marked />
    </LabSection>
    <LabSection
      title="Controls in tags"
      description="Each tag holds an Edit button of its own beside the tag's remove button."
    >
      <Editable />
    </LabSection>
  </>,
);
