import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PermissionMatrixChange, PermissionMatrixGrant } from './permission-grants.js';
import {
  PermissionMatrix,
  type PermissionMatrixGroup,
  type PermissionMatrixPermission,
} from './permission-matrix.js';

const roles = [{ id: 'a', label: 'Admin' }];
const first = { id: 'g', label: 'First' };
const second = { id: 'h', label: 'Second' };
const permissions = [
  { id: 'read', label: 'Read', group: 'g' },
  { id: 'write', label: 'Write', group: 'h' },
];

type OnChange = (value: PermissionMatrixGrant[], change: PermissionMatrixChange) => void;

function renderMatrix(
  groups: readonly PermissionMatrixGroup[],
  items: readonly PermissionMatrixPermission[] = permissions,
) {
  const onChange = vi.fn<OnChange>();
  const matrix = (next: readonly PermissionMatrixGroup[]) => (
    <PermissionMatrix
      aria-label="Access"
      roles={roles}
      permissions={items}
      groups={next}
      onChange={onChange}
    />
  );
  const view = render(matrix(groups));
  return {
    onChange,
    update: (next: readonly PermissionMatrixGroup[]) => view.rerender(matrix(next)),
  };
}

const box = (name: string) => screen.getByLabelText<HTMLInputElement>(name);
// The checkboxes in row order: each group's, then its permissions' while the group is expanded.
const shown = () =>
  screen.queryAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'));

describe('PermissionMatrix groups as groups change', () => {
  it('UIC-PERMISSION-MATRIX-1.8 keeps a focused group checkbox on its group when the groups reorder', async () => {
    const user = userEvent.setup();
    const { onChange, update } = renderMatrix([first, second]);
    await user.click(box('All First for Admin'));
    expect(onChange.mock.lastCall?.[1]).toEqual({
      role: 'a',
      permissions: ['read'],
      isGranted: true,
    });
    update([second, first]);
    expect(box('All First for Admin')).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange.mock.lastCall?.[1]).toEqual({
      role: 'a',
      permissions: ['read'],
      isGranted: false,
    });
    expect(box('Read for Admin')).not.toBeChecked();
    expect(box('Write for Admin')).not.toBeChecked();
  });

  it('UIC-PERMISSION-MATRIX-1.8 keeps a group collapsed by id as groups reorder, join and leave', async () => {
    const user = userEvent.setup();
    const { update } = renderMatrix([first, second]);
    await user.click(screen.getByRole('button', { name: /^Collapse .*First/ }));
    expect(shown()).toEqual(['All First for Admin', 'All Second for Admin', 'Write for Admin']);
    update([second, first]);
    expect(shown()).toEqual(['All Second for Admin', 'Write for Admin', 'All First for Admin']);
    update([{ id: 'z', label: 'New' }, second, first]);
    expect(shown()).toEqual(['All Second for Admin', 'Write for Admin', 'All First for Admin']);
    update([first]);
    expect(shown()).toEqual(['All First for Admin', 'All Empty for Admin', 'Write for Admin']);
    expect(screen.getByRole('button', { name: /^Expand .*First/ })).toBeInTheDocument();
  });

  it('UIC-PERMISSION-MATRIX-1.8 tells numeric and text group ids apart and orders groups as given', () => {
    renderMatrix(
      [
        { id: '1', label: 'Text one' },
        { id: 1, label: 'Number one' },
      ],
      [
        { id: 'read', label: 'Read', group: 1 },
        { id: 'write', label: 'Write', group: '1' },
      ],
    );
    expect(shown()).toEqual([
      'All Text one for Admin',
      'Write for Admin',
      'All Number one for Admin',
      'Read for Admin',
    ]);
  });
});
