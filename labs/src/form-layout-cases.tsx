import type { CSSProperties } from 'react';
import {
  FormLayout,
  FormLayoutDesigner,
  type FormLayoutNode,
  type FormLayoutTypes,
  type FormLayoutValue,
  validateFormLayout,
} from '../../src/components/form-layout/index.js';
import { TextField } from '../../src/components/text-field/index.js';
import type { ControlSize } from '../../src/core/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
const column: CSSProperties = { width: 420 };
const narrow: CSSProperties = { width: 220 };

/** Types for the corner cases, the fields drawn at `size`: groups nest anything, rows and grids take fields. */
function cornerTypes(size: ControlSize = 'md'): FormLayoutTypes {
  return {
    group: { label: 'Group', arrangement: 'stack' },
    row: { label: 'Row', arrangement: 'row', accepts: (type) => type === 'text' },
    grid: { label: 'Grid', arrangement: 'grid', accepts: (type) => type === 'text' },
    text: {
      label: 'Text',
      render: (node, { mode }) => (
        <TextField label={node.label ?? 'Text'} size={size} isReadOnly={mode === 'design'} />
      ),
    },
  };
}

const text = (id: string, label: string): FormLayoutNode => ({ id, type: 'text', label });

const grid = (id: string, columns: number, count: number): FormLayoutNode => ({
  id,
  type: 'grid',
  label: `${columns} columns`,
  columns,
  children: Array.from({ length: count }, (_, index) =>
    text(`${id}-${index + 1}`, `Cell ${index + 1}`),
  ),
});

const longLabel =
  'The name of the person to write to about this request, as it appears on their documents';

const layouts = {
  'single field': [text('only', 'Name')],
  'deep nesting': [
    {
      id: 'level-1',
      type: 'group',
      label: 'Level 1',
      children: [
        {
          id: 'level-2',
          type: 'group',
          label: 'Level 2',
          children: [
            {
              id: 'level-3',
              type: 'group',
              label: 'Level 3',
              children: [
                {
                  id: 'level-4',
                  type: 'row',
                  label: 'Level 4',
                  children: [text('deep-a', 'First'), text('deep-b', 'Second')],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  'empty containers': [
    { id: 'empty-group', type: 'group', label: 'Empty group', children: [] },
    { id: 'empty-row', type: 'row', label: 'Empty row', children: [] },
    { id: 'empty-grid', type: 'grid', label: 'Empty grid', columns: 3, children: [] },
  ],
  'many columns': [grid('wide-grid', 6, 9)],
  'many columns, narrow': [grid('narrow-grid', 4, 6)],
  'long labels': [
    {
      id: 'long-group',
      type: 'group',
      label: longLabel,
      children: [
        {
          id: 'long-row',
          type: 'row',
          label: 'Row',
          children: [text('long-a', longLabel), text('long-b', 'Short')],
        },
      ],
    },
  ],
  'locked nodes': [
    {
      id: 'locked-group',
      type: 'group',
      label: 'Locked group',
      isLocked: true,
      children: [
        { ...text('locked-field', 'Locked field'), isLocked: true },
        text('free-field', 'Free field'),
      ],
    },
  ],
  'rule problems': [
    { id: 'mystery', type: 'unknown', label: 'Unknown type' },
    { id: 'field-with-children', type: 'text', label: 'Field with children', children: [] },
    {
      id: 'row-of-groups',
      type: 'row',
      label: 'Row',
      children: [{ id: 'inner', type: 'group', label: 'Group in a row', children: [] }],
    },
  ],
} satisfies Record<string, FormLayoutValue>;

type LayoutName = keyof typeof layouts;

function widthOf(name: LayoutName): CSSProperties {
  return name === 'many columns, narrow' || name === 'long labels' ? narrow : column;
}

/** Each control size: the fields a host draws take the size; the layout itself has none. */
export function FormLayoutSizes() {
  return (
    <LabSection
      title="Field sizes"
      description="The layout draws no controls of its own: the host's fields take their size from the host, here each control size in a row of two and a grid of three."
    >
      <StateMatrix
        axes={{ size: sizes }}
        render={({ size }) => (
          <div style={column}>
            <FormLayout
              types={cornerTypes(size)}
              layout={[
                {
                  id: 'row',
                  type: 'row',
                  label: 'Row',
                  children: [text('first', `First, ${size}`), text('second', `Second, ${size}`)],
                },
                grid('grid', 3, 3),
              ]}
            />
          </div>
        )}
      />
    </LabSection>
  );
}

/** Corner cases, each drawn as a form and in the designer, with the rule problems they raise. */
export function FormLayoutCorners() {
  const types = cornerTypes();
  return (
    <LabSection
      title="Corner cases"
      description="One field, four levels of nesting, empty containers, many grid columns (also in a narrow column), long labels, locked nodes, and a layout that breaks the rules: an unknown type, a field with children and a group inside a row."
    >
      <StateMatrix
        axes={{ layout: Object.keys(layouts) as LayoutName[], view: ['form', 'designer'] }}
        render={({ layout, view }) => {
          const value: FormLayoutValue = layouts[layout];
          return (
            <div style={widthOf(layout)}>
              {view === 'form' ? (
                <FormLayout layout={value} types={types} />
              ) : (
                <FormLayoutDesigner
                  aria-label={`Layout, ${layout}`}
                  defaultValue={value}
                  types={types}
                />
              )}
              {layout === 'rule problems' && view === 'form' ? (
                <LabOutput name="Rule problems">
                  {JSON.stringify(validateFormLayout(value, { types }))}
                </LabOutput>
              ) : null}
            </div>
          );
        }}
      />
    </LabSection>
  );
}
