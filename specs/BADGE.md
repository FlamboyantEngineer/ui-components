# Badge

`Badge` is a compact, non-interactive value a reader scans rather than operates: a tag, a type, a role, a state or a count. Its `variant` chooses the shape, `tone` the colour family, and `size` the scale. Passing `count` instead of children makes it a count badge that formats the number itself ([COUNT.md](COUNT.md)). A token the reader presses is a [Button](BUTTON.md) with the `chip` variant, not a badge. A set of values the reader moves through or removes is a [Tag Group](TAG-GROUP.md).

## UIC-BADGE-1 - Contract

### UIC-BADGE-1.1 - Element

`Badge` shall render an inline `<span>` with its children in the `ui-badge__label` slot. It takes no focus and adds no role (except a status badge, UIC-BADGE-2.1), and it publishes no pressed, selected, disabled or busy state: a value that changes is shown by rendering the new value or tone.

Implementation: `src/components/badge/badge.tsx`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.2 - Variants

`variant` shall publish `data-variant`: `subtle` (the default, a tinted pill), `solid` (a filled token) or `status` (a tone dot before the label). A count badge publishes `count`.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.3 - Tones

`tone` shall publish `data-tone`: `neutral` (the default, a value with no tone), `info`, `success`, `warning` or `danger`. The tone is never the only signal: the label states the value.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.4 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`, shared by every variant and by count badges. The reference sheet draws 18, 22 and 26 pixel heights.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.5 - Bare

`bare` shall publish `data-bare` so the stylesheet drops the pill for a badge inside chrome that already draws its own edge, keeping its tone, dot and text scale.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`

### UIC-BADGE-1.6 - Hooks and caller attributes

`Badge` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id`, `hidden`, `aria-hidden` and `aria-label`, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/badge/badge.tsx`
Verification: `src/components/badge/badge.test.tsx`

## UIC-BADGE-2 - Status

### UIC-BADGE-2.1 - Dot and announcement

A `status` badge shall draw a `ui-badge__dot` slot before its label, hidden from assistive technology, and carry `role="status"` so a change is announced politely, unless `announce` is `false`, which keeps the text and dot without a live region. `mutedDot` publishes `data-muted-dot` on a status badge so the stylesheet softens only the dot. Other variants draw no dot and have no role.

Implementation: `src/components/badge/badge.tsx`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

## UIC-BADGE-3 - Counts

### UIC-BADGE-3.1 - Count display

A badge given `count` shall show `formatCount(count, { max, more })` ([COUNT.md](COUNT.md)) in its label slot and accept no children; its type refuses children, a variant and a string count. It uses the same tones and sizes as label badges.

Implementation: `src/components/badge/badge.tsx`, `src/utils/count.ts`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-3.2 - Accessible count

A count badge's accessible text shall be its `aria-label`, or else the uncapped count, read as the provider's `countOrMore` text ("12 or more") when `more` is set. When that text differs from the visible text, the visible label is hidden from assistive technology and the text renders in a visually hidden `ui-badge__accessible-label` slot, so no generic element carries an accessible name. An `aria-hidden` count badge renders no hidden text. A count badge has no role and no live region.

Implementation: `src/components/badge/badge.tsx`, `src/core/strings.ts`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-3.3 - Overlay placement

`placement` shall publish `data-placement` on a count badge: `inline` (the default) or `overlay`, which the stylesheet pins to the upper trailing corner of a positioned host without changing the host's size or catching pointer events.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

## Hooks

| Hook                         | Kind      | Values                                            | Description                                           |
| ---------------------------- | --------- | ------------------------------------------------- | ----------------------------------------------------- |
| `ui-badge`                   | root      |                                                   | The `<span>`.                                         |
| `ui-badge__dot`              | slot      |                                                   | The tone dot of a status badge.                       |
| `ui-badge__label`            | slot      |                                                   | The visible label or formatted count.                 |
| `ui-badge__accessible-label` | slot      |                                                   | Visually hidden count text, when it differs.          |
| `data-variant`               | attribute | `subtle`, `solid`, `status`, `count`              | Shape; `count` for count badges.                      |
| `data-tone`                  | attribute | `neutral`, `info`, `success`, `warning`, `danger` | Tone.                                                 |
| `data-size`                  | attribute | `sm`, `md`, `lg`                                  | Scale.                                                |
| `data-placement`             | attribute | `inline`, `overlay`                               | Count badges only: inline or pinned to a host corner. |
| `data-bare`                  | state     | `true`                                            | No pill.                                              |
| `data-muted-dot`             | state     | `true`                                            | A status badge's softened dot.                        |
