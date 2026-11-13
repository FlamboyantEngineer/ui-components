import { type CSSProperties, type FormEvent, useState } from 'react';
import { BooleanField } from '../../src/components/boolean-field/index.js';
import { Button } from '../../src/components/button/index.js';
import { Form } from '../../src/components/form/index.js';
import {
  FormLayout,
  type FormLayoutChange,
  FormLayoutDesigner,
  type FormLayoutNode,
  type FormLayoutPaletteEntry,
  type FormLayoutTypes,
  type FormLayoutValue,
  validateFormLayout,
} from '../../src/components/form-layout/index.js';
import { PropertyPanel, PropertyRow } from '../../src/components/property-panel/index.js';
import { TextField } from '../../src/components/text-field/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { FormLayoutCorners, FormLayoutSizes } from './form-layout-cases.js';
import { LabOutput } from './lab-output.js';

const wide: CSSProperties = { width: 640, maxWidth: '100%' };

/** The host's own field metadata, carried through every edit untouched. */
interface SampleField {
  name: string;
  isRequired?: boolean;
}

type SampleNode = FormLayoutNode<SampleField>;

const types: FormLayoutTypes<SampleField> = {
  section: { label: 'Section', arrangement: 'stack', accepts: (type) => type !== 'section' },
  row: {
    label: 'Row',
    arrangement: 'row',
    accepts: (type) => type === 'text' || type === 'toggle',
  },
  grid: {
    label: 'Grid',
    arrangement: 'grid',
    accepts: (type) => type === 'text' || type === 'toggle',
  },
  text: {
    label: 'Text',
    render: (node, { mode }) => (
      <TextField
        label={node.label ?? 'Text'}
        name={node.data?.name}
        isRequired={node.data?.isRequired}
        isReadOnly={mode === 'design'}
        placeholder={mode === 'design' ? 'Preview' : undefined}
      />
    ),
  },
  toggle: {
    label: 'Toggle',
    render: (node, { mode }) => (
      <BooleanField
        label={node.label ?? 'Toggle'}
        name={node.data?.name}
        isReadOnly={mode === 'design'}
      />
    ),
  },
};

const sample: FormLayoutValue<SampleField> = [
  {
    id: 'contact',
    type: 'section',
    label: 'Contact',
    children: [
      { id: 'name', type: 'text', label: 'Full name', data: { name: 'name', isRequired: true } },
      {
        id: 'place',
        type: 'row',
        label: 'Place',
        children: [
          { id: 'city', type: 'text', label: 'City', data: { name: 'city' } },
          { id: 'zip', type: 'text', label: 'Postcode', data: { name: 'zip' } },
        ],
      },
    ],
  },
  {
    id: 'prefs',
    type: 'section',
    label: 'Preferences',
    children: [
      {
        id: 'options',
        type: 'grid',
        label: 'Options',
        columns: 2,
        children: [
          { id: 'news', type: 'toggle', label: 'Newsletter', data: { name: 'news' } },
          { id: 'sms', type: 'toggle', label: 'Text messages', data: { name: 'sms' } },
        ],
      },
      {
        id: 'terms',
        type: 'text',
        label: 'Reference',
        isLocked: true,
        data: { name: 'reference' },
      },
    ],
  },
];

/** The page's id counter: the palette takes fresh ids from the host, as a host's schema would. */
let created = 0;

/** A fresh node id of the host's, such as a schema would assign. */
function nextId(prefix: string): string {
  created += 1;
  return `${prefix}-${created}`;
}

/** The palette, its entries making nodes with fresh ids. */
function createPalette(): FormLayoutPaletteEntry<SampleField>[] {
  const entry = (type: string, label: string, make: (id: string) => SampleNode) => ({
    key: type,
    label,
    type,
    create: () => make(nextId(type)),
  });
  return [
    entry('text', 'Text field', (id) => ({
      id,
      type: 'text',
      label: 'New text',
      data: { name: id },
    })),
    entry('toggle', 'Toggle', (id) => ({
      id,
      type: 'toggle',
      label: 'New toggle',
      data: { name: id },
    })),
    entry('row', 'Row', (id) => ({ id, type: 'row', label: 'New row', children: [] })),
    entry('grid', 'Grid', (id) => ({
      id,
      type: 'grid',
      label: 'New grid',
      columns: 2,
      children: [],
    })),
    entry('section', 'Section', (id) => ({
      id,
      type: 'section',
      label: 'New section',
      children: [],
    })),
  ];
}

