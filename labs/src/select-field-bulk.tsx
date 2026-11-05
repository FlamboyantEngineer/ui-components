import { useState } from 'react';
import {
  SelectField,
  type SelectFieldOption,
  type SelectMembershipChanges,
  useSelectMembership,
} from '../../src/components/select-field/index.js';
import { Switch } from '../../src/components/switch/index.js';
import type { Key } from '../../src/core/props.js';
import { LabOutput } from './lab-output.js';

const options: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear', description: 'Crisp and sweet' },
  { id: 'fig', label: 'Fig' },
  { id: 'plum', label: 'Plum', isDisabled: true },
];
const records = [
  { name: 'First', memberships: ['apple', 'pear', 'plum'] },
  { name: 'Second', memberships: ['apple'] },
];
const baseline = {
  selectedKeys: options
    .filter((option) => records.every((record) => record.memberships.includes(String(option.id))))
    .map((option) => option.id),
  partialKeys: options
    .filter(
      (option) =>
        records.some((record) => record.memberships.includes(String(option.id))) &&
        !records.every((record) => record.memberships.includes(String(option.id))),
    )
    .map((option) => option.id),
};

/** Applies the intent the way a host would: added and removed keys change, retained ones stay. */
function applyChanges(memberships: readonly string[], changes: SelectMembershipChanges) {
  return options
    .filter(
      (option) =>
        changes.added.includes(option.id) ||
        (!changes.removed.includes(option.id) && memberships.includes(String(option.id))),
    )
    .map((option) => option.id);
}

/** `useSelectMembership` turns picks into add, remove and retain intent for two records. */
export function BulkMembershipEditor() {
  const [summarizeMixed, setSummarizeMixed] = useState(false);
  const [changeEvents, setChangeEvents] = useState<Key[][]>([]);
  const [commits, setCommits] = useState<Key[][]>([]);
  const membership = useSelectMembership({ options, baseline });
  const { fieldProps, changes } = membership;
  const preview = records.map((record) => ({
    name: record.name,
    memberships: applyChanges(record.memberships, changes),
  }));
  return (
    <div data-lab-demo="bulk-memberships">
      <Switch isSelected={summarizeMixed} onChange={setSummarizeMixed}>
        Summarize mixed memberships
      </Switch>
      <SelectField
        label="Shared fruit"
        name="shared-fruit"
        selectionMode="multiple"
        {...fieldProps}
        isMixed={summarizeMixed && changes.retained.length > 0}
        placeholder="Mixed values"
        onChange={(next) => {
          setChangeEvents((previous) => [...previous, next]);
          fieldProps.onChange(next);
        }}
        onCommit={(next) => setCommits((previous) => [...previous, next])}
        filterable
        isClearable
      />
      <button type="button" onClick={membership.reset} disabled={!membership.isDirty}>
        Retain original memberships
      </button>
      <LabOutput name="Membership value">{JSON.stringify(fieldProps.value)}</LabOutput>
      <LabOutput name="Membership change events">{JSON.stringify(changeEvents)}</LabOutput>
      <LabOutput name="Membership commits">{JSON.stringify(commits)}</LabOutput>
      <LabOutput name="Membership changes">{JSON.stringify(changes)}</LabOutput>
      <LabOutput name="Preview memberships">{JSON.stringify(preview)}</LabOutput>
    </div>
  );
}
