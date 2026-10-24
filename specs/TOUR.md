# Tour

`Tour` walks a reader through a sequence of steps, each a small dialog floating against an element of the page, with a spotlight over that element. The reader moves with Next and Back, sees how far along they are, and can skip at any time; the last step finishes the tour. A modal tour keeps the rest of the page inert until it ends; a non-modal one leaves the page usable. With `persistKey`, the provider's storage remembers that the tour was completed, so it does not open again.

## UIC-TOUR-1 - Steps

### UIC-TOUR-1.1 - A step against its target

While open, `Tour` shall show the step at its index as a React Aria dialog (`ui-tour__dialog`) inside the library's floating panel (the `ui-tour` root, on the dropdown layer), placed against the step's target at its `placement` (`bottom` by default; the panel publishes the resolved side in `data-placement`) with an arrow (`ui-tour__arrow`) pointing at it. The dialog holds a header (`ui-tour__header`) with the step's `title` as its heading (`ui-tour__title`), which names the dialog, and the position (`ui-tour__progress`, provider string `stepOfTotal`, `2 of 5`); then the step's `content` (`ui-tour__body`), absent when empty; then the footer (`ui-tour__footer`). A tour without steps, or closed, renders nothing.

Implementation: `src/components/tour/tour.tsx`, `src/components/tour/tour-panel.tsx`, `src/components/popover/popover.tsx`
Verification: `src/components/tour/tour.test.tsx`, `e2e/tour.spec.ts`

### UIC-TOUR-1.2 - Targets

A step's `target` shall be a ref to an element, or a CSS selector looked up in the document when the step shows. The target is scrolled into view, nearest edge first, when its step shows. A step whose target is missing (an empty ref, no match or an invalid selector) shows its dialog at the centre of the viewport, with no arrow, and its spotlight carries `data-target-missing`.

Implementation: `src/components/tour/use-tour-target.ts`, `src/components/tour/tour.tsx`, `src/components/tour/tour-spotlight.tsx`
Verification: `src/components/tour/tour.test.tsx`, `e2e/tour.spec.ts`

### UIC-TOUR-1.3 - Spotlight

While open, the tour shall render a decorative spotlight (`ui-tour__spotlight`, hidden from assistive technology) in a portal on the modal layer, below the dialog, fixed over the target's box in the viewport with functional inline position and size, following it as the page scrolls or resizes and the target changes size. It never takes pointer events. The host stylesheet draws it, for example as a ring whose wide shadow dims the rest of the page; unstyled it is invisible.

Position and size transitions shall run only when both the previous and next highlight positions exist. The first highlight, a change to a step without a target, and a change from such a step to a highlight shall settle immediately, including Back navigation. Other host animations, such as opacity, are unaffected.

Implementation: `src/components/tour/tour-spotlight.tsx`, `src/utils/overlay-auto-update.ts`, `labs/reference/tour.css`
Verification: `src/components/tour/tour.test.tsx`, `src/components/tour/tour-spotlight.test.tsx`, `e2e/tour.spec.ts`

## UIC-TOUR-2 - Navigation

### UIC-TOUR-2.1 - Next, back and finish

The footer shall hold a Back button (`ui-tour__back`, provider string `back`) from the second step on and a primary Next button (`ui-tour__next`, `next`), which reads Finish (`finish`) on the last step. Next shows the following step and Back the previous one; Finish closes the tour and calls `onFinish`. Each change of step calls `onStepChange` with the new index.

Implementation: `src/components/tour/tour.tsx`, `src/components/tour/tour-panel.tsx`
Verification: `src/components/tour/tour.test.tsx`, `e2e/tour.spec.ts`

### UIC-TOUR-2.2 - Skipping

Every step but the last shall offer a Skip button (`ui-tour__skip`, provider string `skip`), and Escape inside the dialog skips too: the tour closes and `onSkip` receives the shown step's index. Presses outside the dialog never close the tour.

Implementation: `src/components/tour/tour.tsx`, `src/components/tour/tour-panel.tsx`
Verification: `src/components/tour/tour.test.tsx`, `e2e/tour.spec.ts`

### UIC-TOUR-2.3 - Open state and step

