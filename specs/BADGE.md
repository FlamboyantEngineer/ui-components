# Badge

`Badge` is a compact, non-interactive value a reader scans rather than operates: a tag, a type, a role, a state or a count. Its `variant` chooses the shape, `tone` the color family, and `size` the scale. Passing `count` instead of children makes it a count badge that formats the number itself ([COUNT.md](COUNT.md)); `variant="dot"` makes it a marker with no text. A token the reader presses is a [Button](BUTTON.md) with the `chip` variant, not a badge. A set of values the reader moves through or removes is a [Tag Group](TAG-GROUP.md).

## UIC-BADGE-1 - Contract

### UIC-BADGE-1.1 - Element

`Badge` shall render an inline `<span>` with its children in the `ui-badge__label` slot. It takes no focus and adds no role (except a status badge, UIC-BADGE-2.1), and it publishes no pressed, selected, disabled or busy state: a value that changes is shown by rendering the new value or tone.

Implementation: `src/components/badge/badge.tsx`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.2 - Variants

`variant` shall publish `data-variant`: `subtle` (the default, a tinted pill), `solid` (a filled token), `status` (a tone dot before the label) or `dot` (a marker with no text, [UIC-BADGE-4.1](#uic-badge-41---dot-marker)). A count badge accepts `BadgeCountVariant` (`subtle` by default or `solid`) and additionally publishes `data-count`, separating numeric geometry from appearance and semantic tone.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.3 - Tones

`tone` shall publish `data-tone`: `neutral` (the default, a value with no tone), `info`, `success`, `warning` or `danger`. The tone is never the only signal: the label states the value.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.4 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`, shared by every variant and by count badges. The reference sheet draws 18, 22 and 26 pixel heights. At every size the label shows descenders, capitals and accents whole ([UIC-LABS-3.7](LABS.md#uic-labs-37---control-scale)).

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.5 - Bare

`bare` shall publish `data-bare` so the stylesheet drops the pill for a badge inside chrome that already draws its own edge, keeping its tone, dot and text scale.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`

### UIC-BADGE-1.6 - Hooks and caller attributes

`Badge` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id`, `ref` (its `<span>` root), `hidden` and `aria-hidden`, read `aria-label` as [UIC-BADGE-1.8](#uic-badge-18---accessible-label), [UIC-BADGE-3.2](#uic-badge-32---accessible-count) and [UIC-BADGE-4.1](#uic-badge-41---dot-marker) say, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/badge/badge.tsx`
Verification: `src/components/badge/badge.test.tsx`

### UIC-BADGE-1.7 - Icons

`startIcon` and `endIcon` shall draw an imported icon component or rendered element as a decorative [Icon](ICON.md) in the `ui-badge__start-icon` and `ui-badge__end-icon` slots, before and after a label badge's label (after a status badge's dot). An empty value draws no slot. Count and dot badges take no icons.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

### UIC-BADGE-1.8 - Accessible label

A label badge's `aria-label` shall be read in place of its visible label. An announced status badge (`role="status"`) carries it as its name; any other label badge has no role, so the visible label is hidden from assistive technology and the text renders in the visually hidden `ui-badge__accessible-label` slot, and no generic element carries a name. An `aria-hidden` badge renders no hidden text.

Implementation: `src/components/badge/badge.tsx`
Verification: `src/components/badge/badge.test.tsx`

### UIC-BADGE-1.9 - Collapsing to a dot

A label badge whose room, with the badge drawn whole, is narrower than its label's first character (a whole grapheme) followed by an ellipsis, measured in the label's font, shall publish `data-collapsed`, and the reference sheet draws it as a small round chip (8, 10 or 12 pixels by size) with the variant's own fill and border, a status badge's in its tone, with its label visually hidden and still read by assistive technology. It measures again when its label changes, when fonts load and when it, its host or the host's container resizes, and drops `data-collapsed` once the room fits the letter and the ellipsis. This is the default; `collapse="none"` keeps the cut label. While the label is cut, by an ellipsis or by collapsing, resting the pointer on it shows the whole label in a [Truncation Tooltip](TOOLTIP.md). Count and dot badges never collapse.

Implementation: `src/components/badge/badge.tsx`, `src/components/badge/badge-collapse.ts`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

## UIC-BADGE-2 - Status

### UIC-BADGE-2.1 - Dot and announcement

A `status` badge shall draw a `ui-badge__dot` slot before its label, hidden from assistive technology, and carry `role="status"` so a change is announced politely, unless `announce` is `false`, which keeps the text and dot without a live region. `mutedDot` publishes `data-muted-dot` on a status badge so the stylesheet softens only the dot. Other variants draw no dot and have no role.

Implementation: `src/components/badge/badge.tsx`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

## UIC-BADGE-3 - Counts

### UIC-BADGE-3.1 - Count display

A badge given `count` shall show `formatCount(count, locale, { max, more })` in the provider locale ([COUNT.md](COUNT.md)) in its label slot and accept no children; its type refuses children, status/dot variants and a string count. Counts default to the quiet `subtle` appearance; `solid` explicitly requests a vibrant filled count, including icon notifications. Both share geometry and typography independent of parent font and selected styles. It uses the same tones and sizes as label badges.

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

### UIC-BADGE-3.4 - Hiding zero

`showZero={false}` shall render nothing while a count badge's normalized count is zero and `more` is not set, so a corner count disappears once everything is read; it renders again as soon as the count is above zero. `showZero` defaults to `true`, which shows `0`.

Implementation: `src/components/badge/badge.tsx`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

## UIC-BADGE-4 - Dots

### UIC-BADGE-4.1 - Dot marker

A badge with `variant="dot"` shall render an empty marker that publishes `data-variant="dot"`, its tone, size and `data-placement` (`inline` by default, or `overlay`, pinned to the upper trailing corner of a positioned host as a count is). It takes no children, count or icons. With an `aria-label`, its text renders in the visually hidden `ui-badge__accessible-label` slot, so no generic element carries a name; without one, or with `aria-hidden`, the marker is hidden from assistive technology. It has no role and no live region.

Implementation: `src/components/badge/badge.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/badge.test.tsx`, `e2e/badge.spec.ts`

## Status Light

`StatusLight` names a status with a colored dot beside a short label, such as a service state (`Running`, `Stopped`) or a person's presence (`Away`). The label carries the meaning; the dot's color repeats it. It reuses the presence vocabulary of [Presence Avatar](AVATAR.md) (`active`, `away`, `busy`, `idle`) so a presence state can show on its own, labelled from the provider's strings. A [Badge](BADGE.md) with the `status` variant is a tinted pill with a dot; its `dot` variant is a bare marker.

## UIC-BADGE-5 - Status light

### UIC-BADGE-5.1 - Parts

`StatusLight` shall render a `ui-status-light` `<span>` holding a decorative `ui-status-light__dot` element (`aria-hidden="true"`) followed by its visible label, the `children`, in a `ui-status-light__label` element.

Implementation: `src/components/badge/status-light.tsx`
Verification: `src/components/badge/status-light.test.tsx`, `e2e/badge-status-light.spec.ts`

### UIC-BADGE-5.2 - Tones

`tone` shall publish `data-tone`: `neutral` (the default), `info`, `success`, `warning` or `danger`, so the stylesheet colors the dot.

Implementation: `src/components/badge/status-light.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/status-light.test.tsx`, `e2e/badge-status-light.spec.ts`

### UIC-BADGE-5.3 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`. The reference sheet draws 6, 8 and 10 pixel dots beside 12, 13 and 15 pixel text.

Implementation: `src/components/badge/status-light.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/status-light.test.tsx`, `e2e/badge-status-light.spec.ts`

### UIC-BADGE-5.4 - Presence

`status`, a `PresenceStatus` (`active`, `away`, `busy` or `idle`, the type Avatar and User Identity take) shall publish `data-status`, and without `children` the light shows the provider's `presenceStatus` string for it as its label (`Away`). The reference sheet colors each presence as the presence avatar's indicator does, over the tone.

Implementation: `src/components/badge/status-light.tsx`, `src/core/strings/common.ts`, `labs/reference/badge.css`
Verification: `src/components/badge/status-light.test.tsx`, `e2e/badge-status-light.spec.ts`

### UIC-BADGE-5.5 - Pending

`isPending` shall publish `data-pending` while the status is still in progress, such as a deployment that runs; the reference sheet pulses the dot unless the reader prefers reduced motion. The label states the progress (`Deploying`). The flag is the same `isPending` that Banner and InlineError take for work in progress, so one pending state drives them all.

Implementation: `src/components/badge/status-light.tsx`, `labs/reference/badge.css`
Verification: `src/components/badge/status-light.test.tsx`, `e2e/badge-status-light.spec.ts`

### UIC-BADGE-5.6 - Hooks and caller attributes

`StatusLight` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its `<span>` root; caller attributes never replace a hook attribute.

Implementation: `src/components/badge/status-light.tsx`
Verification: `src/components/badge/status-light.test.tsx`

## UIC-BADGE-6 - Accessibility

### UIC-BADGE-6.1 - Name

A light with a visible label shall be read as that text, with no role of its own. Without a visible label, `aria-label` makes the root an image (`role="img"`) named by it; given with `status`, it also replaces the presence label, so the light shows only its dot. A light with neither is decorative and hidden from assistive technology.

Implementation: `src/components/badge/status-light.tsx`
Verification: `src/components/badge/status-light.test.tsx`, `e2e/badge-status-light.spec.ts`

### UIC-BADGE-6.2 - Static output

A status light shall take no tab stop and announce nothing on its own; a host whose status change should be heard places it in its own status region. The color is never the only signal: the label or name states the status.

Implementation: `src/components/badge/status-light.tsx`
Verification: `src/components/badge/status-light.test.tsx`, `e2e/badge-status-light.spec.ts`

## Hooks

| Hook                         | Kind      | Values / Meaning                                  |
| ---------------------------- | --------- | ------------------------------------------------- |
| `ui-badge`                   | root      | `badge`                                           | The `<span>`.                                                               |
| `ui-badge__dot`              | slot      |                                                   | The tone dot of a status badge.                                             |
| `ui-badge__start-icon`       | slot      |                                                   | The icon before a label (also `ui-icon`).                                   |
| `ui-badge__label`            | slot      |                                                   | The visible label or formatted count.                                       |
| `ui-badge__end-icon`         | slot      |                                                   | The icon after a label (also `ui-icon`).                                    |
| `ui-badge__accessible-label` | slot      |                                                   | Visually hidden `aria-label` or count text that assistive technology reads. |
| `data-variant`               | attribute | `subtle`, `solid`, `status`, `dot`                | Appearance; `dot` for markers.                                              |
| `data-count`                 | state     | `true`                                            | Numeric geometry, independent of variant and tone.                          |
| `data-tone`                  | attribute | `neutral`, `info`, `success`, `warning`, `danger` | Tone.                                                                       |
| `data-size`                  | attribute | `sm`, `md`, `lg`                                  | Scale.                                                                      |
| `data-placement`             | attribute | `inline`, `overlay`                               | Count and dot badges: inline or pinned to a corner.                         |
| `data-bare`                  | state     | `true`                                            | No pill.                                                                    |
| `data-muted-dot`             | state     | `true`                                            | A status badge's softened dot.                                              |
| `data-collapsed`             | state     | `true`                                            | A label badge too narrow for a letter and an ellipsis, drawn as a dot.      |
| `ui-status-light`            | root      |                                                   | The `<span>`.                                                               |
| `ui-status-light__dot`       | slot      |                                                   | The decorative dot.                                                         |
| `ui-status-light__label`     | slot      |                                                   | The visible label, when there is one.                                       |
| `data-tone`                  | attribute | `neutral`, `info`, `success`, `warning`, `danger` | The status's tone.                                                          |
| `data-size`                  | attribute | `sm`, `md`, `lg`                                  | Dot and text size.                                                          |
| `data-status`                | attribute | `active`, `away`, `busy`, `idle`                  | A presence state, when `status` is set.                                     |
| `data-pending`               | state     | `true`                                            | The status is still in progress.                                            |
