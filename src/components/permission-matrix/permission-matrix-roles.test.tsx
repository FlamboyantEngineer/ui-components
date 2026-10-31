import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PermissionMatrixChange, PermissionMatrixGrant } from './permission-grants.js';
import { PermissionMatrix, type PermissionMatrixRole } from './permission-matrix.js';

const editor = { id: 'editor', label: 'Editor' };
const viewer = { id: 'viewer', label: 'Viewer' };
const auditor = { id: 'auditor', label: 'Auditor' };
const groups = [{ id: 'pages', label: 'Pages' }];
const permissions = [
  { id: 'read', label: 'Read', group: 'pages' },
  { id: 'write', label: 'Write', group: 'pages' },
];

type OnChange = (value: PermissionMatrixGrant[], change: PermissionMatrixChange) => void;

function renderMatrix(roles: readonly PermissionMatrixRole[]) {
  const onChange = vi.fn<OnChange>();
  const matrix = (next: readonly PermissionMatrixRole[]) => (
    <PermissionMatrix
      aria-label="Access"
      roles={next}
      permissions={permissions}
      groups={groups}
      onChange={onChange}
    />
  );
  const view = render(matrix(roles));
  return {
    onChange,
    update: (next: readonly PermissionMatrixRole[]) => view.rerender(matrix(next)),
  };
}

const box = (name: string) => screen.getByLabelText<HTMLInputElement>(name);
const lastChange = (onChange: ReturnType<typeof vi.fn<OnChange>>) => onChange.mock.lastCall?.[1];

describe('PermissionMatrix role columns as roles change', () => {
  it('UIC-PERMISSION-MATRIX-1.5 keeps a focused grant on its role when the roles reorder', async () => {
    const user = userEvent.setup();
    const { onChange, update } = renderMatrix([editor, viewer]);
    await user.click(box('Write for Editor'));
    expect(lastChange(onChange)).toEqual({
      role: 'editor',
      permissions: ['write'],
      isGranted: true,
    });
    update([viewer, editor]);
    expect(box('Write for Editor')).toHaveFocus();
    await user.keyboard(' ');
    expect(lastChange(onChange)).toEqual({
      role: 'editor',
      permissions: ['write'],
      isGranted: false,
    });
    expect(onChange.mock.calls.every(([, change]) => change.role === 'editor')).toBe(true);
  });

  it('UIC-PERMISSION-MATRIX-1.5 keeps a focused group grant on its role when a role is inserted', async () => {
    const user = userEvent.setup();
    const { onChange, update } = renderMatrix([editor, viewer]);
    await user.click(box('All Pages for Viewer'));
    update([auditor, editor, viewer]);
    expect(box('All Pages for Viewer')).toHaveFocus();
    await user.keyboard(' ');
    expect(lastChange(onChange)).toEqual({
      role: 'viewer',
      permissions: ['read', 'write'],
      isGranted: false,
    });
  });

  it('UIC-PERMISSION-MATRIX-1.5 keeps roles whose ids differ only in type apart', async () => {
    const user = userEvent.setup();
    const { onChange } = renderMatrix([
      { id: 1, label: 'Numbered' },
      { id: '1', label: 'Named' },
    ]);
    await user.click(box('Read for Named'));
    expect(lastChange(onChange)).toEqual({ role: '1', permissions: ['read'], isGranted: true });
    await user.click(box('Read for Numbered'));
    expect(lastChange(onChange)).toEqual({ role: 1, permissions: ['read'], isGranted: true });
  });

  it('UIC-PERMISSION-MATRIX-1.5 moves focus off a removed role to the next cell of its row', async () => {
    const user = userEvent.setup();
    const { onChange, update } = renderMatrix([editor, viewer]);
    await user.click(box('Write for Editor'));
    const removed = box('Write for Editor');
    onChange.mockClear();
    update([viewer]);
    expect(removed).not.toBeInTheDocument();
    expect(box('Write for Viewer')).toHaveFocus();
    expect(box('Write for Viewer')).not.toBe(removed);
    await user.keyboard(' ');
    expect(lastChange(onChange)).toEqual({
      role: 'viewer',
      permissions: ['write'],
      isGranted: true,
    });
  });

  it('UIC-PERMISSION-MATRIX-1.5 keeps a role read only by its id when the roles reorder', async () => {
    const user = userEvent.setup();
    const { onChange, update } = renderMatrix([{ ...editor, isReadOnly: true }, viewer]);
    await user.click(box('Read for Viewer'));
    update([viewer, { ...editor, isReadOnly: true }]);
    expect(box('Read for Viewer')).toHaveFocus();
    expect(box('Read for Editor')).toHaveAttribute('aria-readonly', 'true');
    await user.keyboard(' ');
    expect(onChange.mock.calls.map(([, change]) => change.role)).toEqual(['viewer', 'viewer']);
  });
});
