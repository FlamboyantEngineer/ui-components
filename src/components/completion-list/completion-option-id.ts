import type { Key } from '../../core/props.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';

/** The option element id an editor names in `aria-activedescendant`. */
export function getCompletionOptionId(listId: string, key: Key): string {
  return `${listId}-option-${toCollectionKey(key)}`;
}
