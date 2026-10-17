# Banner

`Banner` reports the state of a surface in place: an optional title, a description, optional actions and an optional dismiss button, introduced by a decorative tone glyph. Its `tone` chooses both the glyph and how urgently the message is announced. Compact feedback under a failed operation is an [Inline Error](INLINE-ERROR.md); a region with nothing to show is an [Empty State](EMPTY-STATE.md).

## UIC-BANNER-1 - Contract

### UIC-BANNER-1.1 - Content

`Banner` shall render its `title` in the `ui-banner__title` slot and its `description` (text or rich content) in the `ui-banner__description` slot, both inside `ui-banner__content`, followed by `actions` in the `ui-banner__actions` slot. A title, description or actions value that is empty (`undefined`, `null`, `false` or `""`) renders no slot. Actions keep their own behaviour.

Implementation: `src/components/banner/banner.tsx`
Verification: `src/components/banner/banner.test.tsx`, `e2e/banner.spec.ts`

### UIC-BANNER-1.2 - Tones and glyphs

`tone` shall publish `data-tone`: `neutral` (the default), `info`, `success`, `warning` or `danger`. Without `icon`, the banner draws the tone's built-in glyph (`info`, `success`, `warning` and `error`; none for `neutral`) as a decorative [Icon](ICON.md) in the `ui-banner__icon` slot. `icon` replaces it with another glyph name or any icon node, and `icon={null}` draws none.

Implementation: `src/components/banner/banner.tsx`, `labs/reference/banner.css`
Verification: `src/components/banner/banner.test.tsx`, `e2e/banner.spec.ts`

### UIC-BANNER-1.3 - Dismiss

With `onDismiss`, the banner shall draw a small [Icon Button](ICON-BUTTON.md) with the `close` glyph in the `ui-banner__dismiss` slot, named by `dismissLabel` or the provider's `dismiss` string, which calls `onDismiss` once per activation by pointer or keyboard and never submits a form. Removing the banner stays the caller's decision.

Implementation: `src/components/banner/banner.tsx`
Verification: `src/components/banner/banner.test.tsx`, `e2e/banner.spec.ts`

### UIC-BANNER-1.4 - Inline presentation

`inline` shall render the banner and its parts as `<span>` elements, publishing `data-inline`, so a message can sit inside phrasing content (a heading, a sentence, a toolbar label) with the same announcement semantics.

Implementation: `src/components/banner/banner.tsx`, `labs/reference/banner.css`
Verification: `src/components/banner/banner.test.tsx`

### UIC-BANNER-1.5 - Focus on mount

`autoFocus` shall make the banner focusable from script only (`tabindex="-1"`) and move focus to it once, when it first renders, so a keyboard user lands on a newly shown critical message and tabs on into its actions. Later renders never move focus again, and without `autoFocus` the banner takes no focus.

Implementation: `src/components/banner/banner.tsx`
Verification: `src/components/banner/banner.test.tsx`, `e2e/banner.spec.ts`

## UIC-BANNER-2 - Announcements

### UIC-BANNER-2.1 - Roles and urgency

A `danger` banner shall carry `role="alert"` and `aria-live="assertive"`. A `neutral`, `info`, `success` or `warning` banner shall carry `role="status"` and `aria-live="polite"`. Every banner is `aria-atomic="true"`, so an update is read as one message. The caller cannot override the role or urgency.

Implementation: `src/components/banner/banner.tsx`
Verification: `src/components/banner/banner.test.tsx`, `e2e/banner.spec.ts`

### UIC-BANNER-2.2 - Live updates

Changing a mounted banner's tone or content shall update the same element in place, so its live region persists and the change is announced with the urgency of the new tone. The glyph and spinner are hidden from assistive technology so only the message is read.

Implementation: `src/components/banner/banner.tsx`
Verification: `src/components/banner/banner.test.tsx`, `e2e/banner.spec.ts`

## UIC-BANNER-3 - States

### UIC-BANNER-3.1 - Pending

`isPending` shall replace the glyph with a decorative `ui-banner__spinner` slot, set `aria-busy="true"` and publish `data-pending`. Without it neither attribute renders.

Implementation: `src/components/banner/banner.tsx`, `labs/reference/banner.css`
Verification: `src/components/banner/banner.test.tsx`

### UIC-BANNER-3.2 - Entering, exiting and hidden

`isEntering` shall publish `data-entering` while an enter animation plays, and `isExiting` shall publish `data-exiting` while an exit transition plays before the banner is removed. [`useEnterExit`](ENTER-EXIT.md) times both from the banner's `ref` and keeps it mounted through its exit, so the caller only says whether the banner is open. `hidden` shall hide the banner with the native `hidden` attribute while keeping the same element mounted.

Implementation: `src/components/banner/banner.tsx`, `labs/reference/banner.css`
Verification: `src/components/banner/banner.test.tsx`, `e2e/banner.spec.ts`

### UIC-BANNER-3.3 - Hooks and caller attributes

`Banner` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id`, `aria-label` and `ref` to its root, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/banner/banner.tsx`
Verification: `src/components/banner/banner.test.tsx`

## Hooks

| Hook                     | Kind      | Values                                            | Description                                    |
| ------------------------ | --------- | ------------------------------------------------- | ---------------------------------------------- |
| `ui-banner`              | root      |                                                   | The banner (`<div>`, or `<span>` when inline). |
| `ui-banner__icon`        | slot      |                                                   | The decorative tone glyph (also `ui-icon`).    |
| `ui-banner__spinner`     | slot      |                                                   | The decorative busy indicator while pending.   |
| `ui-banner__content`     | slot      |                                                   | Holds the title and description.               |
| `ui-banner__title`       | slot      |                                                   | The title.                                     |
| `ui-banner__description` | slot      |                                                   | The description.                               |
| `ui-banner__actions`     | slot      |                                                   | The caller's actions.                          |
| `ui-banner__dismiss`     | slot      |                                                   | The dismiss button (also `ui-icon-button`).    |
| `data-tone`              | attribute | `neutral`, `info`, `success`, `warning`, `danger` | Tone and urgency.                              |
| `data-inline`            | state     | `true`                                            | Rendered as phrasing content.                  |
| `data-pending`           | state     | `true`                                            | Work in progress.                              |
| `data-entering`          | state     | `true`                                            | Playing an enter animation.                    |
| `data-exiting`           | state     | `true`                                            | Playing an exit transition before removal.     |
