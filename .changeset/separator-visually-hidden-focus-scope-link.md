---
'@flamboyantengineer/ui-components': minor
---

Add foundation components and a navigation link.

- `Separator` (new, React Aria `Separator`): `orientation`, line `variant` (`solid`, `dashed`, `dotted`), a `label` drawn across the line with `labelPosition` (`start`, `center`, `end`) that also names the separator, and `decorative` (`role="none"`). Keeps React Aria's `render` and `elementType`. Hooks: `ui-separator`, `__start-line`, `__label`, `__end-line`, `data-orientation`, `data-variant`, `data-label-position`.
- `ToolbarRowSeparator` and `MenuSeparator` now render a `Separator`, so they also carry `ui-separator`, `data-orientation` and `data-variant`; their own hooks, roles and props are unchanged.
- `VisuallyHidden` (new, React Aria `VisuallyHidden`): `elementType` and `isFocusable`, which shows the content while it or a descendant has focus, for skip links. Hooks: `ui-visually-hidden`, `data-focus-within`.
- `FocusScope` (new, React Aria `FocusScope` from `react-aria`): `contain` (which may switch off and on while mounted), `restoreFocus`, `autoFocus`, `initialFocus` and `finalFocus` (the `Modal` vocabulary), around one element. Also exports `useFocusManager` with its `FocusManager` and `FocusManagerOptions` types. Hooks: `ui-focus-scope`, `data-contain`.
- `Link` (new, React Aria `Link`): navigates through the provider's `navigate`, `useHref` and link renderer; `variant` (`primary`, `secondary`), `isStandalone`, `underline` (`always`, `hover`, `none`) and `isExternal`. A link that opens a new tab adds `noopener noreferrer` to `rel`, an external glyph and visually hidden "(opens in a new tab)" text; without `href` it is a pressable link. Keeps React Aria's `render`. Hooks: `ui-link`, `__external-icon`, `__new-tab-label`, `data-variant`, `data-standalone`, `data-underline` and React Aria's link states.
- Provider: the `external-link` glyph and the `opensInNewTab` string.
