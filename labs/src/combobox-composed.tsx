import { useState } from 'react';
import { Combobox, ComboboxContent, ComboboxInput } from '../../src/components/combobox/index.js';
import type { Key } from '../../src/core/props.js';

const cities = [
  { id: 'lima', label: 'Lima' },
  { id: 'oslo', label: 'Oslo' },
  { id: 'paris', label: 'Paris' },
];

export function ComposedCombobox() {
  const [value, setValue] = useState<Key[]>(['lima']);
  return (
    <Combobox
      label="Destinations"
      selectionMode="multiple"
      value={value}
      onChange={setValue}
      defaultItems={cities}
      name="destinations"
    >
      <ComboboxInput />
      <ComboboxContent placement="bottom start" />
    </Combobox>
  );
}
