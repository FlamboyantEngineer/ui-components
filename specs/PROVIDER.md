# Provider

`UiProvider` supplies the services components need from their host: glyphs, text, locale, link rendering, storage and the clock, and tells the host which interactive overlays are open. The library never reaches host services any other way. Every component works without a provider.

## UIC-PROVIDER-1 - Defaults

### UIC-PROVIDER-1.1 - Working without a provider

A component rendered with no `UiProvider` above it shall work with the defaults: the built-in glyphs, English text, plain anchor links and in-memory storage.

Implementation: `src/core/provider.tsx`, `src/core/glyphs.tsx`, `src/core/strings.ts`, `src/core/storage.ts`
Verification: `src/core/provider.test.tsx`

### UIC-PROVIDER-1.2 - Nested providers

A provider inside another shall merge its glyphs and messages over its parent's and replace the parent's link renderer and storage only when it sets them.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `e2e/provider.spec.ts`

## UIC-PROVIDER-2 - Glyphs

### UIC-PROVIDER-2.1 - Built-in glyphs

The library shall draw its built-in glyphs (`chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`, `chevron-double-left`, `chevron-double-right`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `close`, `check`, `more`, `more-vertical`, `sort-ascending`, `sort-descending`, `sort-none`, `expand`, `collapse`, `search`, `info`, `warning`, `error`, `success`, `help`, `plus`, `minus`, `undo`, `redo`, `restore`, `refresh`, `edit`, `save`, `delete`, `calendar`, `drag-handle`, `upload`, `folder`, `users`, `fit-width`, `fit-page`, `eye-dropper`, `eye`, `eye-slash`, `scrub`, `copy`, `link`, `external-link`, `sidebar`, `filter`, `trend-up`, `trend-down`, `trend-flat`, `offline`, `lock`, `emoji`, `bell`, `clock`, `envelope`, `envelope-open`, `send`, `stop`, `download`, `rotate`, `file`, `image`, `video`, `audio`, `file-pdf`, `file-archive`, `file-text`, `star`, `adjustments`, `move`, `table`, `resize`, `formula`, `play`, `pause`, `paragraph`, `bold`, `italic`, `underline`, `strikethrough`, `code`, `code-block`, `heading-1`, `heading-2`, `heading-3`, `list-bullet`, `list-numbered`, `list-task`, `quote`, `unlink`, `pending`, `skipped`, `hand-raised`, `no-symbol`, `x-circle`, `thumbs-up`, `thumbs-down`, `reply`, `bell-slash`, `attach`, `terminal`, `globe`, `wrench`, `sparkles`, `clipboard`) from individually exported components such as `CloseGlyph`, drawn from Heroicons 24px outline paths that the library carries itself (`src/core/glyph-paths.ts`, with the Heroicons MIT notice), so the package has no icon dependency. Two glyphs Heroicons lacks are drawn in the same outline style: `formula` as an italic f with a subscript x, and `resize` as one two-headed arrow from the top-left corner to the bottom-right. A lone dot (the point of the help glyph's question mark, the dot of the info, error and warning marks) is drawn as a small open circle that stays visible in a 10 or 12 pixel box at any pixel ratio, rather than Heroicons' 0.008 square, which renderers drop at small sizes. Imports retain only the defaults that consumers use. `Glyph` accepts an imported `icon` component; `useGlyph(name, fallback)` resolves an override or the supplied fallback without importing a default catalog. A glyph is decorative: it renders with `aria-hidden="true"`, and its host component supplies the accessible name. Every glyph carries the `ui-glyph` class and `data-glyph` with its name, so a host can size and colour glyphs without knowing which component drew them.

Implementation: `src/core/glyphs.tsx`, `src/core/glyph-paths.ts`, `src/core/glyph-component.tsx`, `src/core/glyph-types.ts`, `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `src/core/glyphs.test.ts`, `e2e/icon.spec.ts`

### UIC-PROVIDER-2.2 - Replacing a glyph

`UiProvider`'s `icons` prop shall replace glyphs by name with any component that accepts `className`, `aria-hidden` and `focusable`. Replacing one glyph changes only that glyph.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

## UIC-PROVIDER-3 - Text

### UIC-PROVIDER-3.1 - Language files

Every piece of text a component renders itself (button labels such as Close, live announcements, empty-state text, counted and listed text) shall come from a language file: a flat JSON object of ICU MessageFormat messages, one per text key, that defaults to English. Components read the compiled text through `useUiStrings()`. A message names its values (`{count}`, `{name}`), counts them with `plural`, picks words with `select`, and keeps apostrophes and angle brackets as written. A malformed message throws when it is formatted. The built-in English text compiles on first use, when a component reads it outside every provider, so importing the library does no string work. The text keys are declared in one module per area under `src/core/strings/`, each with the message values its text functions read (`defineStrings`); `UiStrings` and the compiled text gather every module the directory's index lists, so a new module is one line there and the keys do not change with the grouping.

Implementation: `src/core/message-format.ts`, `src/core/strings.ts`, `src/core/strings/`, `src/core/locales/`, `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `src/core/message-format.test.ts`, `src/core/strings.test.ts`

### UIC-PROVIDER-3.2 - Replacing text

`UiProvider`'s `messages` prop shall replace messages by key, with any subset of a language file. Keys it leaves out keep the parent's message.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`

### UIC-PROVIDER-3.3 - Switching language on the fly

Changing a provider's `messages` or `locale` shall rerender every component below it in the new language without remounting it, so a language menu can switch a running page. The provider compiles messages again only when its messages or locale change: `messages` and `icons` are compared by their entries, so objects written inline that hold the same entries neither recompile the text nor re-render the components below. Giving or removing any option, `locale` and `navigate` included, also keeps every component below mounted with its state and focus, in nested providers too: the provider always renders the same wrappers, and a wrapper whose option is absent passes on the outer one.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `src/core/provider-options.test.tsx`, `e2e/languages.spec.ts`, `e2e/provider.spec.ts`

### UIC-PROVIDER-3.4 - Locale rules

Messages shall format with the provider's locale, which is the locale React Aria uses below it (UIC-PROVIDER-4.1); outside every provider they format in `en-US`, the built-in English text's locale: plural categories follow the locale's rules (including languages without plural forms, such as Japanese), `#` and `{n, number}` group digits by locale, and a list value joins with the locale's own words and punctuation (`A, B, and C`, `A, B et C`, `A、B、C`). Line and column numbers and other identifiers pass as text, so they never group.

Implementation: `src/core/message-format.ts`
Verification: `src/core/message-format.test.ts`, `src/core/provider.test.tsx`, `e2e/languages.spec.ts`

### UIC-PROVIDER-3.5 - Shipped languages

The package shall ship English (`en`), French (`fr`), Spanish (`es`) and Japanese (`ja`) language files from `@flamboyantengineer/ui-components/locales`, and as JSON from `@flamboyantengineer/ui-components/locales/<language>.json` for hosts that load or edit them as data. Every shipped file has every English key, and each message uses only values its English message provides. The JSON files are the source translators edit; `npm run generate:locales` writes each as a module the library imports, so the built package contains no JSON import attributes, and the build copies the JSON files beside the modules. A test fails while a module and its JSON file disagree, and `npm run check:package` rejects an import attribute in the built JavaScript.

Implementation: `src/core/locales/`, `scripts/generate-locales.mjs`, `scripts/copy-locales.mjs`, `scripts/check-package.mjs`, `package.json`
Verification: `src/core/locales/index.test.ts`, `e2e/languages.spec.ts`

### UIC-PROVIDER-3.6 - Host messages

`formatMessage(message, values, locale)` and `useFormatMessage()` shall format a host's own ICU messages with the same rules, the hook with the provider's locale, so a host builds its sentences, counts and lists the way the library does. A list value `{ items, type: 'or' }` or `{ items, type: 'unit' }` joins its items with "or" or with commas only. An argument passed as `undefined` or `null` reads as empty text, picks a `select`'s `other` branch and counts as zero in a plural or number; an argument the message names but `values` leaves out throws, as a malformed message does, so a misspelt argument or a stale translation never prints a silent gap.

Implementation: `src/core/message-format.ts`, `src/core/provider.tsx`
Verification: `src/core/message-format.test.ts`, `src/core/provider.test.tsx`

## UIC-PROVIDER-4 - Locale

### UIC-PROVIDER-4.1 - React Aria locale

`UiProvider`'s `locale` prop shall set the locale React Aria uses for formatting, collation and text direction below it. Without it, the provider takes the outer locale: a parent provider's, a host's `I18nProvider`'s, or else the browser's. That one locale serves both React Aria and the provider's text (UIC-PROVIDER-3.4) and `useFormatMessage`, so a provider given `messages` alone formats its sentences as its components format dates and numbers.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `src/core/provider-options.test.tsx`, `e2e/languages.spec.ts`

## UIC-PROVIDER-5 - Links

### UIC-PROVIDER-5.1 - Link renderer

Components that draw links (breadcrumbs, list rows, tree items) shall render them through the provider's `renderLink`, a render prop that receives the anchor props including `href`, so a host can route them through its router. The default renders a plain anchor.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `e2e/provider.spec.ts`

### UIC-PROVIDER-5.2 - Client-side navigation for React Aria links

When the host passes `navigate` (and optionally `useHref`), React Aria links, menu items and tabs with an `href` shall navigate through it instead of a full page load. Each is merged field by field over the outer provider's: a nested provider without `navigate` uses the outer provider's, and one without `useHref` keeps the outer one's; with none, links load their page as native links do, and a link with a target, a download or a modifier key always opens natively.

Implementation: `src/core/provider.tsx`
Verification: `src/core/provider.test.tsx`, `src/core/provider-options.test.tsx`, `e2e/provider.spec.ts`

## UIC-PROVIDER-6 - Storage

### UIC-PROVIDER-6.1 - Storage adapter

Components that persist layout state (panel sizes, column widths, collapsed sections) shall read and write it only through the provider's `storage` adapter, under a key the caller supplies. Changing either the key or adapter reads that pair's stored value without remounting; state without a key survives an adapter change. Neither the server render nor hydration reads the adapter: both show the initial value, so they agree whatever each side's storage holds, and the render after hydration reads the stored value as an adapter change would, without writing the initial value over it; a render on the client alone reads the store from its first render. Updates use the latest committed state, so a suspended render cannot change the value or destination of a visible control's write, and consecutive functional updates compose. The default adapter keeps values in memory for the page session. Library source never accesses browser storage directly.

Implementation: `src/core/storage.ts`, `src/core/provider.tsx`, `src/utils/use-is-client.ts`, `eslint.config.js`
Verification: `src/core/provider.test.tsx`, `src/core/provider-storage.test.tsx`, `src/components/tabs/tabs.test.tsx`, `e2e/provider.spec.ts`, `test/lint-rules.test.ts`

### UIC-PROVIDER-6.2 - Unreadable values

A stored value that cannot be parsed, or that parses to data of the wrong shape, shall fall back to the component's initial value: `usePersistentState` requires a codec, `PersistCodec<T>` (`{ parse(raw): T, stringify(value): string }`, whose `parse` throws on data of another shape), and the package exports from `/core` the ones the library uses: `createJsonCodec(read, write?)`, `createListCodec(isEntry)`, `booleanCodec`, `numberCodec`, `keyCodec` and `keyListCodec`. Every component that persists state reads it through a codec that checks the shape it expects, and refuses a list as a whole when one of its entries is not valid, so old, stale or corrupted data never fails a render. `createSafeStorage` wraps a storage that may throw, so reads return nothing and writes are dropped instead of failing.

Implementation: `src/core/provider.tsx`, `src/core/storage.ts`, `src/utils/json-codec.ts`
Verification: `src/core/provider.test.tsx`, `src/utils/json-codec.test.ts`, `e2e/provider.spec.ts`

### UIC-PROVIDER-6.3 - Delayed writes

`usePersistentState(key, initialValue, { codec, writeDelay })` shall return the value, its setter and `flush`. The value changes at once. With `writeDelay`, the adapter write waits that many milliseconds after the last change and writes only the last value, encoded only then, so a burst of changes such as typing writes once; `flush` writes a waiting change now. A waiting change shall be written under the key and adapter it was made for when the key or adapter changes, when the component unmounts and when the page hides (`pagehide`). The value the state then shows shall agree with what that write left: a new adapter over the same backing store (an adapter wrapped anew on each render, such as an inline `createSafeStorage`) is read again once the waiting change is written, before paint, so the state keeps the newer value rather than rolling back, while a different store, or a new key, shows its own value. Storage is never written during render. Without `writeDelay` every change is written at once.

Implementation: `src/core/provider.tsx`, `labs/src/provider-storage-cases.tsx`
Verification: `src/core/provider-delayed-write.test.tsx`, `src/components/message-composer/use-composer-state.test.tsx`, `e2e/provider.spec.ts`

### UIC-PROVIDER-6.4 - Controlled or persisted values

`usePersistedValue({ value, defaultValue, onChange, persistKey, codec })` shall be the one way a component persists a value its caller may also control. While `value` is defined it is the value, storage is neither read nor written, and setting the value only reports it through `onChange`. While `value` is undefined the component holds the value, starting from what is stored under `persistKey` through the codec, else from `defaultValue`, and setting it stores it and reports it. Without `persistKey` the held value is plain state. Navigation Rail, Tabs, Dock Panel and Split View persist through it, and their codecs are built with `createJsonCodec`, whose optional `write` turns a value into the data stored.

Implementation: `src/utils/use-persisted-value.ts`, `src/utils/json-codec.ts`
Verification: `src/utils/use-persisted-value.test.tsx`, `src/utils/json-codec.test.ts`

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

## UIC-PROVIDER-8 - Clock

### UIC-PROVIDER-8.1 - One clock and time zone

`UiProvider`'s `getNow` and `timeZone` props shall be the clock and the IANA time zone that every component reading now or today uses when it is not given its own: `RelativeTime`, `Attribution`, `RelativeDateField`, `ActivityFeed`, `NotificationList`, `CalendarView`, `Timeline` and `LineChart`. A nested provider without them uses its parent's. Without a provider the clock is the current time and the zone the browser's. `useNow(getNow?)`, `useToday(timeZone?, getNow?)` and `useTimeZone(timeZone?)` read the same sources for host components.

Implementation: `src/core/clock.ts`, `src/core/provider.tsx`
Verification: `src/core/clock.test.tsx`

### UIC-PROVIDER-8.2 - Hydration-stable reads

A server render and the hydration of its markup shall never read the clock or the device's time zone, so their output matches wherever and whenever each runs: `useNow` and `useToday` return `null` and `useTimeZone` returns the given or provided zone, else UTC. The first client render after hydration reads them, and a render on the client alone reads them from the start. Components show what does not depend on now until then: absolute dates instead of relative words, date headings instead of `Today`, no today marker, and an empty, busy calendar or timeline when nothing else places it.

Implementation: `src/core/clock.ts`
Verification: `src/core/clock.test.tsx`, `src/core/clock-hydration.test.tsx`

## Hooks

| Hook         | Kind      | Values | Description                                                                                       |
| ------------ | --------- | ------ | ------------------------------------------------------------------------------------------------- |
| `ui-glyph`   | root      |        | Every built-in glyph's `<svg>`, alongside the slot class of the component that draws it.          |
| `data-glyph` | attribute |        | The glyph name (`close`, `chevron-down`, …), also passed to replacement glyphs from the provider. |
