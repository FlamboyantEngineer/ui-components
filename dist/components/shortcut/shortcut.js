import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useSyncExternalStore } from 'react';
import { Keyboard, VisuallyHidden } from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { MetaLine } from '../meta-line/meta-line.js';
import { formatShortcutAccessibleText, formatShortcutSteps, getShortcutPlatform, getShortcutKeySeparator, } from './shortcut-format.js';
const hooks = createHooks('shortcut', ['keys', 'chord', 'key', 'text']);
const hintHooks = createHooks('key-hints', ['hint', 'action']);
const subscribeToNothing = () => () => { };
/** What detection reports without a browser, so the server and hydration render the same notation. */
const getServerPlatform = () => 'linux';
/** The detected platform: the server's notation while hydrating, the browser's once hydrated. */
export function useDetectedPlatform() {
    return useSyncExternalStore(subscribeToNothing, getShortcutPlatform, getServerPlatform);
}
/** One chord's keycaps with the platform separator between them. */
function Keycaps({ keys, separator }) {
    return keys.map((label, index) => (_jsxs(Fragment, { children: [index > 0 ? separator : null, _jsx("kbd", { ...hooks.slot('key'), children: label })] }, index)));
}
/**
 * A keyboard chord or key sequence in the reader's platform notation, with readable text for
 * assistive technology.
 */
export function Shortcut({ chord, platform, decorative, className, ...rest }) {
    const strings = useUiStrings();
    const detected = useDetectedPlatform();
    const resolved = platform ?? detected;
    const steps = formatShortcutSteps(chord, resolved);
    const [first] = steps;
    if (!first)
        return null;
    const separator = getShortcutKeySeparator(resolved);
    return (_jsxs(Keyboard, { ...rest, ...hooks.root({ className, data: { platform: resolved } }), children: [_jsx("span", { ...hooks.slot('keys'), "aria-hidden": "true", children: steps.length === 1 ? (_jsx(Keycaps, { keys: first, separator: separator })) : (steps.map((keys, index) => (_jsxs(Fragment, { children: [index > 0 ? ' ' : null, _jsx("span", { ...hooks.slot('chord'), children: _jsx(Keycaps, { keys: keys, separator: separator }) })] }, index)))) }), decorative ? null : (_jsx(VisuallyHidden, { elementType: "span", className: hooks.slotClass('text'), children: formatShortcutAccessibleText(chord, {
                    platform: resolved,
                    keyName: strings.shortcutKeyName,
                    sequence: strings.shortcutSequence,
                }) }))] }));
}
/** A key legend such as `↑↓ move · Enter select`, drawn on one metadata line. */
export function KeyHints({ hints, platform, className, ...rest }) {
    return (_jsx(MetaLine, { ...rest, className: mergeClassNames(hintHooks.className, className), items: hints.map((hint, index) => (_jsxs("span", { ...hintHooks.slot('hint'), children: [hint.keys.map((key, keyIndex) => (_jsx(Shortcut, { chord: key, platform: platform }, keyIndex))), ' ', _jsx("span", { ...hintHooks.slot('action'), children: hint.action })] }, index))) }));
}
export { formatAriaKeyShortcuts } from './shortcut-format.js';
//# sourceMappingURL=shortcut.js.map