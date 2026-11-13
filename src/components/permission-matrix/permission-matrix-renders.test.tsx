import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type * as CheckboxModule from '../checkbox/checkbox.js';
import { PermissionMatrix } from './permission-matrix.js';

const drawn = vi.hoisted(() => ({ grants: new Map<string, number>() }));

// Counts each grant checkbox's renders by its name, around the real checkbox.
vi.mock('../checkbox/checkbox.js', async (importOriginal) => {
  const original = await importOriginal<typeof CheckboxModule>();
  return {
    ...original,
    Checkbox: (props: Parameters<typeof original.Checkbox>[0]) => {
      const name = props['aria-label'];
      if (typeof name === 'string') drawn.grants.set(name, (drawn.grants.get(name) ?? 0) + 1);
      return original.Checkbox(props);
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
  { id: 'upload', label: 'Upload files' },
];

describe('PermissionMatrix renders', () => {
  it('UIC-PERMISSION-MATRIX-1.6 draws again only the checkbox whose grant changed', async () => {
    const user = userEvent.setup();
    render(<PermissionMatrix aria-label="Access" roles={roles} permissions={permissions} />);
    const changed = screen.getByRole('checkbox', { name: /Write pages.*Editor/ });
    const name = changed.getAttribute('aria-label') ?? '';
    const before = new Map(drawn.grants);
    await user.click(changed);
    expect(changed).toBeChecked();
    const redrawn = [...drawn.grants].filter(
      ([label, count]) => count !== before.get(label) && label.includes('pages'),
    );
    expect(redrawn.map(([label]) => label)).toEqual([name]);
  });
});
