import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { PlusGlyph } from '../../src/core/glyphs.js';
import type { FieldChangeLayout, FieldLabelLayout } from '../../src/components/field/field.js';
import {
  SelectField,
  type SelectFieldOption,
} from '../../src/components/select-field/select-field.js';
import type { ControlSize } from '../../src/core/props.js';
import { StateMatrix } from './chrome/index.js';

const produce: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple', icon: PlusGlyph },
  { id: 'pear', label: 'Pear' },
  { id: 'fig', label: 'Fig' },
  { id: 'quince', label: 'Quince' },
  { id: 'heirloom', label: 'Heirloom apple from the north orchard, late harvest' },
  { id: 'russet', label: 'Russet pear from the south terraces, early picking' },
];

/** Each edit a select can hold against its saved value: the committed value, then the current one. */
const edits = {
  changed: { committed: 'pear', value: 'fig' },
  filled: { committed: null, value: 'fig' },
  emptied: { committed: 'pear', value: null },
  long: { committed: 'heirloom', value: 'russet' },
  'added-removed': { committed: ['apple', 'pear', 'quince'], value: ['pear', 'fig'] },
} as const;

type EditName = keyof typeof edits;

const editNames = Object.keys(edits) as EditName[];

const changeLayouts: readonly FieldChangeLayout[] = ['inline', 'stacked', 'hidden'];

interface ChangeSampleProps {
  edit: EditName;
  changeLayout: FieldChangeLayout;
  labelLayout?: FieldLabelLayout;
  size?: ControlSize;
  isInvalid?: boolean;
}

/** A select that starts dirty with `edit`: Save commits the current value, Reset puts the saved one back. */
function ChangeSample({ edit, changeLayout, labelLayout, size, isInvalid }: ChangeSampleProps) {
  const start = edits[edit];
  const multiple = Array.isArray(start.value);
  const [value, setValue] = useState<Key | readonly Key[] | null>(start.value);
  const shared = {
    label: multiple ? 'Basket' : 'Fruit',
    options: produce,
    changeLayout,
    labelLayout,
    size,
    menu: ['clear', 'reset', 'set-default'] as const,
    validate: isInvalid
      ? () => ({ severity: 'error' as const, message: 'Choose a fruit in season.' })
      : undefined,
  };
  return multiple ? (
    <SelectField
      {...shared}
      selectionMode="multiple"
      value={value as Key[]}
      onChange={setValue}
      committedValue={start.committed as unknown as Key[]}
    />
  ) : (
    <SelectField
      {...shared}
      value={value as Key | null}
      onChange={setValue}
      committedValue={start.committed as Key | null}
    />
  );
}

/** Every edit in both change layouts, in a narrow column. */
export function ChangeMatrix() {
  return (
    <StateMatrix
      axes={{ edit: editNames, change: changeLayouts }}
      render={({ edit, change }) => (
        <div style={{ width: 320 }}>
          <ChangeSample edit={edit} changeLayout={change} />
        </div>
      )}
    />
  );
}

const labelLayouts: readonly FieldLabelLayout[] = ['label-control', 'label-colon-control'];
const sizes: readonly ControlSize[] = ['xs', 'md', 'lg'];

/** Long edits against label layouts, sizes and an error message, each in a 240px column. */
export function ChangeFit() {
  return (
    <StateMatrix
      axes={{ size: sizes, layout: labelLayouts, change: ['inline', 'stacked'] as const }}
      render={({ size, layout, change }) => (
        <div style={{ width: 240 }}>
          <ChangeSample
            edit="long"
            changeLayout={change}
            labelLayout={layout}
            size={size}
            isInvalid
          />
        </div>
      )}
    />
  );
}
