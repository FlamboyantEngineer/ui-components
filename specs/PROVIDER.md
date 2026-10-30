# Provider

`UiProvider` supplies the services components need from their host: glyphs, text, locale, link rendering and storage, and tells the host which interactive overlays are open. The library never reaches host services any other way. Every component works without a provider.

## UIC-PROVIDER-1 - Defaults

### UIC-PROVIDER-1.1 - Working without a provider

A component rendered with no `UiProvider` above it shall work with the defaults: Heroicons glyphs, English text, plain anchor links and in-memory storage.

Implementation: `src/core/provider.tsx`, `src/core/glyphs.tsx`, `src/core/strings.ts`, `src/core/storage.ts`
Verification: `src/core/provider.test.tsx`

### UIC-PROVIDER-1.2 - Nested providers

A provider inside another shall merge its glyphs and messages over its parent's and replace the parent's link renderer and storage only when it sets them.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-2 - Glyphs

### UIC-PROVIDER-2.1 - Built-in glyphs

The library shall draw its built-in glyphs (`chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`, `chevron-double-left`, `chevron-double-right`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `close`, `check`, `more`, `more-vertical`, `sort-ascending`, `sort-descending`, `sort-none`, `expand`, `collapse`, `search`, `info`, `warning`, `error`, `success`, `help`, `plus`, `minus`, `undo`, `redo`, `restore`, `refresh`, `edit`, `save`, `delete`, `calendar`, `drag-handle`, `upload`, `folder`, `users`, `fit-width`, `fit-page`, `eye-dropper`, `eye`, `eye-slash`, `scrub`, `copy`, `link`, `external-link`, `sidebar`, `filter`, `trend-up`, `trend-down`, `trend-flat`, `offline`, `lock`, `emoji`, `bell`, `clock`, `envelope`, `envelope-open`, `send`, `stop`, `download`, `rotate`, `file`, `image`, `video`, `audio`, `file-pdf`, `file-archive`, `file-text`, `star`, `adjustments`, `move`, `table`, `resize`, `formula`, `play`, `pause`, `paragraph`, `bold`, `italic`, `underline`, `strikethrough`, `code`, `code-block`, `list-bullet`, `list-numbered`, `list-task`, `quote`, `unlink`, `pending`, `skipped`, `hand-raised`, `no-symbol`, `x-circle`, `thumbs-up`, `thumbs-down`, `reply`, `bell-slash`, `attach`, `terminal`, `globe`, `wrench`, `sparkles`) from individually exported components such as `CloseGlyph`, backed by Heroicons 24px outline icons. Imports retain only the defaults that consumers use. `Glyph` accepts an imported `icon` component; `useGlyph(name, fallback)` resolves an override or the supplied fallback without importing a default catalog. A glyph is decorative: it renders with `aria-hidden="true"`, and its host component supplies the accessible name. Every glyph carries the `ui-glyph` class and `data-glyph` with its name, so a host can size and colour glyphs without knowing which component drew them.

Implementation: `src/core/glyphs.tsx`, `src/core/glyph-component.tsx`, `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

### UIC-PROVIDER-2.2 - Replacing a glyph

`UiProvider`'s `icons` prop shall replace glyphs by name with any component that accepts `className`, `aria-hidden` and `focusable`. Replacing one glyph changes only that glyph.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-3 - Text

### UIC-PROVIDER-3.1 - Language files

Every piece of text a component renders itself (button labels such as Close, live announcements, empty-state text, counted and listed text) shall come from a language file: a flat JSON object of ICU MessageFormat messages, one per text key, that defaults to English. Components read the compiled text through `useUiStrings()`. A message names its values (`{count}`, `{name}`), counts them with `plural`, picks words with `select`, and keeps apostrophes and angle brackets as written. A malformed message throws when it is formatted.

Implementation: `src/core/message-format.ts`, `src/core/strings.ts`, `src/core/locales/`, `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `src/core/message-format.test.ts`

### UIC-PROVIDER-3.2 - Replacing text

`UiProvider`'s `messages` prop shall replace messages by key, with any subset of a language file. Keys it leaves out keep the parent's message.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

### UIC-PROVIDER-3.3 - Switching language on the fly

Changing a provider's `messages` or `locale` shall rerender every component below it in the new language without remounting it, so a language menu can switch a running page. The provider compiles messages again only when its messages or locale change.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `e2e/languages.spec.ts`

### UIC-PROVIDER-3.4 - Locale rules

Messages shall format with the provider's locale, defaulting to `en-US`: plural categories follow the locale's rules (including languages without plural forms, such as Japanese), `#` and `{n, number}` group digits by locale, and a list value joins with the locale's own words and punctuation (`A, B, and C`, `A, B et C`, `A、B、C`). Line and column numbers and other identifiers pass as text, so they never group.

