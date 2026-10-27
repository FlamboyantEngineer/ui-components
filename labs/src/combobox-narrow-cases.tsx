// A combobox lab case: comboboxes in rows narrower than their usual width, beside another field,
// with and without a chosen value (whose clear button takes room). Lab-only layout is inline.

import { Combobox, type ComboboxItem } from '../../src/components/combobox/combobox.js';
import { TextField } from '../../src/components/text-field/text-field.js';

const fruit: ComboboxItem[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
];

const layouts = {
  flex: { display: 'flex', gap: 8, alignItems: 'flex-start', width: 300 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 300 },
} as const;

/** One row of a narrow form: a combobox squeezed beside a text field. */
function NarrowRow({ layout, isChosen }: { layout: keyof typeof layouts; isChosen: boolean }) {
  const name = `${layout}, ${isChosen ? 'chosen' : 'empty'}`;
  return (
    <div data-lab-row={name} style={layouts[layout]}>
      <Combobox
        label={`Fruit (${name})`}
        defaultItems={fruit}
        placeholder="Pick a fruit"
        {...(isChosen ? { defaultValue: 'banana' } : {})}
      />
      <TextField label={`Note (${name})`} />
    </div>
  );
}

/** Narrow flex and grid rows, empty and with a chosen value. */
export function NarrowRows() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {(['flex', 'grid'] as const).flatMap((layout) =>
        [false, true].map((isChosen) => (
          <NarrowRow key={`${layout}-${isChosen}`} layout={layout} isChosen={isChosen} />
        )),
      )}
    </div>
  );
}
