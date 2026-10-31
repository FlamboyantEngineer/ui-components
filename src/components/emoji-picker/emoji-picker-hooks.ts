import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the emoji-picker family writes (specs/EMOJI-PICKER.md). */
export const emojiPickerHooks = createHooks('emoji-picker', [
  'categories',
  'message',
  'search',
  'search-input',
  'search-clear',
  'preview',
  'preview-emoji',
  'preview-label',
  'skin-tones',
  'skin-tone',
  'popover',
  'footer',
  'section',
  'label',
  'grid',
  'cell',
  'image',
]);