Implementation: `src/core/message-format.ts`
Verification: `src/core/message-format.test.ts`, `src/core/provider.test.tsx`, `e2e/languages.spec.ts`

### UIC-PROVIDER-3.5 - Shipped languages

The package shall ship English (`en`), French (`fr`), Spanish (`es`) and Japanese (`ja`) language files from `@flamboyantengineer/ui-components/locales`, and as JSON from `@flamboyantengineer/ui-components/locales/<language>.json` for hosts that load or edit them as data. Every shipped file has every English key, and each message uses only values its English message provides.

Implementation: `src/core/locales/`, `package.json`
Verification: `src/core/locales/index.test.ts`, `e2e/languages.spec.ts`

### UIC-PROVIDER-3.6 - Host messages

`formatMessage(message, values, locale)` and `useFormatMessage()` shall format a host's own ICU messages with the same rules, the hook with the provider's locale, so a host builds its sentences, counts and lists the way the library does. A list value `{ items, type: 'or' }` or `{ items, type: 'unit' }` joins its items with "or" or with commas only.

Implementation: `src/core/message-format.ts`, `src/core/provider.tsx`
Verification: `src/core/message-format.test.ts`, `src/core/provider.test.tsx`

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

Components that persist layout state (panel sizes, column widths, collapsed sections) shall read and write it only through the provider's `storage` adapter, under a key the caller supplies. Changing either the key or adapter reads that pair's stored value without remounting; state without a key survives an adapter change. Updates use the latest committed state, so a suspended render cannot change the value or destination of a visible control's write, and consecutive functional updates compose. The default adapter keeps values in memory for the page session. Library source never accesses browser storage directly.

Implementation: `src/core/storage.ts`, `src/core/provider.tsx`, `eslint.config.js`
Verification: `src/core/provider.test.tsx`, `src/core/provider-storage.test.tsx`, `e2e/provider.spec.ts`, `test/lint-rules.test.ts`

### UIC-PROVIDER-6.2 - Unreadable values

A stored value that cannot be parsed shall fall back to the component's initial value. `createSafeStorage` wraps a storage that may throw, so reads return nothing and writes are dropped instead of failing.

Implementation: `src/core/provider.tsx`, `src/core/storage.ts`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-7 - Overlay presence

### UIC-PROVIDER-7.1 - Interactive overlays

The library shall count each interactive overlay while it is open: a menu and each open submenu, the popups of select, combobox, completion, date and time (calendar and its month and year lists), relative date, color and emoji fields, and every popover, including an anchored modal. The count starts when the overlay opens and ends when it closes, before any exit animation. Tooltips, hover cards, a code editor's hover hint, a rich text editor's selection toolbar and toasts never count. `useOverlayPresence()` shall return an `OverlayPresence` for synchronous reads (`isActive()`, `getCount()`) and `subscribe(listener)`, and `useIsOverlayActive()` shall return whether one is open and re-render when that changes. Every library overlay counts through one presence mark rendered just before its popover, which follows the open state the popover follows, so nothing scans the page.

Implementation: `src/core/overlay-presence.tsx`, `src/components/popover/popover-presence.tsx`
Verification: `src/core/overlay-presence.test.tsx`, `e2e/provider.spec.ts`

### UIC-PROVIDER-7.2 - Exact registrations

An overlay shall be counted once however it opens (a trigger, `isOpen`, a submenu) and released exactly once however it closes: Escape, an action, an outside press, a controlled `isOpen` turning false, or unmount, including in Strict Mode. React Aria's hidden copy of a collection's content counts with the overlay it copies. Listeners are called after the count changes, once for changes made together, so overlays that replace one another in one update report no gap; nested overlays keep the presence active until the last one closes.

Implementation: `src/core/overlay-presence.tsx`, `src/components/popover/popover-presence.tsx`
Verification: `src/core/overlay-presence.test.tsx`

### UIC-PROVIDER-7.3 - Scope

The outermost `UiProvider` shall hold one overlay presence for every component below it, its portals and nested providers included; separate provider trees, such as separate React roots or documents, keep separate counts. Components outside any provider share one page-wide presence. A presence ends with its provider; overlays that unmount with it release their counts.

Implementation: `src/core/overlay-presence.tsx`, `src/core/provider.tsx`
Verification: `src/core/overlay-presence.test.tsx`

## Hooks

| Hook         | Kind      | Values | Description                                                                                       |
| ------------ | --------- | ------ | ------------------------------------------------------------------------------------------------- |
| `ui-glyph`   | root      |        | Every built-in glyph's `<svg>`, alongside the slot class of the component that draws it.          |
| `data-glyph` | attribute |        | The glyph name (`close`, `chevron-down`, …), also passed to replacement glyphs from the provider. |
