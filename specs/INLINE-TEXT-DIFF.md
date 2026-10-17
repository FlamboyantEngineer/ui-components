# Inline Text Diff

`InlineTextDiff` shows a change to a text value inline: the unchanged context as plain text, the removed run and the added run, in reading order and in the flow of the text around it. `createInlineTextDiffExcerpt` builds its segments from two values. It is read-only output with no states.

## UIC-INLINE-TEXT-DIFF-1 - Segments

### UIC-INLINE-TEXT-DIFF-1.1 - One contiguous change

`splitTextDiff(before, after)` shall split two values around their one contiguous change, comparing code points: the longest common prefix, the removed middle of `before`, the added middle of `after`, and the longest common suffix that does not overlap the prefix.

Implementation: `src/components/inline-text-diff/text-diff.ts`
Verification: `src/components/inline-text-diff/inline-text-diff.test.tsx`

### UIC-INLINE-TEXT-DIFF-1.2 - Bounded excerpt

`createInlineTextDiffExcerpt(before, after)` shall return `text`, `removed`, `added` and `text` segments in that order, leaving out empty ones, so a first value is one added run and a cleared value one removed run. Context keeps at most 24 characters on each side (the characters nearest the change) and each run at most 100, a cut marked with `…`; `context` and `run` options change the limits.

Implementation: `src/components/inline-text-diff/text-diff.ts`
Verification: `src/components/inline-text-diff/inline-text-diff.test.tsx`, `e2e/inline-text-diff.spec.ts`

## UIC-INLINE-TEXT-DIFF-2 - Rendering

### UIC-INLINE-TEXT-DIFF-2.1 - Semantic runs

`InlineTextDiff` shall render a `<span>` root holding its `segments` in order: a removed run as a native `<del>` in the `ui-inline-text-diff__removed` slot, an added run as a native `<ins>` in the `ui-inline-text-diff__added` slot and unchanged context as plain text. The change is in the markup, not only in a colour, and the diff has no role or accessible name of its own.

Implementation: `src/components/inline-text-diff/inline-text-diff.tsx`, `labs/reference/inline-text-diff.css`
Verification: `src/components/inline-text-diff/inline-text-diff.test.tsx`, `e2e/inline-text-diff.spec.ts`

### UIC-INLINE-TEXT-DIFF-2.2 - Text only

Every segment shall render as text: markup inside a value shows as its characters and never becomes an element.

Implementation: `src/components/inline-text-diff/inline-text-diff.tsx`
Verification: `src/components/inline-text-diff/inline-text-diff.test.tsx`

### UIC-INLINE-TEXT-DIFF-2.3 - Hooks and caller attributes

`InlineTextDiff` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/inline-text-diff/inline-text-diff.tsx`
Verification: `src/components/inline-text-diff/inline-text-diff.test.tsx`

## Hooks

| Hook                           | Kind | Values | Description                    |
| ------------------------------ | ---- | ------ | ------------------------------ |
| `ui-inline-text-diff`          | root |        | The `<span>` holding the runs. |
| `ui-inline-text-diff__removed` | slot |        | The removed run's `<del>`.     |
| `ui-inline-text-diff__added`   | slot |        | The added run's `<ins>`.       |
