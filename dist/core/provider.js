import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useRef, useState, } from 'react';
import { I18nProvider, RouterProvider } from '../primitives/index.js';
import { defaultGlyphs } from './glyphs.js';
import { mergeClassNames } from './hooks.js';
import { createMemoryStorage } from './storage.js';
import { defaultStrings } from './strings.js';
import { omitUndefined } from '../utils/omit-undefined.js';
const renderAnchor = (props) => _jsx("a", { ...props });
const defaultContext = {
    glyphs: defaultGlyphs,
    strings: defaultStrings,
    renderLink: renderAnchor,
    storage: createMemoryStorage(),
};
const UiContext = createContext(defaultContext);
const jsonCodec = {
    parse: (raw) => JSON.parse(raw),
    stringify: (value) => JSON.stringify(value),
};
/**
 * Supplies glyphs, strings, locale, link rendering and storage to every component below it.
 * Components work without a provider, using Heroicons, English strings and in-memory storage.
 * Nested providers merge over their parent.
 */
export function UiProvider({ icons, strings, locale, renderLink, navigate, useHref, storage, children, }) {
    const parent = useContext(UiContext);
    const value = useMemo(() => ({
        glyphs: icons ? { ...parent.glyphs, ...omitUndefined(icons) } : parent.glyphs,
        strings: strings ? { ...parent.strings, ...omitUndefined(strings) } : parent.strings,
        renderLink: renderLink ?? parent.renderLink,
        storage: storage ?? parent.storage,
    }), [parent, icons, strings, renderLink, storage]);
    let content = _jsx(UiContext.Provider, { value: value, children: children });
    if (navigate) {
        content = (_jsx(RouterProvider, { navigate: navigate, ...(useHref ? { useHref } : {}), children: content }));
    }
    if (locale)
        content = _jsx(I18nProvider, { locale: locale, children: content });
    return content;
}
/** The glyph component for a built-in glyph name. */
export function useGlyph(name) {
    return useContext(UiContext).glyphs[name];
}
/** The built-in strings, with provider overrides applied. */
export function useUiStrings() {
    return useContext(UiContext).strings;
}
/** The storage adapter for persisted layout state. */
export function useUiStorage() {
    return useContext(UiContext).storage;
}
/** Renders a link through the provider's link renderer. */
export function UiLink(props) {
    return useContext(UiContext).renderLink(props);
}
/** Draws a built-in glyph as decoration (hidden from assistive technology). */
export function Glyph({ name, className }) {
    const Component = useGlyph(name);
    return (_jsx(Component, { className: mergeClassNames('ui-glyph', className), "data-glyph": name, "aria-hidden": "true", focusable: "false" }));
}
/**
 * State persisted through the provider storage adapter under `key`. Without a key it is plain state.
 * Unreadable stored values fall back to `initialValue`.
 */
export function usePersistentState(key, initialValue, codec = jsonCodec) {
    const storage = useUiStorage();
    // Called only on mount and when the key changes, so initialValue is read once per key.
    const read = () => {
        const fallback = () => typeof initialValue === 'function' ? initialValue() : initialValue;
        if (key === undefined)
            return fallback();
        const raw = storage.getItem(key);
        if (raw === null)
            return fallback();
        try {
            return codec.parse(raw);
        }
        catch {
            return fallback();
        }
    };
    const [state, setState] = useState(() => ({ key, value: read() }));
    let current = state;
    if (state.key !== key) {
        current = { key, value: read() };
        setState(current);
    }
    const latest = useRef(current.value);
    latest.current = current.value;
    const setValue = useCallback((action) => {
        const next = typeof action === 'function' ? action(latest.current) : action;
        latest.current = next;
        if (key !== undefined)
            storage.setItem(key, codec.stringify(next));
        setState({ key, value: next });
    }, [key, storage, codec]);
    return [current.value, setValue];
}
//# sourceMappingURL=provider.js.map