`isOpen` (controlled) or `defaultOpen` (uncontrolled, closed by default) shall open the tour, and `onOpenChange` receives `false` when it finishes or is skipped. `step` (controlled) or `defaultStep` (uncontrolled, `0` by default) chooses the shown step, kept within the steps.

Implementation: `src/components/tour/tour.tsx`
Verification: `src/components/tour/tour.test.tsx`, `e2e/tour.spec.ts`

### UIC-TOUR-2.4 - A fresh start

An uncontrolled step shall return to `defaultStep` whenever the tour closes, by Finish, Skip or Escape or by the host setting a controlled `isOpen` to `false`, so a tour opened again starts from the beginning.

Implementation: `src/components/tour/tour.tsx`
Verification: `src/components/tour/tour.test.tsx`

### UIC-TOUR-2.5 - Focus

When the tour opens, focus shall move to the step's dialog, which announces its title; each new step moves focus to its own dialog; while a modal tour is open focus stays inside the dialog; when the tour closes focus returns to where it was before it opened.

Implementation: `src/components/tour/tour.tsx`, `src/components/tour/tour-panel.tsx`, `src/components/popover/popover.tsx`
Verification: `src/components/tour/tour.test.tsx`, `e2e/tour.spec.ts`

## UIC-TOUR-3 - Persistence, modality and hooks

### UIC-TOUR-3.1 - Remembered completion

With `persistKey`, finishing or skipping the tour shall store `true` under that key through the provider's storage adapter ([PROVIDER.md](PROVIDER.md)), and an uncontrolled tour whose key holds `true` stays closed, `defaultOpen` notwithstanding. A controlled `isOpen` still opens it, so a host can offer to take the tour again; clearing the key resets it.

Implementation: `src/components/tour/tour.tsx`, `src/core/provider.tsx`
Verification: `src/components/tour/tour.test.tsx`, `e2e/tour.spec.ts`

### UIC-TOUR-3.2 - Modal and non-modal

By default the tour shall be modal: the rest of the page is inert and hidden from assistive technology, and it does not scroll, until the tour ends. `isNonModal` shall publish `data-non-modal` and leave the page reachable, visible to assistive technology and scrollable, so the reader can try the target while the step explains it.

Implementation: `src/components/tour/tour.tsx`, `src/components/popover/popover.tsx`
Verification: `src/components/tour/tour.test.tsx`, `e2e/tour.spec.ts`

### UIC-TOUR-3.3 - Hooks and caller attributes

`Tour` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its floating panel, and give the dialog the caller's `id`.

Implementation: `src/components/tour/tour.tsx`
Verification: `src/components/tour/tour.test.tsx`

## Hooks

| Hook                  | Kind  | Values                           | Description                                                        |
| --------------------- | ----- | -------------------------------- | ------------------------------------------------------------------ |
| `ui-tour`             | root  |                                  | The floating panel of the shown step.                              |
| `ui-tour__arrow`      | slot  |                                  | The arrow pointing at the target.                                  |
| `ui-tour__dialog`     | slot  |                                  | The step's dialog.                                                 |
| `ui-tour__header`     | slot  |                                  | The title and the position.                                        |
| `ui-tour__title`      | slot  |                                  | The step's heading.                                                |
| `ui-tour__progress`   | slot  |                                  | The position, such as `2 of 5`.                                    |
| `ui-tour__body`       | slot  |                                  | The step's content.                                                |
| `ui-tour__footer`     | slot  |                                  | The Skip, Back and Next buttons.                                   |
| `ui-tour__skip`       | slot  |                                  | The Skip button (also `ui-button`).                                |
| `ui-tour__back`       | slot  |                                  | The Back button (also `ui-button`).                                |
| `ui-tour__next`       | slot  |                                  | The Next or Finish button (also `ui-button`).                      |
| `ui-tour__spotlight`  | slot  |                                  | The decorative box over the target, in a portal.                   |
| `data-placement`      | state | `top`, `bottom`, `left`, `right` | The side the panel opened on, on the panel and arrow (React Aria). |
| `data-entering`       | state | `true`                           | While the panel animates in (React Aria).                          |
| `data-exiting`        | state | `true`                           | While the panel animates out (React Aria).                         |
| `data-non-modal`      | state | `true`                           | The page stays usable while the tour is open.                      |
| `data-target-missing` | state | `true`                           | On the spotlight, when the step's target was not found.            |
