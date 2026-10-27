import { useRef } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SelectField } from '../../src/components/select-field/select-field.js';

const sizes = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

/** A command elsewhere on the page that hands focus back to the select's trigger through its ref. */
export function TriggerRefField() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div data-lab-demo="trigger-ref">
      <SelectField label="Size" options={sizes} defaultValue="medium" triggerRef={triggerRef} />
      <Button size="sm" onPress={() => triggerRef.current?.focus()}>
        Back to the size
      </Button>
    </div>
  );
}
