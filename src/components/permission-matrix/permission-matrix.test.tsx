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

const box = (name: string) => screen.getByRole('checkbox', { name });

describe('PermissionMatrix', () => {
  it('UIC-PERMISSION-MATRIX-1.1 UIC-PERMISSION-MATRIX-1.2 UIC-PERMISSION-MATRIX-1.4 UIC-PERMISSION-MATRIX-3.1 renders roles × permissions in groups', () => {
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
    expectHooksMatchSpec(container, 'PERMISSION-MATRIX', {
      slots: 'all',
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-PERMISSION-MATRIX-2.1 UIC-PERMISSION-MATRIX-2.4 reports a cell change as plain data and dirties the cell', async () => {
    const onChange = vi.fn<OnChange>();
    render(<Matrix onChange={onChange} />);
    await userEvent.click(box('Write pages for Editor'));
    expect(onChange).toHaveBeenLastCalledWith(
      [...grants, { role: 'editor', permission: 'write' }],
      {
        role: 'editor',
        permissions: ['write'],
        isGranted: true,
      },
    );
    expect(box('Write pages for Editor')).toBeChecked();
    const grant = box('Write pages for Editor').closest('.ui-permission-matrix__grant');
    expect(grant).toHaveAttribute('data-dirty', 'true');
    await userEvent.click(box('Write pages for Editor'));
    expect(onChange).toHaveBeenLastCalledWith(grants, {
      role: 'editor',
      permissions: ['write'],
      isGranted: false,
    });
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
    render(<Matrix inherited={[{ role: 'viewer', permission: 'read' }]} />);
    const inherited = box('Read pages for Viewer, inherited');
    expect(inherited).toBePartiallyChecked();
    const grant = inherited.closest('.ui-permission-matrix__grant');
    expect(grant).toHaveAttribute('data-inherited', 'true');
    await userEvent.click(inherited);
    expect(box('Read pages for Viewer')).toBeChecked();
    expect(grant).toHaveAttribute('data-inherited', 'true');
  });

  it('UIC-PERMISSION-MATRIX-2.3 grants and revokes a whole group from its header row', async () => {
    const onChange = vi.fn<OnChange>();
    render(<Matrix onChange={onChange} />);
    const files = box('All Files for Editor');
    expect(files).toBePartiallyChecked();
    expect(box('All Pages for Owner')).toBeChecked();
    expect(box('All Pages for Viewer')).not.toBeChecked();
    await userEvent.click(files);
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Array), {
      role: 'editor',
      permissions: ['upload', 'delete'],
      isGranted: true,
    });
    expect(box('All Files for Editor')).toBeChecked();
    expect(box('Delete files for Editor')).toBeChecked();
    await userEvent.click(box('All Files for Editor'));
    expect(box('Upload files for Editor')).not.toBeChecked();
    expect(box('All Empty for Editor')).not.toBeChecked();
  });

  it('UIC-PERMISSION-MATRIX-1.3 keeps read-only roles unchanged', async () => {
    const onChange = vi.fn<OnChange>();
    const { container } = render(<Matrix onChange={onChange} />);
    expect(container.querySelector('.ui-permission-matrix__role[data-readonly]')).toHaveTextContent(
      'Owner',
    );
    expect(box('Read pages for Owner')).toHaveAttribute('aria-readonly', 'true');
    await userEvent.click(box('Read pages for Owner'));
    await userEvent.click(box('All Pages for Owner'));
    expect(onChange).not.toHaveBeenCalled();
    expect(box('Read pages for Owner')).toBeChecked();
  });

  it('UIC-PERMISSION-MATRIX-1.2 UIC-PERMISSION-MATRIX-3.1 lists permissions flat without groups and toggles from the keyboard', async () => {
    const onChange = vi.fn<OnChange>();
    render(<Matrix groups={undefined} onChange={onChange} />);
    expect(screen.getByRole('grid', { name: 'Access' })).toBeInTheDocument();
    expect(document.querySelector('.ui-table__group-row')).toBeNull();
    await userEvent.click(box('Read pages for Viewer'));
    await userEvent.keyboard('{ArrowDown}');
    expect(box('Write pages for Viewer')).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Array), {
      role: 'viewer',
      permissions: ['write'],
      isGranted: true,
    });
  });
});
