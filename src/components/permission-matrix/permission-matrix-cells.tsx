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

interface GrantCheckboxProps {
  role: PermissionMatrixRole;
  permission: PermissionMatrixPermission;
  context: PermissionCellContext;
}

interface GroupCheckboxProps {
  role: PermissionMatrixRole;
  /** The group's name. */
  label: string;
  permissions: readonly PermissionMatrixPermission[];
  context: PermissionCellContext;
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
          <Glyph name="lock" className={hooks.slotClass('lock')} />
          <VisuallyHidden elementType="span">{`, ${strings.readOnlyRole}`}</VisuallyHidden>
        </>
      ) : null}
    </span>
  );
}

/**
 * The checkbox of one role and permission: ticked while granted, drawn mixed while only
 * inherited, read only in a read-only role, and dirty while it differs from the committed grants.
 */
export function PermissionGrantCheckbox({ role, permission, context }: GrantCheckboxProps) {
  const strings = useUiStrings();
  const isGranted = context.grants.has(role.id, permission.id);
  const isInherited = context.inherited.has(role.id, permission.id);
  const isDirty = isGranted !== context.committed.has(role.id, permission.id);
  return (
    <Checkbox
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
export function PermissionGroupCheckbox({ role, label, permissions, context }: GroupCheckboxProps) {
  const strings = useUiStrings();
  const keys: Key[] = permissions.map((permission) => permission.id);
  const held = keys.filter((key) => context.grants.has(role.id, key)).length;
  const isAll = keys.length > 0 && held === keys.length;
  return (
    <Checkbox
      aria-label={strings.permissionGroupGrant(label, role.label)}
      isSelected={isAll}
      isIndeterminate={held > 0 && !isAll}
      isReadOnly={role.isReadOnly}
      className={hooks.slotClass('group-grant')}
      onChange={() => context.onChange({ role: role.id, permissions: keys, isGranted: !isAll })}
    />
  );
}
