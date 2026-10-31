import { useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  PermissionMatrix,
  type PermissionMatrixChange,
  type PermissionMatrixGrant,
  type PermissionMatrixGroup,
  type PermissionMatrixPermission,
  type PermissionMatrixRole,
} from '../../src/components/permission-matrix/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const roles: PermissionMatrixRole[] = [
  { id: 'admin', label: 'Administrator', isReadOnly: true },
  { id: 'editor', label: 'Editor' },
  { id: 'reviewer', label: 'Reviewer' },
  { id: 'guest', label: 'Guest' },
];

const groups: PermissionMatrixGroup[] = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'photos', label: 'Photos' },
  { id: 'settings', label: 'Settings' },
];

const permissions: PermissionMatrixPermission[] = [
  { id: 'recipe-read', label: 'Read recipes', group: 'recipes' },
  { id: 'recipe-write', label: 'Write recipes', group: 'recipes' },
  { id: 'recipe-publish', label: 'Publish recipes', group: 'recipes' },
  { id: 'photo-upload', label: 'Upload photos', group: 'photos' },
  { id: 'photo-delete', label: 'Delete photos', group: 'photos' },
  { id: 'settings-edit', label: 'Edit site settings', group: 'settings' },
  { id: 'settings-members', label: 'Invite members', group: 'settings' },
];

const grantAll = (role: string) =>
  permissions.map((permission) => ({ role, permission: permission.id }));

const saved: PermissionMatrixGrant[] = [
  ...grantAll('admin'),
  { role: 'editor', permission: 'recipe-read' },
  { role: 'editor', permission: 'recipe-write' },
  { role: 'editor', permission: 'photo-upload' },
  { role: 'reviewer', permission: 'recipe-read' },
  { role: 'reviewer', permission: 'recipe-publish' },
];

/** What the guest and reviewer roles hold through the member role they extend. */
const inherited: PermissionMatrixGrant[] = [
  { role: 'guest', permission: 'recipe-read' },
  { role: 'reviewer', permission: 'photo-upload' },
];

const flatPermissions = permissions.slice(0, 3).map(({ id, label }) => ({ id, label }));

const layouts = {
  flat: { groups: undefined, permissions: flatPermissions },
  grouped: { groups, permissions: permissions.slice(0, 5) },
} as const;

const grantStates = {
  saved: { inherited: [], value: saved },
  inherited: { inherited, value: saved },
  dirty: { inherited: [], value: [...saved, { role: 'guest', permission: 'recipe-write' }] },
} as const;

function describeChange(change: PermissionMatrixChange): string {
  const role = roles.find((entry) => entry.id === change.role)?.label;
  const names = change.permissions.map(
    (key) => permissions.find((permission) => permission.id === key)?.label,
  );
  return `${change.isGranted ? 'Granted' : 'Revoked'} ${names.join(', ')} for ${role}`;
}

function RoleEditor() {
  const [committed, setCommitted] = useState(saved);
  const [value, setValue] = useState(saved);
  const [output, setOutput] = useState('No change yet');
  const [order, setOrder] = useState(roles);
  const reverseSoon = () =>
    window.setTimeout(() => setOrder((current) => [...current].reverse()), 1500);
  return (
    <div data-lab-demo="editor">
      <PermissionMatrix
        aria-label="Site roles"
        roles={order}
        permissions={permissions}
        groups={groups}
        inherited={inherited}
        value={value}
        committedValue={committed}
        onChange={(next, change) => {
          setValue(next);
          setOutput(describeChange(change));
        }}
      />
      <Button
        variant="primary"
        onPress={() => {
          setCommitted(value);
          setOutput(`Saved ${value.length} grants`);
        }}
      >
        Save
      </Button>
      <Button onPress={reverseSoon}>Reverse roles in 1.5 seconds</Button>
      <output data-lab-output>{output}</output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Saved grants, inherited grants drawn mixed, and a dirty cell that differs from the saved grants, as a flat list and in groups with group toggles. Administrator is read only."
    >
      <StateMatrix
        axes={{
          grants: Object.keys(grantStates) as Array<keyof typeof grantStates>,
          layout: Object.keys(layouts) as Array<keyof typeof layouts>,
        }}
        render={({ grants, layout }) => (
          <PermissionMatrix
            aria-label={`Roles, ${grants}, ${layout}`}
            roles={roles}
            permissions={layouts[layout].permissions}
            groups={layouts[layout].groups}
            inherited={grantStates[grants].inherited}
            defaultValue={grantStates[grants].value}
            committedValue={saved}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Editing roles"
      description="Tick cells or whole groups; changed cells are marked dirty until saved. Guest reads recipes and Reviewer uploads photos through an inherited role, drawn mixed until granted directly. Arrow keys move between checkboxes and Space toggles. Reversing the roles keeps the focused checkbox on its role."
    >
      <RoleEditor />
    </LabSection>
  </>,
);
