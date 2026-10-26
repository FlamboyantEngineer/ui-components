import { toCollectionKey } from '../../utils/to-collection-key.js';
/** The option element id an editor names in `aria-activedescendant`. */
export function getCompletionOptionId(listId, key) {
    return `${listId}-option-${toCollectionKey(key)}`;
}
//# sourceMappingURL=completion-option-id.js.map