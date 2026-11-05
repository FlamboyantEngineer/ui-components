// Select field cases for host-owned and initially open lists, in list and tree modes.

import { useState } from 'react';
import {
  SelectField,
  type SelectFieldOption,
} from '../../src/components/select-field/select-field.js';
import type { Key } from '../../src/core/props.js';
import { MountOnDemand } from './lab-form.js';
import { useHostOpen } from './lab-open-state.js';
import { LabOutput } from './lab-output.js';
import { getTextValue, places } from './select-tree.js';

type Mode = 'list' | 'tree';

const harvest: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
  { id: 'fig', label: 'Fig' },
];

interface OpenProps {
  label: string;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange: (isOpen: boolean) => void;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
}

/** A single select of either mode, with the open-state props passed through. */
function ModeSelect({ mode, ...props }: OpenProps & { mode: Mode }) {
  const [value, setValue] = useState<Key | null>(null);
  return mode === 'list' ? (
    <SelectField {...props} options={harvest} value={value} onChange={setValue} />
  ) : (
    <SelectField
      {...props}
      mode="tree"
      items={places}
      getTextValue={getTextValue}
      value={value}
      onChange={setValue}
    />
  );
}

/**
 * The host holds `isOpen` (see `useHostOpen`): its buttons open, close and lock the select, and
 * each request the select makes (the trigger, Escape, a pick, locking) shows first.
 */
function HostOpen({ mode }: { mode: Mode }) {
  const host = useHostOpen(mode);
  return (
    <div data-lab-demo={`host-open-${mode}`}>
      <ModeSelect mode={mode} label={`Host-opened ${mode}`} {...host.props} />
      {host.panel}
    </div>
  );
}

/** A list open from its first render, uncontrolled; the reader closes it as usual. */
function InitiallyOpen({ mode }: { mode: Mode }) {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <MountOnDemand label={`an initially open ${mode}`}>
      <ModeSelect
        mode={mode}
        label={`Open at first, ${mode}`}
        defaultOpen
        onOpenChange={(next) => setChanges((list) => [...list, next ? 'open' : 'close'])}
      />
      <LabOutput name={`Open at first ${mode}`}>{changes.join(', ') || 'none'}</LabOutput>
    </MountOnDemand>
  );
}

export function OpenStates() {
  return (
    <>
      <HostOpen mode="list" />
      <HostOpen mode="tree" />
      <InitiallyOpen mode="list" />
      <InitiallyOpen mode="tree" />
    </>
  );
}
