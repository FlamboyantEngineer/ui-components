import { createHooks } from '../../core/hooks.js';

export const avatarHooks = createHooks('avatar', [
  'image',
  'initials',
  'fallback',
  'glyph',
  'surface',
  'indicator',
  'badge',
]);
