import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { PermissionMatrixChange, PermissionMatrixGrant } from './permission-grants.js';
import { PermissionMatrix, type PermissionMatrixProps } from './permission-matrix.js';

const roles = [
  { id: 'owner', label: 'Owner', isReadOnly: true },
  { id: 'editor', label: 'Editor' },
  { id: 'viewer', label: 'Viewer' },
];
const groups = [
  { id: 'pages', label: 'Pages' },
  { id: 'files', label: 'Files' },
];
const permissions = [
  { id: 'read', label: 'Read pages', group: 'pages' },
  { id: 'write', label: 'Write pages', group: 'pages' },
  { id: 'upload', label: 'Upload files', group: 'files' },
  { id: 'delete', label: 'Delete files', group: 'files' },
  { id: 'audit', label: 'Audit log' },
];
const grants: PermissionMatrixGrant[] = [
  { role: 'owner', permission: 'read' },
  { role: 'owner', permission: 'write' },
  { role: 'editor', permission: 'read' },
  { role: 'editor', permission: 'upload' },
];

type OnChange = (value: PermissionMatrixGrant[], change: PermissionMatrixChange) => void;

function Matrix(props: Partial<PermissionMatrixProps>) {
  return (
    <PermissionMatrix
      aria-label="Access"
      roles={roles}
      permissions={permissions}
      groups={groups}
      defaultValue={grants}
      {...props}
    />
  );
}

// Checkboxes are named by `aria-label`; a label query finds one without computing the role and
// name of every element in the grid, which is what makes role queries slow in a large table.
const box = (name: string) => screen.getByLabelText<HTMLInputElement>(name);

