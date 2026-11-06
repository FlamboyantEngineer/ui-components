import { createHooks } from '../../core/hooks.js';

/** The hook classes of the rating field (specs/RATING-FIELD.md). */
export const ratingFieldHooks = createHooks('rating-field', [
  'group',
  'item',
  'glyph',
  'fill',
  'radio',
]);

/** The hook classes of the read-only rating (specs/RATING-FIELD.md). */
export const ratingHooks = createHooks('rating', ['item', 'glyph', 'fill']);
