'use client';

import { createContext, useContext } from 'react';
import { LockGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { PermissionGrantIndex, PermissionMatrixChange } from './permission-grants.js';
import type { PermissionMatrixPermission, PermissionMatrixRole } from './permission-matrix.js';
import { permissionMatrixHooks as hooks } from './permission-matrix-hooks.js';

/** The grants a role's cells read and how they report changes. */
export interface PermissionCellContext {
  grants: PermissionGrantIndex;
  inherited: PermissionGrantIndex;
  committed: PermissionGrantIndex;
  onChange: (change: PermissionMatrixChange) => void;
}

/**
 * The grants for the matrix's cells. A context rather than a column closure, so the matrix's columns
 * stay the same while the grants change.
 */
export const PermissionCellsContext = createContext<PermissionCellContext | null>(null);

function usePermissionCells(): PermissionCellContext {
  const context = useContext(PermissionCellsContext);
  if (!context) throw new Error('Permission cells render inside a PermissionMatrix.');
  return context;
}

interface GrantCheckboxProps {
  role: PermissionMatrixRole;
  permission: PermissionMatrixPermission;
}

interface GroupCheckboxProps {
  role: PermissionMatrixRole;
  /** The group's name. */
  label: string;
  permissions: readonly PermissionMatrixPermission[];
}

/** A role's column header: its label, and a lock read as the provider's `readOnlyRole` when read only. */
export function PermissionRoleHeader({ role }: { role: PermissionMatrixRole }) {
  const strings = useUiStrings();
  const isReadOnly = role.isReadOnly ?? false;
  return (
    <span {...hooks.slot('role', { readonly: isReadOnly })}>
      <span {...hooks.slot('role-label')}>{role.label}</span>
      {isReadOnly ? (
        <>
          <Glyph icon={LockGlyph} className={hooks.slotClass('lock')} />
          <VisuallyHidden as="span">{`, ${strings.readOnlyRole}`}</VisuallyHidden>
        </>
      ) : null}
    </span>
  );
}

/**
 * The checkbox of one role and permission: ticked while granted, drawn mixed while only
 * inherited, read only in a read-only role, and dirty while it differs from the committed grants.
 */
export function PermissionGrantCheckbox({ role, permission }: GrantCheckboxProps) {
  const strings = useUiStrings();
  const context = usePermissionCells();
  const isGranted = context.grants.has(role.id, permission.id);
  const isInherited = context.inherited.has(role.id, permission.id);
  const isDirty = isGranted !== context.committed.has(role.id, permission.id);
  return (
    <Checkbox
      size="sm"
      aria-label={strings.permissionGrant(permission.label, role.label, isInherited && !isGranted)}
      isSelected={isGranted}
      isIndeterminate={isInherited && !isGranted}
      isReadOnly={role.isReadOnly}
      className={hooks.slotClass('grant')}
      data-inherited={isInherited || undefined}
      data-dirty={isDirty || undefined}
      onChange={(isSelected) =>
        context.onChange({ role: role.id, permissions: [permission.id], isGranted: isSelected })
      }
    />
  );
}

/**
 * A group header's checkbox for one role: ticked while the role holds every permission of the
 * group, mixed while it holds some; a press grants them all, or revokes them all once all are held.
 */
export function PermissionGroupCheckbox({ role, label, permissions }: GroupCheckboxProps) {
  const strings = useUiStrings();
  const context = usePermissionCells();
  const keys: Key[] = permissions.map((permission) => permission.id);
  const held = keys.filter((key) => context.grants.has(role.id, key)).length;
  const isAll = keys.length > 0 && held === keys.length;
  return (
    <Checkbox
      size="sm"
      aria-label={strings.permissionGroupGrant(label, role.label)}
      isSelected={isAll}
      isIndeterminate={held > 0 && !isAll}
      isReadOnly={role.isReadOnly}
      className={hooks.slotClass('group-grant')}
      onChange={() => context.onChange({ role: role.id, permissions: keys, isGranted: !isAll })}
    />
  );
}
