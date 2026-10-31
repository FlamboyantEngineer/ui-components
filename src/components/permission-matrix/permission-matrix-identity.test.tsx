import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type * as TableModule from '../table/table.js';
import { PermissionMatrix } from './permission-matrix.js';

const tableProps = vi.hoisted(() => [] as Array<Record<string, unknown>>);

// Records the props each render hands the Table, to compare their identities.
vi.mock('../table/table.js', async (importOriginal) => {
  const actual = await importOriginal<typeof TableModule>();
  return {
    ...actual,
    Table: (props: Parameters<typeof actual.Table>[0]) => {
      tableProps.push(props as unknown as Record<string, unknown>);
      return createElement(actual.Table, props);
    },
  };
});

const roles = [
  { id: 'editor', label: 'Editor' },
  { id: 'viewer', label: 'Viewer' },
];
const permissions = [
  { id: 'read', label: 'Read pages' },
  { id: 'write', label: 'Write pages' },
];

describe('PermissionMatrix table identity', () => {
  it('UIC-PERMISSION-MATRIX-1.6 keeps the columns and rows it hands the table while grants change', async () => {
    const user = userEvent.setup();
    render(
      <PermissionMatrix
        aria-label="Access"
        roles={roles}
        permissions={permissions}
        defaultValue={[{ role: 'editor', permission: 'read' }]}
      />,
    );
    const first = tableProps.at(-1);
    const write = screen.getByLabelText('Write pages for Editor');
    await user.click(write);
    expect(write).toBeChecked();
    expect(screen.getByLabelText('Read pages for Editor')).toBeChecked();
    const last = tableProps.at(-1);
    expect(last).not.toBe(first);
    expect(last?.columns).toBe(first?.columns);
    expect(last?.rows).toBe(first?.rows);
    await user.click(write);
    expect(write).not.toBeChecked();
  });
});
