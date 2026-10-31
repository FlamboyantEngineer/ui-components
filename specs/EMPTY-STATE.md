# Empty State

`EmptyState` is the notice a list, table, panel or section shows in place of its content while the content loads, when there is nothing to show, or when it could not load: an optional illustration, an optional heading over a one-line description and optional calls to action, in the space the content would occupy. The outcome of an action the reader just took belongs in a toast or a [Banner](BANNER.md); a problem with one field belongs under that field.

## UIC-EMPTY-STATE-1 - Contract

### UIC-EMPTY-STATE-1.1 - Structure

`EmptyState` shall render a `<section>` holding its `title` as a heading (level 3 unless `headingLevel` chooses 1 to 6) in the `ui-empty-state__title` slot, followed by its `description` in a `<p>` in the `ui-empty-state__description` slot, so assistive technology reads them in order. Without a title no heading renders.

Implementation: `src/components/empty-state/empty-state.tsx`
Verification: `src/components/empty-state/empty-state.test.tsx`, `e2e/empty-state.spec.ts`

### UIC-EMPTY-STATE-1.2 - Variants

`variant` shall publish `data-variant`: `empty` (the default: loaded, nothing to show), `loading` (being fetched) or `error` (could not load). `empty` and `error` share one structure, so the copy carries the difference: the title names what is absent or what failed, and the description says what would fill it or what the reader can do next.

Implementation: `src/components/empty-state/empty-state.tsx`, `labs/reference/empty-state.css`
Verification: `src/components/empty-state/empty-state.test.tsx`, `e2e/empty-state.spec.ts`

### UIC-EMPTY-STATE-1.3 - Sizes

`size` shall publish `data-size`: `md` (the default, centred with generous padding in the reference sheet) or `sm` (start-aligned with 4 pixel vertical padding, for dense panels and tables).

Implementation: `src/components/empty-state/empty-state.tsx`, `labs/reference/empty-state.css`
Verification: `src/components/empty-state/empty-state.test.tsx`, `e2e/empty-state.spec.ts`

### UIC-EMPTY-STATE-1.4 - Loading

A `loading` empty state shall draw a decorative `ui-empty-state__spinner` slot (hidden from assistive technology) before its text, and its root shall be a polite, atomic status region (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`) that is never marked busy, which would defer its announcement. The reference sheet spins the spinner unless the reader prefers reduced motion, when it stands still as an open ring. The description renders as given, unchanged.

Implementation: `src/components/empty-state/empty-state.tsx`, `labs/reference/empty-state.css`
Verification: `src/components/empty-state/empty-state.test.tsx`, `e2e/empty-state.spec.ts`

### UIC-EMPTY-STATE-1.5 - Settled notices

`empty` and `error` empty states shall have no role, live region or spinner of their own; a host that needs the change announced announces it through its own status region. Replacing a loading notice with a settled one removes the spinner and the live region. The empty state is static and takes no focus.

Implementation: `src/components/empty-state/empty-state.tsx`
Verification: `src/components/empty-state/empty-state.test.tsx`

### UIC-EMPTY-STATE-1.6 - Hooks and caller attributes

`EmptyState` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `hidden` to its root, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/empty-state/empty-state.tsx`
Verification: `src/components/empty-state/empty-state.test.tsx`

## UIC-EMPTY-STATE-2 - Media and actions

### UIC-EMPTY-STATE-2.1 - Illustration

`icon` shall draw a imported icon component or rendered element (an illustration, an image) as a decorative [Icon](ICON.md) in the `ui-empty-state__icon` slot, before the heading and hidden from assistive technology, so the text alone carries the message. A `loading` empty state draws its spinner in place of the icon, and an empty value draws no slot.

Implementation: `src/components/empty-state/empty-state.tsx`, `labs/reference/empty-state.css`
Verification: `src/components/empty-state/empty-state.test.tsx`, `e2e/empty-state.spec.ts`

### UIC-EMPTY-STATE-2.2 - Actions

`actions` shall render in the `ui-empty-state__actions` slot after the description, so the reader's next step (add the first item, clear the filters, try again) sits with the notice. Actions keep their own behaviour and focus; an empty value renders no slot. The reference sheet centres them in a `md` notice and aligns them to the start in a `sm` one.

Implementation: `src/components/empty-state/empty-state.tsx`, `labs/reference/empty-state.css`
Verification: `src/components/empty-state/empty-state.test.tsx`, `e2e/empty-state.spec.ts`

## Hooks

| Hook                          | Kind      | Values                      | Description                                   |
| ----------------------------- | --------- | --------------------------- | --------------------------------------------- |
| `ui-empty-state`              | root      |                             | The `<section>`.                              |
| `ui-empty-state__spinner`     | slot      |                             | The decorative busy indicator while loading.  |
| `ui-empty-state__icon`        | slot      |                             | The decorative illustration (also `ui-icon`). |
| `ui-empty-state__title`       | slot      |                             | The heading.                                  |
| `ui-empty-state__description` | slot      |                             | The description paragraph.                    |
| `ui-empty-state__actions`     | slot      |                             | The calls to action.                          |
| `data-variant`                | attribute | `empty`, `loading`, `error` | What the notice stands for.                   |
| `data-size`                   | attribute | `sm`, `md`                  | Density.                                      |
