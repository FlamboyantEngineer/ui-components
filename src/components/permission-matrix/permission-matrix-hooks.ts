import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the permission matrix writes (specs/PERMISSION-MATRIX.md). */
export const permissionMatrixHooks = createHooks('permission-matrix', [
  'role',
  'role-label',
  'lock',
  'grant',
  'group-grant',
]);
