import { useRef, useState } from 'react';
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

const paragraphStyles = [
  { id: 'body', label: 'Body' },
  { id: 'heading', label: 'Heading' },
  { id: 'quote', label: 'Quote' },
];

// The page draws the chosen style's name in that style, so a heading's name is bold.
const styledValueStyle = `
[data-lab-demo='styled-value'][data-style='heading'] .ui-select-field__value-label {
  font-weight: 800;
  font-size: 15px;
}
`;

/** A style picker whose value label takes the chosen style's font; the trigger still fits it. */
export function StyledValueField() {
  const [style, setStyle] = useState('body');
  return (
    <div data-lab-demo="styled-value" data-style={style}>
      <style>{styledValueStyle}</style>
      <SelectField
        label="Paragraph style"
        options={paragraphStyles}
        value={style}
        onChange={(key) => setStyle(String(key))}
      />
    </div>
  );
}