function Inspector({ node, update }: { node: SampleNode; update: (node: SampleNode) => void }) {
  return (
    <PropertyPanel aria-label="Node properties">
      <PropertyRow label="Label">
        <TextField
          label="Label"
          value={node.label ?? ''}
          onChange={(label) => update({ ...node, label })}
        />
      </PropertyRow>
      {node.data ? (
        <PropertyRow label="Required">
          <BooleanField
            label="Required"
            value={node.data.isRequired === true}
            onChange={(isRequired) =>
              update({
                ...node,
                data: { name: node.data?.name ?? node.id, isRequired: isRequired === true },
              })
            }
          />
        </PropertyRow>
      ) : null}
    </PropertyPanel>
  );
}

const palette = createPalette();

function DesignerDemo() {
  const [layout, setLayout] = useState<FormLayoutValue<SampleField>>(sample);
  const [change, setChange] = useState<FormLayoutChange | null>(null);
  const [submitted, setSubmitted] = useState<string>('');
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
  };
  return (
    <div data-lab-demo="designer" style={wide}>
      <FormLayoutDesigner
        value={layout}
        onChange={(next, last) => {
          setLayout(next);
          setChange(last);
        }}
        types={types}
        palette={palette}
        renderInspector={(node, update) => <Inspector node={node} update={update} />}
      />
      <LabOutput name="Last change">{JSON.stringify(change)}</LabOutput>
      <LabOutput name="Rule problems">
        {JSON.stringify(validateFormLayout(layout, { types }))}
      </LabOutput>
      <h3>Rendered form</h3>
      <Form aria-label="Rendered form" validationBehavior="aria" onSubmit={onSubmit}>
        <FormLayout layout={layout} types={types} />
        <Button type="submit">Submit</Button>
      </Form>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </div>
  );
}

/** Selection the host holds, and a top level that takes sections only. */
function HostSelection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <div style={wide} data-lab-demo="host-selection">
      <p>
        <Button size="sm" variant="secondary" onPress={() => setSelectedId('name')}>
          Host selects Full name
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setSelectedId(null)}>
          Host clears the selection
        </Button>
      </p>
      <FormLayoutDesigner
        aria-label="Layout, sections at the top"
        defaultValue={sample}
        types={types}
        palette={createPalette()}
        rootAccepts={(type) => type === 'section'}
        selectedId={selectedId}
        onSelectionChange={setSelectedId}
        renderInspector={(node, update) => <Inspector node={node} update={update} />}
      />
      <LabOutput name="Selected">{selectedId ?? 'none'}</LabOutput>
      <FormLayoutDesigner
        aria-label="Layout, Newsletter selected at first"
        defaultValue={sample}
        types={types}
        defaultSelectedId="news"
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Designer and rendered form"
      description="Add nodes from the palette, move them by handle or Alt+Arrow keys, remove them with Delete, and edit the selected node in the inspector. The form below draws the same tree with real fields."
    >
      <DesignerDemo />
    </LabSection>
    <LabSection
      title="States"
      description="An empty canvas, a read-only designer and a disabled one."
    >
      <StateMatrix
        axes={{ state: ['empty', 'read-only', 'disabled'] }}
        render={({ state }) => (
          <div style={{ width: 320 }}>
            <FormLayoutDesigner
              aria-label={`Layout, ${state}`}
              defaultValue={state === 'empty' ? [] : sample.slice(0, 1)}
              types={types}
              isReadOnly={state === 'read-only'}
              isDisabled={state === 'disabled'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Selection and top level"
      description="The host selects a node or clears the selection from its own buttons and hears the reader's choice; this designer's top level takes sections only, so the palette's fields go inside one. Below, a designer opening with Newsletter selected."
    >
      <HostSelection />
    </LabSection>
    <FormLayoutSizes />
    <FormLayoutCorners />
  </>,
);
