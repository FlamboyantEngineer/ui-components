import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type { FieldDensity } from '../../src/components/field/field.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import {
  SelectField,
  type SelectFieldOption,
} from '../../src/components/select-field/select-field.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';

const statuses: SelectFieldOption[] = [
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'waiting', label: 'Waiting on a reply from someone outside the team' },
];

const noDigits = (value: string) =>
  /\d/.test(value) ? { severity: 'error' as const, message: 'Names have no digits.' } : null;

/** A filter row: a search box, a status, an owner that rejects digits, and the row's commands. */
function FilterRow({ density, width }: { density: FieldDensity; width?: number }) {
  // The saved filter stays put, so a pick leaves the field dirty until Apply or Restore.
  const [status, setStatus] = useState<Key>('waiting');
  return (
    <div
      style={{ width, maxWidth: '100%' }}
      data-lab-filter-row={`${density}${width ? '-narrow' : ''}`}
    >
      <Cluster space="xs" align="start">
        <TextField
          label="Search"
          labelLayout="control-only"
          placeholder="Search"
          size="sm"
          density={density}
        />
        <SelectField
          label="Status"
          labelLayout="label-colon-control"
          options={statuses}
          value={status}
          onChange={(next) => setStatus(next ?? 'waiting')}
          committedValue="waiting"
          size="sm"
          density={density}
        />
        <TextField
          label="Owner"
          labelLayout="label-colon-control"
          defaultValue="Maria"
          validate={noDigits}
          validationMode="immediate"
          size="sm"
          density={density}
        />
        <Button size="sm">Apply</Button>
        <Button size="sm" variant="ghost">
          Reset
        </Button>
      </Cluster>
    </div>
  );
}

export function CompactFieldsSection() {
  return (
    <LabSection
      title="Compact rows"
      description="Filter rows of text and select fields beside small buttons. The compact row keeps no message line or restore place until a field shows them: Status starts on a long value and turns dirty when you pick another, and Owner turns invalid when you type a digit. The default row below keeps that room for comparison, and the narrow compact row wraps."
    >
      <Stack space="lg">
        <FilterRow density="compact" />
        <FilterRow density="default" />
        <FilterRow density="compact" width={300} />
      </Stack>
    </LabSection>
  );
}
