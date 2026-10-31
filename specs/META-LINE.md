# Meta Line

`MetaLine` draws one inline line of metadata entries (a date, a count, a status, a link) separated by a middot. Empty entries leave no stray separator. `formatMetaLine` is its text form for tooltips, descriptions and other places that take only a string. The parent owns wrapping, truncation and the spacing around the line.

## UIC-META-LINE-1 - Entries

### UIC-META-LINE-1.1 - Empty entries and separators

`MetaLine` shall skip `null`, `undefined`, boolean, blank-string, empty-array and empty-fragment entries, keep the number zero, and put exactly one separator between the entries that remain, with none before the first or after the last. An array or fragment entry stays one entry. A list with no entries left renders nothing. The line does not render component entries to find out whether they are empty; a caller leaves such an entry out itself.

Implementation: `src/components/meta-line/meta-line.tsx`
Verification: `src/components/meta-line/meta-line.test.tsx`, `e2e/meta-line.spec.ts`

### UIC-META-LINE-1.2 - Separator

Each separator shall be a spaced middot: a space, the `·` glyph in the `ui-meta-line__separator` slot hidden from assistive technology, and a space. The spaces stay readable, so adjacent entries keep a word boundary in an accessible name.

Implementation: `src/components/meta-line/meta-line.tsx`, `labs/reference/meta-line.css`
Verification: `src/components/meta-line/meta-line.test.tsx`, `e2e/meta-line.spec.ts`

### UIC-META-LINE-1.3 - Nodes keep their identity

Entries shall keep their markup, accessibility and interactions, and keep their state when entries around them appear or disappear. An entry with an explicit React key is keyed by it, and other entries by their position in `items`, counting empty entries, so an unkeyed entry keeps its state when an entry before it empties; the two live in separate namespaces so an explicit key `1` never collides with position 1. The line adds no control, role or live region.

Implementation: `src/components/meta-line/meta-line.tsx`
Verification: `src/components/meta-line/meta-line.test.tsx`

### UIC-META-LINE-1.4 - Text form

`formatMetaLine(items)` shall join the strings and numbers of `items` with a spaced middot (a space, `·` and a space), skipping the same empty values as the component and keeping zero, without changing its input.

Implementation: `src/components/meta-line/meta-line.tsx`
Verification: `src/components/meta-line/meta-line.test.tsx`

### UIC-META-LINE-1.5 - Hooks and caller attributes

`MetaLine` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root. Text entries are rendered as text, never as markup.

Implementation: `src/components/meta-line/meta-line.tsx`
Verification: `src/components/meta-line/meta-line.test.tsx`

### UIC-META-LINE-1.6 - Naming

`aria-label` or `aria-labelledby` shall name the line and give its root `role="group"`, since a name on an element without a role is ignored; an unnamed line has no role.

Implementation: `src/components/meta-line/meta-line.tsx`
Verification: `src/components/meta-line/meta-line.test.tsx`

## Hooks

| Hook                      | Kind | Values | Description                                                   |
| ------------------------- | ---- | ------ | ------------------------------------------------------------- |
| `ui-meta-line`            | root |        | The inline `<span>` holding the entries.                      |
| `ui-meta-line__separator` | slot |        | The middot between entries, hidden from assistive technology. |
