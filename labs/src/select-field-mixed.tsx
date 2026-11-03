import { useState } from 'react';
import { SelectField } from '../../src/components/select-field/select-field.js';

export function MixedChoice() {
  const [state, setState] = useState<'mixed' | 'selected' | 'unselected'>('mixed');
  return (
    <SelectField
      label="Shared labels"
      selectionMode="multiple"
      value={state === 'selected' ? ['green'] : []}
      options={[
        {
          id: 'green',
          label: 'Green',
          isIndeterminate: state === 'mixed',
          description: state === 'mixed' ? 'Mixed values — retain existing assignments' : undefined,
        },
      ]}
      onChange={() =>
        setState((current) =>
          current === 'mixed' ? 'selected' : current === 'selected' ? 'unselected' : 'mixed',
        )
      }
    />
  );
}