describe('PermissionMatrix', () => {
  it('UIC-PERMISSION-MATRIX-1.1 UIC-PERMISSION-MATRIX-1.4 renders a role column per role and carries caller attributes', () => {
    const { container } = render(
      <Matrix
        id="access"
        className="mine"
        data-test="matrix"
        inherited={[{ role: 'viewer', permission: 'read' }]}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-permission-matrix', 'mine');
    expect(root).toHaveAttribute('id', 'access');
    expect(root).toHaveAttribute('data-test', 'matrix');
    const grid = screen.getByRole('treegrid', { name: 'Access' });
    const headers = within(grid).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
      'Permissions',
      'Owner, Read only',
      'Editor',
      'Viewer',
    ]);
    expectHooksMatchSpec(container, 'PERMISSION-MATRIX', {
      slots: 'all',
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-PERMISSION-MATRIX-1.2 UIC-PERMISSION-MATRIX-3.1 lists permissions in groups with checkboxes named by permission and role', () => {
    render(<Matrix />);
    const grid = screen.getByRole('treegrid', { name: 'Access' });
    const rowHeaders = within(grid)
      .getAllByRole('rowheader')
      .filter((header) => !header.closest('.ui-table__group-row'));
    expect(rowHeaders.map((header) => header.textContent)).toEqual([
      'Read pages',
      'Write pages',
      'Upload files',
      'Delete files',
      'Audit log',
    ]);
    expect(grid.querySelectorAll('.ui-table__group-label')).toHaveLength(3);
    expect(
      [...grid.querySelectorAll('.ui-table__group-label')].map((label) => label.textContent),
    ).toEqual(['Pages', 'Files', 'Empty']);
    expect(box('Read pages for Editor')).toBeChecked();
    expect(box('Write pages for Editor')).not.toBeChecked();
  });

  it('UIC-PERMISSION-MATRIX-2.1 reports a cell change as plain data', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<OnChange>();
    render(<Matrix onChange={onChange} />);
    const write = box('Write pages for Editor');
    await user.click(write);
    expect(onChange).toHaveBeenLastCalledWith(
      [...grants, { role: 'editor', permission: 'write' }],
      {
        role: 'editor',
        permissions: ['write'],
        isGranted: true,
      },
    );
    expect(write).toBeChecked();
    await user.click(write);
    expect(onChange).toHaveBeenLastCalledWith(grants, {
      role: 'editor',
      permissions: ['write'],
      isGranted: false,
    });
  });

  it('UIC-PERMISSION-MATRIX-2.4 dirties a changed cell until it matches again', async () => {
    const user = userEvent.setup();
    render(<Matrix />);
    const write = box('Write pages for Editor');
    const grant = write.closest('.ui-permission-matrix__grant');
    await user.click(write);
    expect(grant).toHaveAttribute('data-dirty', 'true');
    await user.click(write);
    expect(grant).not.toHaveAttribute('data-dirty');
  });

  it('UIC-PERMISSION-MATRIX-2.4 marks dirty cells against the committed grants when controlled', () => {
    render(
      <Matrix
        defaultValue={undefined}
        value={[{ role: 'viewer', permission: 'read' }]}
        committedValue={[{ role: 'viewer', permission: 'audit' }]}
      />,
    );
    const dirty = document.querySelectorAll('.ui-permission-matrix__grant[data-dirty]');
    expect(
      [...dirty].map((node) => node.querySelector('input')?.getAttribute('aria-label')),
    ).toEqual(['Read pages for Viewer', 'Audit log for Viewer']);
  });

  it('UIC-PERMISSION-MATRIX-2.2 draws inherited permissions mixed until granted directly', async () => {
    const user = userEvent.setup();
    render(<Matrix inherited={[{ role: 'viewer', permission: 'read' }]} />);
    const inherited = box('Read pages for Viewer, inherited');
    expect(inherited).toBePartiallyChecked();
    const grant = inherited.closest('.ui-permission-matrix__grant');
    expect(grant).toHaveAttribute('data-inherited', 'true');
    await user.click(inherited);
    expect(box('Read pages for Viewer')).toBeChecked();
    expect(grant).toHaveAttribute('data-inherited', 'true');
  });

  it('UIC-PERMISSION-MATRIX-2.3 draws a group checkbox per role from its permissions', () => {
    render(<Matrix />);
    expect(box('All Files for Editor')).toBePartiallyChecked();
    expect(box('All Pages for Owner')).toBeChecked();
    expect(box('All Pages for Viewer')).not.toBeChecked();
  });

  it('UIC-PERMISSION-MATRIX-2.3 grants and revokes a whole group from its header row', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<OnChange>();
    render(<Matrix onChange={onChange} />);
    const files = box('All Files for Editor');
    await user.click(files);
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Array), {
      role: 'editor',
      permissions: ['upload', 'delete'],
      isGranted: true,
    });
    expect(box('All Files for Editor')).toBeChecked();
    expect(box('Delete files for Editor')).toBeChecked();
    await user.click(box('All Files for Editor'));
    expect(box('Upload files for Editor')).not.toBeChecked();
    expect(box('All Empty for Editor')).not.toBeChecked();
  });

  it('UIC-PERMISSION-MATRIX-1.3 keeps read-only roles unchanged', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<OnChange>();
    const { container } = render(<Matrix onChange={onChange} />);
    expect(container.querySelector('.ui-permission-matrix__role[data-readonly]')).toHaveTextContent(
      'Owner',
    );
    const read = box('Read pages for Owner');
    expect(read).toHaveAttribute('aria-readonly', 'true');
    await user.click(read);
    await user.click(box('All Pages for Owner'));
    expect(onChange).not.toHaveBeenCalled();
    expect(read).toBeChecked();
  });

  it('UIC-PERMISSION-MATRIX-1.2 UIC-PERMISSION-MATRIX-3.1 lists permissions flat without groups and toggles from the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<OnChange>();
    render(<Matrix groups={undefined} onChange={onChange} />);
    expect(screen.getByRole('grid', { name: 'Access' })).toBeInTheDocument();
    expect(document.querySelector('.ui-table__group-row')).toBeNull();
    await user.click(box('Read pages for Viewer'));
    await user.keyboard('{ArrowDown}');
    expect(box('Write pages for Viewer')).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Array), {
      role: 'viewer',
      permissions: ['write'],
      isGranted: true,
    });
  });
});
