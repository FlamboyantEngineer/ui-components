import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../src/components/select-field/index.js';
import type { Key } from '../../src/core/props.js';
import { LabOutput } from './lab-output.js';

export function ComposedSelect() {
  const [value, setValue] = useState<Key | null>(null);
  const [submitted, setSubmitted] = useState('');
  return (
    <form
      aria-label="Paper order"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('paper-size') ?? ''));
      }}
    >
      <Select
        name="paper-size"
        label="Paper size"
        value={value}
        onChange={setValue}
        placeholder="Choose size"
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup id="metric" title="Metric">
            <SelectItem id="a4" label="A4" />
            <SelectItem id="a5" label="A5" />
          </SelectGroup>
          <SelectGroup id="us" title="US">
            <SelectItem id="letter" label="Letter" />
            <SelectItem id="legal" label="Legal" isDisabled />
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button type="submit">Submit</Button>
      <LabOutput name="Submitted size">{submitted}</LabOutput>
    </form>
  );
}
