import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the avatar-group family writes (specs/AVATAR-GROUP.md). */
export const avatarGroupHooks = createHooks('avatar-group', [
  'avatar',
  'dot',
  'overflow',
  'trigger',
  'popover',
  'list',
  'item',
  'menu',
]);
