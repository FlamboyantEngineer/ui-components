import { createHooks } from '../../core/hooks.js';

export const avatarHooks = createHooks(
  'avatar',
  ['image', 'initials', 'fallback', 'glyph', 'surface', 'indicator', 'badge'],
  {
    root: 'avatar',
    image: 'avatar-image',
    initials: 'avatar-fallback',
    fallback: 'avatar-fallback',
    badge: 'avatar-badge',
  },
);
