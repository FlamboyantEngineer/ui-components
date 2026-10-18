# Status Light

`StatusLight` names a status with a coloured dot beside a short label, such as a service state (`Running`, `Stopped`) or a person's presence (`Away`). The label carries the meaning; the dot's colour repeats it. It reuses the presence vocabulary of [Presence Avatar](PRESENCE-AVATAR.md) (`active`, `away`, `busy`, `idle`) so a presence state can show on its own, labelled from the provider's strings. A [Badge](BADGE.md) with the `status` variant is a tinted pill with a dot; its `dot` variant is a bare marker.

## UIC-STATUS-LIGHT-1 - Status light

### UIC-STATUS-LIGHT-1.1 - Parts

`StatusLight` shall render a `ui-status-light` `<span>` holding a decorative `ui-status-light__dot` element (`aria-hidden="true"`) followed by its visible label, the `children`, in a `ui-status-light__label` element.

Implementation: `src/components/status-light/status-light.tsx`
Verification: `src/components/status-light/status-light.test.tsx`, `e2e/status-light.spec.ts`

### UIC-STATUS-LIGHT-1.2 - Tones

`tone` shall publish `data-tone`: `neutral` (the default), `info`, `success`, `warning` or `danger`, so the stylesheet colours the dot.

Implementation: `src/components/status-light/status-light.tsx`, `labs/reference/status-light.css`
Verification: `src/components/status-light/status-light.test.tsx`, `e2e/status-light.spec.ts`

### UIC-STATUS-LIGHT-1.3 - Sizes

`size` shall publish `data-size`: `sm`, `md` (the default) or `lg`. The reference sheet draws 6, 8 and 10 pixel dots beside 12, 13 and 15 pixel text.

Implementation: `src/components/status-light/status-light.tsx`, `labs/reference/status-light.css`
Verification: `src/components/status-light/status-light.test.tsx`, `e2e/status-light.spec.ts`

### UIC-STATUS-LIGHT-1.4 - Presence

`status` (`active`, `away`, `busy` or `idle`, the words a presence avatar uses) shall publish `data-status`, and without `children` the light shows the provider's `presenceStatus` string for it as its label (`Away`). The reference sheet colours each presence as the presence avatar's indicator does, over the tone.

Implementation: `src/components/status-light/status-light.tsx`, `src/core/common-strings.ts`, `labs/reference/status-light.css`
Verification: `src/components/status-light/status-light.test.tsx`, `e2e/status-light.spec.ts`

### UIC-STATUS-LIGHT-1.5 - Processing

`isProcessing` shall publish `data-processing` while the status is still in progress, such as a deployment that runs; the reference sheet pulses the dot unless the reader prefers reduced motion. The label states the progress (`Deploying`).

Implementation: `src/components/status-light/status-light.tsx`, `labs/reference/status-light.css`
Verification: `src/components/status-light/status-light.test.tsx`, `e2e/status-light.spec.ts`

### UIC-STATUS-LIGHT-1.6 - Hooks and caller attributes

`StatusLight` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/status-light/status-light.tsx`
Verification: `src/components/status-light/status-light.test.tsx`

## UIC-STATUS-LIGHT-2 - Accessibility

### UIC-STATUS-LIGHT-2.1 - Name

A light with a visible label shall be read as that text, with no role of its own. Without a visible label, `aria-label` makes the root an image (`role="img"`) named by it; given with `status`, it also replaces the presence label, so the light shows only its dot. A light with neither is decorative and hidden from assistive technology.

Implementation: `src/components/status-light/status-light.tsx`
Verification: `src/components/status-light/status-light.test.tsx`, `e2e/status-light.spec.ts`

### UIC-STATUS-LIGHT-2.2 - Static output

A status light shall take no tab stop and announce nothing on its own; a host whose status change should be heard places it in its own status region. The colour is never the only signal: the label or name states the status.

Implementation: `src/components/status-light/status-light.tsx`
Verification: `src/components/status-light/status-light.test.tsx`, `e2e/status-light.spec.ts`

## Hooks

| Hook                     | Kind      | Values                                            | Description                             |
| ------------------------ | --------- | ------------------------------------------------- | --------------------------------------- |
| `ui-status-light`        | root      |                                                   | The `<span>`.                           |
| `ui-status-light__dot`   | slot      |                                                   | The decorative dot.                     |
| `ui-status-light__label` | slot      |                                                   | The visible label, when there is one.   |
| `data-tone`              | attribute | `neutral`, `info`, `success`, `warning`, `danger` | The status's tone.                      |
| `data-size`              | attribute | `sm`, `md`, `lg`                                  | Dot and text size.                      |
| `data-status`            | attribute | `active`, `away`, `busy`, `idle`                  | A presence state, when `status` is set. |
| `data-processing`        | state     | `true`                                            | The status is still in progress.        |
