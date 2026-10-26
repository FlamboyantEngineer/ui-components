import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  MappingTable,
  type MappingTableColumn,
  type MappingTableProps,
  type MappingTableTarget,
  type MappingTableValue,
} from './mapping-table.js';

const columns: MappingTableColumn[] = [
  { id: 'name', label: 'Name', samples: ['Ada', 'Alan'] },
  { id: 'mail', label: 'Mail', samples: ['ada@example.com'] },
  { id: 'town', label: 'Town' },
];

const targets: MappingTableTarget[] = [
  { id: 'full-name', label: 'Full name', isRequired: true },
  { id: 'email', label: 'Email', isRequired: true },
  { id: 'city', label: 'City' },
];

const suggest = (column: MappingTableColumn) =>
  ({ name: 'full-name', mail: 'email' })[column.id] ?? null;

function Controlled(
  props: Partial<MappingTableProps> & { onValue?: (value: MappingTableValue) => void },
) {
  const [value, setValue] = useState<MappingTableValue>(props.defaultValue ?? {});
  return (
    <MappingTable
      columns={columns}
      targets={targets}
      {...props}
      defaultValue={undefined}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onValue?.(next);
      }}
    />
  );
}

const row = (key: string) =>
  requireDefined(document.querySelector(`.ui-mapping-table__row[data-key="${key}"]`));
const choice = (column: string) =>
  screen.getByRole('button', { name: new RegExp(`Import ${column} as`) });

// Each choice opens a React Aria select popover, which is slow under a loaded runner.
describe('MappingTable', { timeout: 15_000 }, () => {
  it('UIC-MAPPING-TABLE-1.1 UIC-MAPPING-TABLE-3.1 draws a row per source column with its samples and choice', () => {
    const { container } = render(
      <MappingTable columns={columns} targets={targets} getSuggestion={suggest} />,
    );
    const table = screen.getByRole('group', { name: 'Column mapping' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Column', 'Sample values', 'Import as']);
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Name', 'Mail', 'Town']);
    expect(row('name').querySelectorAll('.ui-mapping-table__sample')).toHaveLength(2);
    expect(choice('Name')).toHaveTextContent('Full name');
    expect(choice('Town')).toHaveTextContent('Don’t import');
    expect(row('name')).toHaveAttribute('data-mapped', 'true');
    expect(row('town')).not.toHaveAttribute('data-mapped');
    expect(within(table).getByRole('status')).toHaveTextContent(
      '2 of 3 columns mapped · 1 not imported',
    );
    expectHooksMatchSpec(container, 'MAPPING-TABLE', {
      slots: [
        'table',
        'row',
        'column',
        'samples',
        'sample',
        'target',
        'select',
        'suggested',
        'summary',
        'counts',
      ],
    });
  });

  it('UIC-MAPPING-TABLE-1.1 lists the targets after Don’t import, marking required ones', async () => {
    const user = userEvent.setup();
    render(<MappingTable aria-label="Contacts" columns={columns} targets={targets} />);
    expect(screen.getByRole('group', { name: 'Contacts' })).toBeInTheDocument();
    await user.click(choice('Town'));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Don’t import',
      'Full name Required',
      'Email Required',
      'City',
    ]);
  });

  it('UIC-MAPPING-TABLE-1.2 reports the whole mapping after each choice', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled defaultValue={{ name: 'full-name', mail: 'email' }} onValue={onValue} />);
    await user.click(choice('Town'));
    await user.click(await screen.findByRole('option', { name: 'City' }));
    expect(onValue).toHaveBeenLastCalledWith({ name: 'full-name', mail: 'email', town: 'city' });
    await user.click(choice('Mail'));
    await user.click(await screen.findByRole('option', { name: 'Don’t import' }));
    expect(onValue).toHaveBeenLastCalledWith({ name: 'full-name', mail: null, town: 'city' });
  });

  it('UIC-MAPPING-TABLE-1.3 starts from the suggestions and marks choices that match them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MappingTable
        columns={columns}
        targets={targets}
        getSuggestion={suggest}
        onChange={onChange}
      />,
    );
    expect(row('name')).toHaveAttribute('data-suggested', 'true');
    expect(row('name').querySelector('.ui-mapping-table__suggested')).toHaveTextContent(
      'Suggested',
    );
    expect(row('town')).not.toHaveAttribute('data-suggested');
    await user.click(choice('Name'));
    await user.click(await screen.findByRole('option', { name: 'City' }));
    expect(onChange).toHaveBeenLastCalledWith({ name: 'city', mail: 'email', town: null });
    expect(row('name')).not.toHaveAttribute('data-suggested');
  });

  it('UIC-MAPPING-TABLE-1.4 shows read-only choices', () => {
    render(<MappingTable columns={columns} targets={targets} isReadOnly />);
    expect(choice('Name').closest('.ui-select-field')).toHaveAttribute('data-readonly', 'true');
  });

  it('UIC-MAPPING-TABLE-2.1 UIC-MAPPING-TABLE-2.2 counts the mapping and names unmapped required targets', async () => {
    const user = userEvent.setup();
    const { container } = render(<Controlled defaultValue={{ name: 'full-name' }} />);
    const table = screen.getByRole('group', { name: 'Column mapping' });
    expect(table).not.toHaveAttribute('data-complete');
    expect(container.querySelector('.ui-mapping-table__counts')).toHaveTextContent(
      '1 of 3 columns mapped · 2 not imported',
    );
    expect(container.querySelector('.ui-mapping-table__problem')).toHaveTextContent(
      'Required fields not mapped: Email.',
    );
    await user.click(choice('Mail'));
    await user.click(await screen.findByRole('option', { name: /Email/ }));
    expect(table).toHaveAttribute('data-complete', 'true');
    expect(container.querySelector('.ui-mapping-table__problem')).toBeNull();
    expectHooksMatchSpec(container, 'MAPPING-TABLE');
  });

  it('UIC-MAPPING-TABLE-2.3 warns on every row of a target chosen twice', () => {
    render(
      <MappingTable
        columns={columns}
        targets={targets}
        defaultValue={{ name: 'full-name', mail: 'email', town: 'email' }}
      />,
    );
    expect(row('mail')).toHaveAttribute('data-duplicate', 'true');
    expect(row('town')).toHaveAttribute('data-duplicate', 'true');
    expect(row('name')).not.toHaveAttribute('data-duplicate');
    expect(row('mail')).toHaveTextContent('Email is also mapped from Town.');
    expect(row('town')).toHaveTextContent('Email is also mapped from Mail.');
    expect(screen.getByRole('group', { name: 'Column mapping' })).toHaveAttribute(
      'data-complete',
      'true',
    );
  });
});
