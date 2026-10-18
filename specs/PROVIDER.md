# Provider

`UiProvider` supplies the services components need from their host: glyphs, strings, locale, link rendering and storage. The library never reaches host services any other way. Every component works without a provider.

## UIC-PROVIDER-1 - Defaults

### UIC-PROVIDER-1.1 - Working without a provider

A component rendered with no `UiProvider` above it shall work with the defaults: Heroicons glyphs, English strings, plain anchor links and in-memory storage.

Implementation: `src/core/provider.tsx`, `src/core/glyphs.tsx`, `src/core/strings.ts`, `src/core/storage.ts`
Verification: `src/core/provider.test.tsx`

### UIC-PROVIDER-1.2 - Nested providers

A provider inside another shall merge its glyphs and strings over its parent's and replace the parent's link renderer and storage only when it sets them.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-2 - Glyphs

### UIC-PROVIDER-2.1 - Built-in glyphs

The library shall draw its built-in glyphs (`chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`, `chevron-double-left`, `chevron-double-right`, `arrow-up`, `arrow-down`, `close`, `check`, `more`, `more-vertical`, `sort-ascending`, `sort-descending`, `sort-none`, `expand`, `collapse`, `search`, `info`, `warning`, `error`, `success`, `help`, `plus`, `minus`, `undo`, `redo`, `restore`, `refresh`, `edit`, `save`, `delete`, `calendar`, `drag-handle`, `upload`, `folder`, `users`, `fit-width`, `fit-page`, `eye-dropper`, `eye`, `eye-slash`, `scrub`, `copy`, `link`, `external-link`, `sidebar`, `filter`, `trend-up`, `trend-down`, `trend-flat`, `offline`, `lock`) from a glyph map whose defaults are Heroicons 24px outline icons. A glyph is decorative: it renders with `aria-hidden="true"`, and its host component supplies the accessible name. Every glyph carries the `ui-glyph` class and `data-glyph` with its name, so a host can size and colour glyphs without knowing which component drew them.

Implementation: `src/core/glyphs.tsx`, `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

### UIC-PROVIDER-2.2 - Replacing a glyph

`UiProvider`'s `icons` prop shall replace glyphs by name with any component that accepts `className`, `aria-hidden` and `focusable`. Replacing one glyph changes only that glyph.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-3 - Strings

### UIC-PROVIDER-3.1 - Built-in strings

Components shall take the text they render themselves (button labels such as Close, live announcements, empty-state text) from the provider's strings, which default to English. `UiProvider`'s `strings` prop replaces entries by key. Counted text is a function of the count.

Implementation: `src/core/strings.ts`, `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-4 - Locale

### UIC-PROVIDER-4.1 - React Aria locale

`UiProvider`'s `locale` prop shall set the locale React Aria uses for formatting, collation and text direction below it. Without it, React Aria uses the outer locale or the browser's.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-5 - Links

### UIC-PROVIDER-5.1 - Link renderer

Components that draw links (breadcrumbs, list rows, tree items) shall render them through the provider's `renderLink`, a render prop that receives the anchor props including `href`, so a host can route them through its router. The default renders a plain anchor.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

### UIC-PROVIDER-5.2 - Client-side navigation for React Aria links

When the host passes `navigate` (and optionally `useHref`), React Aria links, menu items and tabs with an `href` shall navigate through it instead of a full page load.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-6 - Storage

### UIC-PROVIDER-6.1 - Storage adapter

Components that persist layout state (panel sizes, column widths, collapsed sections) shall read and write it only through the provider's `storage` adapter, under a key the caller supplies. The default adapter keeps values in memory for the page session. Library source never accesses browser storage directly.

Implementation: `src/core/storage.ts`, `src/core/provider.tsx`, `eslint.config.js`
Verification: `src/core/provider.test.tsx`, `test/lint-rules.test.ts`

### UIC-PROVIDER-6.2 - Unreadable values

A stored value that cannot be parsed shall fall back to the component's initial value. `createSafeStorage` wraps a storage that may throw, so reads return nothing and writes are dropped instead of failing.

Implementation: `src/core/provider.tsx`, `src/core/storage.ts`
Verification: `src/core/provider.test.tsx`

## Hooks

| Hook         | Kind      | Values | Description                                                                                       |
| ------------ | --------- | ------ | ------------------------------------------------------------------------------------------------- |
| `ui-glyph`   | root      |        | Every built-in glyph's `<svg>`, alongside the slot class of the component that draws it.          |
| `data-glyph` | attribute |        | The glyph name (`close`, `chevron-down`, …), also passed to replacement glyphs from the provider. |
