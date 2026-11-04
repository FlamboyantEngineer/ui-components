import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { SelectField, type SelectFieldOption } from '../../src/components/select-field/index.js';
import { LabOutput } from './lab-output.js';
import { Switch } from '../../src/components/switch/index.js';

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
const all = new Set(
  options
    .filter((option) => records.every((record) => record.memberships.includes(String(option.id))))
    .map((option) => option.id),
);
const some = new Set(
  options
    .filter(
      (option) =>
        !all.has(option.id) &&
        records.some((record) => record.memberships.includes(String(option.id))),
    )
    .map((option) => option.id),
);

/** The host retains untouched memberships and cycles originally mixed options through overrides. */
export function BulkMembershipEditor() {
  const [summarizeMixed, setSummarizeMixed] = useState(false);
  const [changeEvents, setChangeEvents] = useState<Key[][]>([]);
  const [commits, setCommits] = useState<Key[][]>([]);
  const [changes, setChanges] = useState<Partial<Record<Key, 'add' | 'remove'>>>({});
  const value = options
    .filter(
      (option) =>
        changes[option.id] === 'add' || (all.has(option.id) && changes[option.id] !== 'remove'),
    )
    .map((option) => option.id);
  const update = (next: Key[]) => {
    const added = next.find((key) => !value.includes(key));
    const removed = value.find((key) => !next.includes(key));
    const key = added ?? removed;
    if (key === undefined) return;
    setChanges((previous) => {
      const updated = { ...previous };
      if (some.has(key) && previous[key] === 'remove') delete updated[key];
      else updated[key] = added === undefined ? 'remove' : 'add';
      return updated;
    });
  };
  const preview = records.map((record) => ({
    name: record.name,
    memberships: options
      .filter(
        (option) =>
          changes[option.id] === 'add' ||
          (changes[option.id] !== 'remove' && record.memberships.includes(String(option.id))),
      )
      .map((option) => option.id),
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
        isMixed={summarizeMixed && [...some].some((key) => changes[key] === undefined)}
        placeholder="Mixed values"
        options={options.map((option) => ({
          ...option,
          isIndeterminate: some.has(option.id) && changes[option.id] === undefined,
        }))}
        value={value}
        onChange={(next) => {
          setChangeEvents((previous) => [...previous, next]);
          update(next);
        }}
        onCommit={(next) => setCommits((previous) => [...previous, next])}
        filterable
      />
      <button type="button" onClick={() => setChanges({})}>
        Retain original memberships
      </button>
      <LabOutput name="Membership value">{JSON.stringify(value)}</LabOutput>
      <LabOutput name="Membership change events">{JSON.stringify(changeEvents)}</LabOutput>
      <LabOutput name="Membership commits">{JSON.stringify(commits)}</LabOutput>
      <LabOutput name="Membership changes">{JSON.stringify(changes)}</LabOutput>
      <LabOutput name="Preview memberships">{JSON.stringify(preview)}</LabOutput>
    </div>
  );
}
