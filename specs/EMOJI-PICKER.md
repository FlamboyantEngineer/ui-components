# Emoji Picker

`EmojiPicker` chooses a standard or custom emoji: a search field, category tabs, a two-dimensional grid of emoji, the recently used emoji and a skin tone choice. It bundles the standard emoji (generated from Emojibase, with their names in 28 languages), leaves out what the platform cannot draw, and takes everything host-specific as data: recent emoji in and out, custom emoji as image URLs with shortcodes, the skin tone as a controlled value, and which categories and emoji to offer. Its parts can be laid out by the caller. `EmojiPickerTrigger` opens it in a popover from a button. A list of commands belongs in a menu, and a field's own values in that field's picker.

## UIC-EMOJI-PICKER-1 - Browsing and choosing

### UIC-EMOJI-PICKER-1.1 - Loading

`EmojiPicker` shall load the standard emoji through `loadEmoji`, by default the bundled set in the language of the `UiProvider` locale ([UIC-EMOJI-PICKER-4.4](#uic-emoji-picker-44---bundled-locales)), which loads as a separate chunk once for every picker. While it is the default, a change of locale loads that locale's set. While loading, the root shall carry `data-loading` and the body shall read the provider's `loading` string in a `role="status"` message; a failed load shall read the `emojiLoadFailed` string.

Implementation: `src/components/emoji-picker/emoji-picker.tsx`, `src/components/emoji-picker/emoji-picker-body.tsx`, `src/components/emoji-picker/emoji-picker-state.ts`, `src/components/emoji-picker/emoji-locale.ts`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-1.2 - Categories

Without a search, the picker shall show a `Tabs` element in the `ui-emoji-picker__categories` slot ([TABS.md](TABS.md)) whose tab list is named by the `emojiCategories` string: a tab for the recently used emoji when there are any, one for custom emoji when there are any, then one per standard category in order (smileys, people, nature, food, travel, activities, objects, symbols, flags). Each tab shows a representative emoji as its icon and the `emojiCategory` name as its label; the selected tab's panel shows that category's grid. The first tab is selected at first.

Implementation: `src/components/emoji-picker/emoji-picker-body.tsx`, `src/components/emoji-picker/emoji-picker-state.ts`, `src/core/strings.ts`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-1.3 - Grid

Each list of emoji shall be a React Aria grid list in the `ui-emoji-picker__grid` slot with a grid layout, inside a `ui-emoji-picker__section` and named by its visible `ui-emoji-picker__label`. Each emoji is a `ui-emoji-picker__cell` named by its label (`:shortcode:` for a custom emoji without one) and showing the glyph in the current skin tone, `renderEmoji`'s drawing of it, or a custom emoji's image in `ui-emoji-picker__image` with empty alternative text. The grid is one tab stop; arrow keys move in two dimensions by the cells' positions, Home and End move to the first and last emoji, typing a label's first letters moves to it, and a click or Enter chooses. Grid keys never reach the surface that owns the picker, even at the grid's edges.

Implementation: `src/components/emoji-picker/emoji-grid.tsx`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-1.4 - Choosing

Choosing an emoji shall call `onSelect` once with the selection: for a standard emoji its record, the glyph and hexcode in the current skin tone and the tone actually applied (`default` for an emoji that takes none); for a custom emoji its record. It shall then call `onRecentEmojiChange` with `recentEmoji` updated: the chosen emoji's key first, at most 24 long, with one key per emoji (a repeated key, or a key naming the same emoji in another skin tone, is dropped). Inside a dialog trigger, choosing closes the overlay.

Implementation: `src/components/emoji-picker/emoji-picker.tsx`, `src/components/emoji-picker/emoji-picker-state.ts`, `src/components/emoji-picker/emoji-catalog.ts`
Verification: `src/components/emoji-picker/emoji-catalog.test.ts`, `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-1.5 - Preview

The footer's `ui-emoji-picker__preview` shall show the emoji last hovered or focused, its glyph in `ui-emoji-picker__preview-emoji` and its label in `ui-emoji-picker__preview-label`. The preview is decorative; the focused cell already announces its name. Hovering or focusing an emoji shall redraw the preview and the parts that read `useActiveEmoji`, not the grid.

Implementation: `src/components/emoji-picker/emoji-picker.tsx`, `src/components/emoji-picker/emoji-grid.tsx`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`

### UIC-EMOJI-PICKER-1.6 - Virtualized grids

With `virtualized`, each grid shall render through React Aria's `Virtualizer` with a grid layout of square cells, at most eight a row ([UIC-COLLECTIONS-1.1](COLLECTIONS.md#uic-collections-11---virtualized-rendering)), and publish `data-virtualized` on the grid and its section: only the cells in view of the grid, which then scrolls itself, are in the document, positioned by the layout, while the arrow keys, Home and End reach every emoji and each cell keeps its hooks and name. Without it every cell renders, and the section scrolls.

Implementation: `src/components/emoji-picker/emoji-grid.tsx`, `labs/reference/emoji-picker.css`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

## UIC-EMOJI-PICKER-2 - Search, recent and custom emoji, skin tone

### UIC-EMOJI-PICKER-2.1 - Search

The picker shall have a React Aria search field in the `ui-emoji-picker__search` slot, named and hinted by the `searchEmoji` string, with its input in `ui-emoji-picker__search-input` and its clear button in `ui-emoji-picker__search-clear`. A non-blank query shall replace the tabs with one grid labelled `emojiCategory('search')`, holding the best 60 standard and custom matches by shortcode, label and keyword (surrounding colons ignored), or the `noResults` string in `ui-emoji-picker__message` when nothing matches. `onSearchChange` reports each change. From the field, Down moves to the first emoji, Enter chooses the first emoji shown, and Escape clears the field and, when it is already empty, closes an overlay around the picker.

Implementation: `src/components/emoji-picker/emoji-picker.tsx`, `src/components/emoji-picker/emoji-picker-body.tsx`, `src/components/emoji-picker/emoji-picker-state.ts`, `src/components/emoji-picker/emoji-catalog.ts`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-2.2 - Recently used emoji

`recentEmoji` shall list keys, most recent first: a standard emoji's glyph, in any skin tone, or `:shortcode:` for a custom emoji. Keys that match no emoji are skipped, and so are keys naming an emoji already listed (a repeat, or the same emoji in another skin tone), so each emoji counts once; the rest fill the recently used tab in order.

Implementation: `src/components/emoji-picker/emoji-picker-state.ts`, `src/components/emoji-picker/emoji-catalog.ts`
Verification: `src/components/emoji-picker/emoji-catalog.test.ts`, `src/components/emoji-picker/emoji-picker.test.tsx`

### UIC-EMOJI-PICKER-2.3 - Custom emoji

`customEmoji` shall add image emoji, each with a `shortcode`, an image `src` and an optional `label` and `keywords`, under their own tab and to search results. A custom emoji without a label is named `:shortcode:`.

Implementation: `src/components/emoji-picker/emoji-picker-state.ts`, `src/components/emoji-picker/emoji-catalog.ts`
Verification: `src/components/emoji-picker/emoji-catalog.test.ts`, `src/components/emoji-picker/emoji-picker.test.tsx`

### UIC-EMOJI-PICKER-2.4 - Skin tone

The footer shall hold a React Aria radio group in the `ui-emoji-picker__skin-tones` slot, named by the `skinTone` string, with one `ui-emoji-picker__skin-tone` radio per tone (`default`, `light`, `medium-light`, `medium`, `medium-dark`, `dark`) named by `skinToneName` and showing a raised hand in that tone. The tone is controlled by `skinTone` with `onSkinToneChange`, or uncontrolled from `defaultSkinTone` (`default` when omitted), and applies to the grid, the preview and the selection. `hideSkinTones` hides the radio group for a host that sets the tone elsewhere.

Implementation: `src/components/emoji-picker/skin-tone-picker.tsx`, `src/components/emoji-picker/emoji-picker-state.ts`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

## UIC-EMOJI-PICKER-3 - Overlay and hooks

### UIC-EMOJI-PICKER-3.1 - Popover

`EmojiPickerTrigger` shall make the button it wraps open an `EmojiPicker` in a popover in the `ui-emoji-picker__popover` slot, with focus in the search field. The popover sits on the `dropdown` overlay layer ([UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)): it publishes `data-layer="dropdown"` and takes the z-index of `useLayerZIndex('dropdown')`. Choosing an emoji or pressing Escape shall close it and return focus to the button; a press outside shall close it. Its other props reach the picker.

Implementation: `src/components/emoji-picker/emoji-picker.tsx`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-3.2 - Accessibility

The picker shall be a `role="dialog"` named by `aria-label` (or `aria-labelledby`) or, by default, the `emojiPicker` string, and described by `aria-describedby`; it takes the labelling props and its own, and no other dialog props. `autoFocus` focuses the search field when the picker mounts.

Implementation: `src/components/emoji-picker/emoji-picker.tsx`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-3.3 - Hooks and caller attributes

`EmojiPicker` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/emoji-picker/emoji-picker.tsx`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`

## UIC-EMOJI-PICKER-4 - Emoji data

### UIC-EMOJI-PICKER-4.1 - Bundled set

The bundled set shall hold every standard emoji of the Emojibase English dataset in the nine categories, without skin tone components and lone regional indicators, each with its glyph, hexcode, label, shortcodes, keywords, the Emoji version that introduced it (`version`) and, for an emoji that takes a skin tone, its five toned glyphs. `scripts/generate-emoji-data.mjs` regenerates it in a compact text form that `loadEmojiData` parses.

Implementation: `src/components/emoji-picker/emoji-catalog.ts`, `src/components/emoji-picker/emoji-data.ts`, `scripts/generate-emoji-data.mjs`
Verification: `src/components/emoji-picker/emoji-catalog.test.ts`, `src/components/emoji-picker/emoji-filter.test.ts`

### UIC-EMOJI-PICKER-4.2 - Search ranking

`searchEmoji` shall rank entries by their best match, highest first: shortcode exact, shortcode prefix, label exact, label prefix, shortcode substring, label substring, keyword exact, keyword prefix, keyword substring; ties sort by label. Matching ignores case and surrounding colons; a blank query matches nothing.

Implementation: `src/components/emoji-picker/emoji-catalog.ts`
Verification: `src/components/emoji-picker/emoji-catalog.test.ts`

### UIC-EMOJI-PICKER-4.3 - Skin tones

A skin tone shall apply only to an emoji that takes one; any other emoji keeps its glyph and reports the `default` tone. `skinTones` lists the tones in order.

Implementation: `src/components/emoji-picker/emoji-catalog.ts`
Verification: `src/components/emoji-picker/emoji-catalog.test.ts`

### UIC-EMOJI-PICKER-4.4 - Bundled locales

`loadEmojiData(locale)` shall load the bundled standard emoji with their labels and keywords in the bundled Emojibase locale that a BCP 47 tag resolves to: the language with its region (`es-MX`, `en-GB`), with its script (`zh-Hant`, which `zh-TW` and `zh-HK` maximize to), or alone (`fr` for `fr-CA`), and English for any other tag. The bundled locales are `bn`, `da`, `de`, `en`, `en-gb`, `es`, `es-mx`, `et`, `fi`, `fr`, `hi`, `hu`, `it`, `ja`, `ko`, `lt`, `ms`, `nb`, `nl`, `pl`, `pt`, `ru`, `sv`, `th`, `uk`, `vi`, `zh` and `zh-hant`. Each loads once, as its own chunk beside the English set, so only the locales a page uses are fetched; a chunk that fails to load is fetched again next time. A label or keyword list a locale lacks stays English, and shortcodes stay the English Emojibase ones. They come from the same generation as the English set (`scripts/generate-emoji-data.mjs`), one compact line per emoji in the English order. The picker's strings (category names, messages) still come from the provider.

Implementation: `src/components/emoji-picker/emoji-locale.ts`, `src/components/emoji-picker/emoji-locales.ts`, `src/components/emoji-picker/emoji-picker-state.ts`, `scripts/generate-emoji-data.mjs`
Verification: `src/components/emoji-picker/emoji-locale.test.ts`, `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

## UIC-EMOJI-PICKER-5 - Offered emoji

### UIC-EMOJI-PICKER-5.1 - Platform support

Unless `renderEmoji` draws the glyphs, the picker shall leave out the standard emoji the platform cannot draw as text: before the first paint it draws one probe emoji per Emoji version, newest first, on an `OffscreenCanvas` in the picker's computed font, and takes the newest one that draws as a single colour glyph (unchanged by the fill colour, and no wider than one emoji) as the newest version the platform draws; it also leaves out the country flags (pairs of regional indicators) when a flag draws as letters. The result is kept per font family. When the platform has no canvas or draws no colour emoji at all, nothing is left out. Custom emoji are never left out.

Implementation: `src/components/emoji-picker/emoji-support.ts`, `src/components/emoji-picker/emoji-filter.ts`, `src/components/emoji-picker/emoji-picker-state.ts`
Verification: `src/components/emoji-picker/emoji-support.test.tsx`, `src/components/emoji-picker/emoji-filter.test.ts`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-5.2 - Emoji version

`emojiVersion` shall leave out the standard emoji newer than that Emoji version (`14`), in place of the version the platform draws, for a host that knows its emoji font. Emoji without a version always stay.

Implementation: `src/components/emoji-picker/emoji-filter.ts`, `src/components/emoji-picker/emoji-picker-state.ts`
Verification: `src/components/emoji-picker/emoji-filter.test.ts`, `src/components/emoji-picker/emoji-support.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-5.3 - Categories

`categories` shall choose the standard categories the picker offers, in the order given, for their tabs and for search; the recently used and custom tabs keep their place first. Without it every category is offered in browsing order.

Implementation: `src/components/emoji-picker/emoji-filter.ts`, `src/components/emoji-picker/emoji-picker-state.ts`
Verification: `src/components/emoji-picker/emoji-filter.test.ts`, `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-5.4 - Exclusions

`filterEmoji` shall keep the standard emoji for which it returns `true`: the others are offered nowhere, neither in their category, the search results nor the recently used emoji.

Implementation: `src/components/emoji-picker/emoji-filter.ts`, `src/components/emoji-picker/emoji-picker-state.ts`
Verification: `src/components/emoji-picker/emoji-filter.test.ts`, `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

## UIC-EMOJI-PICKER-6 - Parts

### UIC-EMOJI-PICKER-6.1 - Composed layout

With `children`, the picker shall render them inside its dialog instead of its default layout, so the caller can arrange, wrap or leave out its parts, which read the enclosing picker's state: `EmojiPickerSearch` (the search field), `EmojiPickerBody` (the loading, failure or no-results message, the category tabs or the search results), `EmojiPickerPreview` (the preview of the active emoji) and `EmojiPickerSkinTones` (the skin tone radio group). Each part keeps its hooks and behaviour, and takes the caller's `className`, `id` and `data-*` attributes on its root (for the body, the element it shows). The default layout is the search field, the body and a `ui-emoji-picker__footer` holding the preview and, unless `hideSkinTones`, the skin tones. A part rendered outside a picker throws.

Implementation: `src/components/emoji-picker/emoji-picker.tsx`, `src/components/emoji-picker/emoji-picker-parts.tsx`, `src/components/emoji-picker/emoji-picker-body.tsx`, `src/components/emoji-picker/skin-tone-picker.tsx`, `src/components/emoji-picker/emoji-picker-context.ts`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

### UIC-EMOJI-PICKER-6.2 - Active emoji

`useActiveEmoji()`, called in a component inside a picker, shall return the emoji last hovered or focused as the selection choosing it would report, in the current skin tone, or `null` before any, for a caller's own preview.

Implementation: `src/components/emoji-picker/emoji-picker-context.ts`
Verification: `src/components/emoji-picker/emoji-picker.test.tsx`, `e2e/emoji-picker.spec.ts`

## Hooks

| Hook                             | Kind      | Values                           | Description                                                           |
| -------------------------------- | --------- | -------------------------------- | --------------------------------------------------------------------- |
| `ui-emoji-picker`                | root      |                                  | The picker (`role="dialog"`).                                         |
| `ui-emoji-picker__popover`       | slot      |                                  | The popover holding a picker opened by `EmojiPickerTrigger`.          |
| `ui-emoji-picker__search`        | slot      |                                  | The search field.                                                     |
| `ui-emoji-picker__search-input`  | slot      |                                  | The search input.                                                     |
| `ui-emoji-picker__search-clear`  | slot      |                                  | The clear button.                                                     |
| `ui-emoji-picker__categories`    | slot      |                                  | The category tabs (also `ui-tabs`).                                   |
| `ui-emoji-picker__section`       | slot      |                                  | A labelled grid.                                                      |
| `ui-emoji-picker__label`         | slot      |                                  | The visible label of a grid.                                          |
| `ui-emoji-picker__grid`          | slot      |                                  | The grid of emoji (`role="grid"`).                                    |
| `ui-emoji-picker__cell`          | slot      |                                  | One emoji (`role="row"`).                                             |
| `ui-emoji-picker__image`         | slot      |                                  | A custom emoji's image.                                               |
| `ui-emoji-picker__message`       | slot      |                                  | The loading, failure or no-results message.                           |
| `ui-emoji-picker__footer`        | slot      |                                  | The footer holding the preview and the skin tones.                    |
| `ui-emoji-picker__preview`       | slot      |                                  | The decorative preview of the hovered or focused emoji.               |
| `ui-emoji-picker__preview-emoji` | slot      |                                  | The previewed glyph or image.                                         |
| `ui-emoji-picker__preview-label` | slot      |                                  | The previewed label.                                                  |
| `ui-emoji-picker__skin-tones`    | slot      |                                  | The skin tone radio group.                                            |
| `ui-emoji-picker__skin-tone`     | slot      |                                  | One skin tone radio (a `<label>`).                                    |
| `data-loading`                   | state     | `true`                           | The standard emoji are loading.                                       |
| `data-virtualized`               | state     | `true`                           | On a grid and its section: only the cells in view render.             |
| `data-empty`                     | state     | `true`                           | The search field is empty (React Aria).                               |
| `data-layout`                    | attribute | `grid`                           | The grid's layout (React Aria).                                       |
| `data-orientation`               | attribute | `vertical`, `horizontal`         | The grid's and the radio group's axis (React Aria).                   |
| `data-collection`                | attribute |                                  | React Aria's collection identifier; not for styling.                  |
| `data-key`                       | attribute |                                  | A cell's key: its glyph or `:shortcode:` (React Aria).                |
| `data-selected`                  | state     | `true`                           | The selected skin tone (React Aria).                                  |
| `data-hovered`                   | state     | `true`                           | Pointer over a cell, skin tone, input or button (React Aria).         |
| `data-pressed`                   | state     | `true`                           | A cell, skin tone or button is being pressed (React Aria).            |
| `data-focused`                   | state     | `true`                           | Focus on or within the element (React Aria).                          |
| `data-focus-visible`             | state     | `true`                           | Keyboard focus on or within the element (React Aria).                 |
| `data-focus-within`              | state     | `true`                           | Focus within the grid (React Aria).                                   |
| `data-focus-visible-within`      | state     | `true`                           | Keyboard focus within a cell (React Aria).                            |
| `data-layer`                     | attribute | `dropdown`                       | On the popover: its overlay layer; the z-index is set inline from it. |
| `data-placement`                 | state     | `top`, `bottom`, `left`, `right` | The popover's resolved side (React Aria).                             |
| `data-trigger`                   | state     | `DialogTrigger`                  | Which React Aria trigger opened the popover.                          |
| `data-entering`                  | state     | `true`                           | The popover is opening (React Aria).                                  |
| `data-exiting`                   | state     | `true`                           | The popover is closing (React Aria).                                  |
