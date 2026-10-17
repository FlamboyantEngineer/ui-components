# Shortcut

`Shortcut` shows a keyboard chord, or a sequence of chords, in the notation of the reader's platform: symbols without separators on macOS (`⇧⌘K`), key names joined by `+` elsewhere (`Ctrl+Shift+K`). Callers write one canonical chord; the formatting functions give the same text for tooltips and descriptions. `KeyHints` composes shortcuts into a key legend on one metadata line ([META-LINE.md](META-LINE.md)). A shortcut only reports a binding; it never registers or activates one.

## UIC-SHORTCUT-1 - Formatting

### UIC-SHORTCUT-1.1 - Canonical chords

A chord shall be either text such as `Ctrl+Shift+K` or an object `{ key, modifiers }`. In text, the modifier prefixes `Ctrl`, `Control`, `Alt`, `Shift`, `Meta` and `Cmd` are each followed by `+`, with optional spaces around it, and the rest is the key. `Ctrl` (modifier `primary`) shall mean Command on macOS and Control on Windows and Linux; `Control` (modifier `control`) shall always mean the physical Control key; `Cmd` and `Meta` mean the Meta (Command) key.

Implementation: `src/components/shortcut/shortcut-format.ts`
Verification: `src/components/shortcut/shortcut-format.test.ts`

### UIC-SHORTCUT-1.2 - Platform notation

`formatShortcut(chord, platform)` shall draw modifiers in the order Control, Alt (Option), Shift, Meta (Command), each once however often or in whatever order the chord names them. On `mac` they are `⌃⌥⇧⌘` with no separator; on `windows` and `linux` they are `Ctrl`, `Alt`, `Shift` and `Meta`, joined to the key by `+`. Punctuation keys (including `+`), arrow symbols and named keys such as `Enter` and `Escape` are drawn as written. A chord with an empty key formats as empty text. `formatShortcutKeys` returns the same keycaps as a list.

Implementation: `src/components/shortcut/shortcut-format.ts`
Verification: `src/components/shortcut/shortcut-format.test.ts`, `e2e/shortcut.spec.ts`

### UIC-SHORTCUT-1.3 - Readable text

