import { toCollectionSelectionProps } from '../../utils/collection-selection.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
/** Collection primitives receive encoded ids; owners and tree models keep their original keys. */
export function createTreeAriaKeys(options) {
    const { selection, expansion, disabledKeys, onAction } = options;
    return {
        ...toCollectionSelectionProps({ ...selection, disabledKeys }),
        expandedKeys: new Set([...expansion.expandedKeys].map(toCollectionKey)),
        onExpandedChange: (keys) => expansion.setExpandedKeys(new Set([...keys].map(fromCollectionKey))),
        onAction: onAction
            ? (key) => {
                const original = fromCollectionKey(key);
                if (toCollectionKey(original) === key)
                    onAction(original);
            }
            : undefined,
    };
}
//# sourceMappingURL=tree-aria-keys.js.map