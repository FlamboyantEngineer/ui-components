// The state a navigation rail shares with its sections, items and groups.
import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { usePersistentState } from '../../core/provider.js';
export const navigationRailHooks = createHooks('navigation-rail', [
    'header',
    'toggle',
    'body',
    'footer',
    'resize-handle',
    'section',
    'section-title',
    'list',
    'item',
    'link',
    'icon',
    'monogram',
    'label',
    'count',
    'group',
    'group-trigger',
    'indicator',
    'group-panel',
]);
/** A JSON codec that refuses a stored value `isValid` rejects, so the default applies. */
function createCheckedCodec(isValid) {
    return {
        parse: (raw) => {
            const value = JSON.parse(raw);
            if (!isValid(value))
                throw new TypeError('Unexpected stored value');
            return value;
        },
        stringify: (value) => JSON.stringify(value),
    };
}
/** The stored collapsed state: a boolean. */
export const collapsedCodec = createCheckedCodec((value) => typeof value === 'boolean');
/** The stored width: a finite number of pixels. */
export const widthCodec = createCheckedCodec((value) => typeof value === 'number' && Number.isFinite(value));
export const NavigationRailContext = createContext({
    isCollapsed: false,
    expand: () => { },
});
export const CurrentItemContext = createContext(null);
/**
 * A value the caller may control that otherwise persists through the provider storage under
 * `persistKey`. Every change is reported through `onChange`.
 */
export function usePersistedValue({ value, defaultValue, onChange, persistKey, codec, }) {
    const [own, setOwn] = usePersistentState(value === undefined ? persistKey : undefined, defaultValue, codec);
    const setValue = useCallback((next) => {
        setOwn(next);
        onChange?.(next);
    }, [setOwn, onChange]);
    return [value ?? own, setValue];
}
/** Tells the enclosing group, while `isCurrent` holds, that it holds a current item. */
export function useReportCurrent(isCurrent) {
    const register = useContext(CurrentItemContext);
    useLayoutEffect(() => (isCurrent && register ? register() : undefined), [isCurrent, register]);
}
/** A registry for the current items below a group, and whether it holds any. */
export function useCurrentItems() {
    const [count, setCount] = useState(0);
    const register = useCallback(() => {
        setCount((value) => value + 1);
        return () => setCount((value) => value - 1);
    }, []);
    return [count > 0, register];
}
//# sourceMappingURL=navigation-rail-state.js.map