import { describe, expect, it } from 'vitest';
import { applyPermissionChange, indexGrants } from './permission-grants.js';

const grants = [
  { role: 'editor', permission: 'read' },
  { role: 'editor', permission: 'write' },
  { role: 1, permission: 'read' },
];

describe('permission grants', () => {
  it('UIC-PERMISSION-MATRIX-2.1 indexes grants by role and permission', () => {
    const index = indexGrants(grants);
    expect(index.has('editor', 'write')).toBe(true);
    expect(index.has(1, 'read')).toBe(true);
    expect(index.has('1', 'read')).toBe(false);
    expect(index.has('viewer', 'read')).toBe(false);
  });

  it('UIC-PERMISSION-MATRIX-2.1 applies a change without touching the grants', () => {
    expect(
      applyPermissionChange(grants, {
        role: 'editor',
        permissions: ['write', 'delete'],
        isGranted: true,
      }),
    ).toEqual([...grants, { role: 'editor', permission: 'delete' }]);
    expect(
      applyPermissionChange(grants, {
        role: 'editor',
        permissions: ['read', 'write'],
        isGranted: false,
      }),
    ).toEqual([{ role: 1, permission: 'read' }]);
    expect(grants).toHaveLength(3);
  });
});