`formatShortcutAccessibleText(chord, { platform, keyName })` shall return the chord as words separated by spaces, modifiers in the same order: `Control`, `Option`, `Shift`, `Command` on `mac` and `Control`, `Alt`, `Shift`, `Meta` elsewhere, then the key. Symbol keys are named (`↑` Up Arrow, `↓` Down Arrow, `←` Left Arrow, `→` Right Arrow, `.` Period, `,` Comma, `\` Backslash, `+` Plus, space Space); other keys read as written. The names come from the provider string `shortcutKeyName` ([PROVIDER.md](PROVIDER.md)), which a host replaces to translate them; the `keyName` option replaces them for one call.

Implementation: `src/components/shortcut/shortcut-format.ts`, `src/core/strings.ts`
Verification: `src/components/shortcut/shortcut-format.test.ts`, `src/components/shortcut/shortcut.test.tsx`

### UIC-SHORTCUT-1.4 - Platform detection

`detectShortcutPlatform(source)` shall read the browser's client-hint platform, then its legacy platform, then its user agent, and report `mac` for Mac, iPhone, iPad and iPod values, `windows` for Windows values and `linux` otherwise, including when there is no browser. The source defaults to the browser's `navigator` and can be passed explicitly, so detection is testable. `getShortcutPlatform()` shall detect once on first use and reuse the result; every function that formats without an explicit platform uses it, and passing a platform skips detection entirely.

Implementation: `src/components/shortcut/shortcut-format.ts`
Verification: `src/components/shortcut/shortcut-format.test.ts`

### UIC-SHORTCUT-1.5 - Tooltip and description text

`formatShortcutTooltip(label, chord)` shall return `Label (chord)` in platform notation, the chord alone without a label and the label alone without a chord. `formatShortcutDescription(description, chord, { platform, keyName })` shall return the description followed by `. ` and the chord's readable words, keeping an existing description, and nothing when both are empty.

Implementation: `src/components/shortcut/shortcut-format.ts`
Verification: `src/components/shortcut/shortcut-format.test.ts`

### UIC-SHORTCUT-1.6 - Key shortcuts attribute

`formatAriaKeyShortcuts(chord, platform)` shall return the chord as an `aria-keyshortcuts` value for the platform: the modifiers in the same order as `Control`, `Alt`, `Shift` and `Meta` (so `Ctrl` is `Meta` on `mac`), then the key, joined by `+`. A single-character key is upper-cased; `+` is `Plus`, a space is `Space`, the arrow symbols are `ArrowUp`, `ArrowDown`, `ArrowLeft` and `ArrowRight`, and named keys such as `Enter` or `F2` stay as written. A chord with an empty key yields empty text. [Button](BUTTON.md) publishes it for its `shortcut`.

Implementation: `src/components/shortcut/shortcut-format.ts`
Verification: `src/components/shortcut/shortcut-format.test.ts`

### UIC-SHORTCUT-1.7 - Key sequences

A sequence shall be an array of chords pressed one after another, such as `['G', 'I']` or `['Ctrl+K', 'Ctrl+C']`. `formatShortcut` shall draw each chord in platform notation and join them with a space (`G I`, `⌘K ⌘C`), and `formatShortcutAccessibleText` shall join the chords' readable words with the provider string `shortcutSequence` (`G, then I`), which the `sequence` option replaces for one call. Chords with an empty key are skipped, a sequence of one chord reads as that chord, and `formatShortcutTooltip` and `formatShortcutDescription` take sequences too. `formatAriaKeyShortcuts` takes single chords only, because `aria-keyshortcuts` cannot express a sequence.

Implementation: `src/components/shortcut/shortcut-format.ts`, `src/core/common-strings.ts`
Verification: `src/components/shortcut/shortcut-format.test.ts`

## UIC-SHORTCUT-2 - Shortcut

### UIC-SHORTCUT-2.1 - Keycaps

`Shortcut` shall render a `<kbd>` root (React Aria `Keyboard`) holding the `ui-shortcut__keys` wrapper, which draws one `<kbd>` keycap per modifier and key in the `ui-shortcut__key` slot, with the platform separator between them, so its text equals `formatShortcut`. It publishes the notation drawn in `data-platform` and uses the detected platform unless `platform` is set. A chord with an empty key renders nothing.

Implementation: `src/components/shortcut/shortcut.tsx`, `labs/reference/shortcut.css`
Verification: `src/components/shortcut/shortcut.test.tsx`, `e2e/shortcut.spec.ts`

### UIC-SHORTCUT-2.2 - Accessibility

The keycaps shall be hidden from assistive technology, and the chord's readable text shall be present in the visually hidden `ui-shortcut__text` slot, so a screen reader reads `Shift Command K` rather than symbols. With `decorative` the readable text is left out, for a control that already describes the chord. Inside a React Aria menu item the shortcut is the item's keyboard slot, so the item names it in its accessible description.

Implementation: `src/components/shortcut/shortcut.tsx`
Verification: `src/components/shortcut/shortcut.test.tsx`, `e2e/shortcut.spec.ts`

### UIC-SHORTCUT-2.3 - Hooks and caller attributes

`Shortcut` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/shortcut/shortcut.tsx`
Verification: `src/components/shortcut/shortcut.test.tsx`

### UIC-SHORTCUT-2.4 - Sequences

`Shortcut` given a sequence of two or more chords shall draw each chord's keycaps in a `ui-shortcut__chord` slot inside `ui-shortcut__keys`, the chords separated by a space, so its text equals `formatShortcut`; its readable text is the sequence's ([UIC-SHORTCUT-1.7](#uic-shortcut-17---key-sequences)). A single chord draws its keycaps directly in `ui-shortcut__keys`. `KeyHints` accepts sequences among a hint's keys.

Implementation: `src/components/shortcut/shortcut.tsx`, `labs/reference/shortcut.css`
Verification: `src/components/shortcut/shortcut.test.tsx`, `e2e/shortcut.spec.ts`

## UIC-SHORTCUT-3 - Key hints

### UIC-SHORTCUT-3.1 - Legend

`KeyHints` shall render its `hints`, each `{ keys, action }`, as one `MetaLine` whose root also carries `ui-key-hints`: each hint in a `ui-key-hints__hint` slot holding its keys as `Shortcut`s (in the given `platform`), a space, and its action in the `ui-key-hints__action` slot. Hints are separated by the metadata line's separator, so `↑`, `↓` move and `Enter` select read `↑↓ move · Enter select`.

Implementation: `src/components/shortcut/shortcut.tsx`, `src/components/meta-line/meta-line.tsx`
Verification: `src/components/shortcut/shortcut.test.tsx`, `e2e/shortcut.spec.ts`

### UIC-SHORTCUT-3.2 - Hooks and caller attributes

`KeyHints` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/shortcut/shortcut.tsx`
Verification: `src/components/shortcut/shortcut.test.tsx`

## Hooks

| Hook                   | Kind      | Values                    | Description                                                   |
| ---------------------- | --------- | ------------------------- | ------------------------------------------------------------- |
| `ui-shortcut`          | root      |                           | The chord's `<kbd>` (React Aria `Keyboard`).                  |
| `ui-shortcut__keys`    | slot      |                           | The keycaps and separators, hidden from assistive technology. |
| `ui-shortcut__chord`   | slot      |                           | One chord's keycaps in a sequence.                            |
| `ui-shortcut__key`     | slot      |                           | One keycap `<kbd>`.                                           |
| `ui-shortcut__text`    | slot      |                           | The readable text, visually hidden. Absent when `decorative`. |
| `data-platform`        | attribute | `mac`, `windows`, `linux` | The notation drawn.                                           |
| `ui-key-hints`         | root      |                           | The legend's `<span>`, also `ui-meta-line`.                   |
| `ui-key-hints__hint`   | slot      |                           | One hint: its shortcuts, then its action.                     |
| `ui-key-hints__action` | slot      |                           | The hint's action text.                                       |
