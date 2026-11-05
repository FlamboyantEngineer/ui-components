import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { SelectField } from './select-field.js';
import type { SelectMembershipBaseline, SelectMembershipEdits } from './select-membership.js';
import type { SelectFieldItem } from './select-options.js';
import { type SelectMembershipOptions, useSelectMembership } from './use-select-membership.js';

const options: SelectFieldItem[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
  { id: 'fig', label: 'Fig' },
  { id: 'plum', label: 'Plum', isDisabled: true },
  { id: 'kiwi', label: 'Kiwi', isDisabled: true },
];
const baseline: SelectMembershipBaseline = {
  selectedKeys: ['apple', 'plum'],
  partialKeys: ['pear', 'kiwi'],
};

function Membership({
  label = 'Fruit',
  ...props
}: Partial<SelectMembershipOptions> & { label?: string }) {
  const membership = useSelectMembership({ options, baseline, ...props });
  return (
    <div>
      <SelectField label={label} selectionMode="multiple" isClearable {...membership.fieldProps} />
      <output aria-label={`${label} changes`}>{JSON.stringify(membership.changes)}</output>
      <output aria-label={`${label} dirty`}>{String(membership.isDirty)}</output>
      <button type="button" onClick={membership.reset}>
        Reset {label}
      </button>
    </div>
  );
}

const changesOf = (label = 'Fruit') =>
  JSON.parse(screen.getByLabelText(`${label} changes`).textContent ?? '') as Record<string, Key[]>;

async function open(user: ReturnType<typeof userEvent.setup>, label = 'Fruit') {
  await user.click(screen.getByRole('button', { name: new RegExp(`selected ${label}$`) }));
  return screen.findByRole('listbox');
}

describe('useSelectMembership', () => {
  it('UIC-SELECT-FIELD-13.1 shows mixed options as indeterminate and opening changes nothing', async () => {
    const user = userEvent.setup();
    const onEditsChange = vi.fn();
    render(<Membership onEditsChange={onEditsChange} />);
    const list = await open(user);
    const pear = within(list).getByRole('option', { name: 'Pear' });
    expect(pear).toHaveAttribute('aria-selected', 'false');
    expect(pear).toHaveAccessibleDescription('Selected for some records');
    expect(within(list).getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(onEditsChange).not.toHaveBeenCalled();
    expect(changesOf()).toEqual({ added: [], removed: [], retained: ['pear', 'kiwi'] });
    expect(screen.getByLabelText('Fruit dirty')).toHaveTextContent('false');
  });

  it('UIC-SELECT-FIELD-13.1 cycles a mixed option through add, remove and back to retained', async () => {
    const user = userEvent.setup();
    const onEditsChange = vi.fn();
    render(<Membership onEditsChange={onEditsChange} />);
    const list = await open(user);
    const pear = within(list).getByRole('option', { name: 'Pear' });
    await user.click(pear);
    expect(onEditsChange).toHaveBeenLastCalledWith(
      { added: ['pear'], removed: [] },
      { added: ['pear'], removed: [], retained: ['kiwi'] },
    );
    expect(pear).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(changesOf()).toEqual({ added: [], removed: ['pear'], retained: ['kiwi'] });
    expect(pear).toHaveAttribute('aria-selected', 'false');
    expect(pear).toHaveAccessibleDescription('');
    await user.keyboard('{Enter}');
    expect(changesOf()).toEqual({ added: [], removed: [], retained: ['pear', 'kiwi'] });
    expect(pear).toHaveAccessibleDescription('Selected for some records');
    expect(screen.getByLabelText('Fruit dirty')).toHaveTextContent('false');
  });

  it('UIC-SELECT-FIELD-13.1 toggles plain options and drops the edit back at their baseline', async () => {
    const user = userEvent.setup();
    render(<Membership />);
    const list = await open(user);
    await user.click(within(list).getByRole('option', { name: 'Fig' }));
    await user.click(within(list).getByRole('option', { name: 'Apple' }));
    expect(changesOf()).toEqual({ added: ['fig'], removed: ['apple'], retained: ['pear', 'kiwi'] });
    expect(screen.getByLabelText('Fruit dirty')).toHaveTextContent('true');
    await user.click(within(list).getByRole('option', { name: 'Fig' }));
    await user.click(within(list).getByRole('option', { name: 'Apple' }));
    expect(changesOf()).toEqual({ added: [], removed: [], retained: ['pear', 'kiwi'] });
  });

  it('UIC-SELECT-FIELD-13.2 clears chosen options, keeps locked ones and resets to the baseline', async () => {
    const user = userEvent.setup();
    const onEditsChange = vi.fn();
    render(<Membership onEditsChange={onEditsChange} />);
    const list = await open(user);
    await user.click(within(list).getByRole('option', { name: 'Fig' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Clear Fruit' }));
    expect(changesOf()).toEqual({
      added: [],
      removed: ['apple'],
      retained: ['pear', 'kiwi'],
    });
    for (const [edits] of onEditsChange.mock.calls as [SelectMembershipEdits][]) {
      expect([...edits.added, ...edits.removed]).not.toContain('plum');
      expect([...edits.added, ...edits.removed]).not.toContain('kiwi');
    }
    await user.click(screen.getByRole('button', { name: 'Reset Fruit' }));
    expect(changesOf()).toEqual({ added: [], removed: [], retained: ['pear', 'kiwi'] });
    expect(screen.getByLabelText('Fruit dirty')).toHaveTextContent('false');
  });

  it('UIC-SELECT-FIELD-13.2 emits no intent from a read-only field', async () => {
    const user = userEvent.setup();
    const onEditsChange = vi.fn();
    function ReadOnly() {
      const membership = useSelectMembership({ options, baseline, onEditsChange });
      return (
        <SelectField label="Fruit" selectionMode="multiple" isReadOnly {...membership.fieldProps} />
      );
    }
    render(<ReadOnly />);
    await user.click(screen.getByRole('button', { name: /selected Fruit$/ }));
    await user.keyboard('{Enter}');
    expect(onEditsChange).not.toHaveBeenCalled();
  });

  it('UIC-SELECT-FIELD-13.3 follows controlled edits and holds independent instances', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [edits, setEdits] = useState<SelectMembershipEdits>({ added: ['fig'], removed: [] });
      return (
        <>
          <Membership label="Shared" edits={edits} onEditsChange={setEdits} />
          <Membership label="Other" />
          <button type="button" onClick={() => setEdits({ added: [], removed: ['apple'] })}>
            Replace edits
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(changesOf('Shared').added).toEqual(['fig']);
    const list = await open(user, 'Shared');
    await user.click(within(list).getByRole('option', { name: 'Pear' }));
    expect(changesOf('Shared').added).toEqual(['fig', 'pear']);
    expect(changesOf('Other')).toEqual({ added: [], removed: [], retained: ['pear', 'kiwi'] });
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Replace edits' }));
    expect(changesOf('Shared')).toEqual({
      added: [],
      removed: ['apple'],
      retained: ['pear', 'kiwi'],
    });
  });

  it('UIC-SELECT-FIELD-13.3 drops held edits when a new reset key names other records', async () => {
    const user = userEvent.setup();
    function Records() {
      const [records, setRecords] = useState('first');
      return (
        <>
          <Membership resetKey={records} defaultEdits={{ added: [], removed: ['apple'] }} />
          <button type="button" onClick={() => setRecords('second')}>
            Edit other records
          </button>
        </>
      );
    }
    render(<Records />);
    expect(changesOf().removed).toEqual(['apple']);
    const list = await open(user);
    await user.click(within(list).getByRole('option', { name: 'Fig' }));
    expect(changesOf().added).toEqual(['fig']);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Edit other records' }));
    expect(changesOf()).toEqual({ added: [], removed: ['apple'], retained: ['pear', 'kiwi'] });
  });
});
