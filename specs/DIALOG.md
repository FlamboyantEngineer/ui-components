# Dialog

`Dialog` is a blocking dialog: a task or decision the reader finishes or cancels before returning to the page beneath. Compose the title, description, body and footer with named parts, or pass a title and use the built-in header, body and action bar. `AlertDialog` uses the same engine for decisions and `Sheet` places the dialog at a viewport edge. It is built on React Aria's `ModalOverlay`, `Modal`, `Dialog` and `Heading`, which provide the focus trap, Escape, outside presses, hiding the page from assistive technology and focus restoration. The same dialog can also float over the page without blocking it, or open as a popover against its trigger (React Aria `Popover`). Imperative callers open modals through [Dialog Controller](DIALOG.md); yes-or-no decisions use [AlertDialog](#uic-dialog-21---decision).

```tsx
import { Button } from '@flamboyantengineer/ui-components/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@flamboyantengineer/ui-components/dialog';

<DialogTrigger>
  <Button>View delivery details</Button>
  <Dialog>
    <DialogHeader>
      <DialogTitle>Delivery details</DialogTitle>
      <DialogDescription>The parcel ships on Tuesday.</DialogDescription>
    </DialogHeader>
    <DialogBody>Tracking appears once the parcel has shipped.</DialogBody>
    <DialogFooter>
      <DialogClose>Done</DialogClose>
    </DialogFooter>
  </Dialog>
</DialogTrigger>;
```

## UIC-DIALOG-1 - Overlay

### UIC-DIALOG-1.1 - Opening and closing

`Dialog` shall be open while `isOpen` is true (or, uncontrolled, from `defaultOpen`), report every close through `onOpenChange(false)`, and render nothing while closed (unless retained, [UIC-DIALOG-9.1](#uic-dialog-91---retained-body)). Inside a `DialogTrigger` ([UIC-DIALOG-1.6](#uic-dialog-16---trigger)) or a React Aria `DialogTrigger`, with neither `isOpen` nor `defaultOpen`, it shall follow the trigger's open state: the trigger's `onOpenChange` reports every change, and the modal's own `onOpenChange` reports the closes the modal makes (Cancel, the close button, Escape, an outside press, an action), so a confirmation can tell a cancel inside a trigger. While open it renders, in an overlay at the end of the document body, the `ui-dialog` overlay, the `ui-dialog__panel` box and the `ui-dialog__dialog` element with `role="dialog"`.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-1.2 - Layering

The overlay shall cover the viewport (fixed position, zero inset) and carry the z-index of the `modal` overlay layer ([UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)) as a functional inline style, with `data-layer="modal"`. A `layerZIndex` from `PortalContainerProvider` or `PortalHost` above it applies. Every presentation renders into the overlay container they choose ([UIC-PORTAL-1.2](PORTAL.md#uic-portal-12---choosing-the-container)), the document body by default; floating and retained dialogs render through a `Portal` on the `modal` layer, so they render nothing on the server and until hydrated. A modal opened while another is open shall stack above it, and content on the `dropdown`, `context-menu`, `tooltip` and `toast` layers shall stack above every modal.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-1.3 - Blocking the page

While a modal is open, the content outside it shall be hidden from assistive technology and unreachable by focus, and pointer presses outside the dialog shall land on the overlay rather than on the page beneath.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-1.4 - Tones, sizes and body layout

The overlay shall publish `data-tone` (`neutral`, the default, `danger` for a destructive decision, or `info`, `success` or `warning` for the kind of news the dialog brings), `data-size` (`sm`, `md`, the default, `lg`, `xl`, or `full` for a dialog that fills the viewport) and `data-body-layout` (`block`, the default, or `column`, which lays the body out as a vertical stack so one child can take the remaining height). The host stylesheet maps them to widths and layouts; the reference sheet uses 400, 560, 800, 1120 pixels and the viewport less 16 pixels per side.

Implementation: `src/components/dialog/dialog.tsx`, `labs/reference/dialog.css`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-1.5 - Exit complete

`onExitComplete` shall be called once each time the dialog has closed and left the page, after its exit animation has ended (at once without one), in every presentation. It is not called when the component is removed while the dialog is open.

Implementation: `src/components/dialog/dialog-surface.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `src/components/dialog/dialog-presentations.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-1.6 - Trigger

`DialogTrigger` shall hold one pressable trigger, such as a `Button`, and a `Dialog`, and add no element of its own: pressing the trigger opens the modal, which follows the trigger's open state, and closing it returns focus to the trigger. `isOpen` with `onOpenChange` on the trigger controls it, `defaultOpen` opens it at first, and `onOpenChange` reports each change the reader asks for.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `src/components/dialog/dialog-presentations.test.tsx`

### UIC-DIALOG-1.7 - Tall content

The panel shall stay within the overlay, less its padding, whatever the height of the body: the header with its close button and the footer with its actions stay on screen, and the body scrolls inside the panel. The reference stylesheet sizes the overlay's single grid track to the padded viewport so the panel's height limit resolves against it, at every size and in both themes.

The frame shall stay in place while the reader works in a tall body: focusing a field or a restore button, expanding content or resizing the viewport scrolls the body, never the overlay. The reference stylesheet makes the body the containing block of what it positions (such as the visually hidden inputs of checkboxes), so nothing in a tall body gives the overlay scroll room; the overlay keeps its own scrolling for a viewport too short for the header and footer.

Implementation: `labs/reference/dialog.css`
Verification: `e2e/dialog.spec.ts`, `e2e/dialog-tall-form.spec.ts`

## UIC-DIALOG-2 - Dismissal

### UIC-DIALOG-2.1 - Escape

Escape pressed inside the modal shall close it, unless `isKeyboardDismissDisabled` is set. A component inside the modal that handles Escape itself (an open list, an editor), by stopping it or by calling `preventDefault`, shall keep it, leaving the modal open in every presentation (blocking, floating or anchored) without asking `shouldCloseOnEscape`; the next Escape it leaves alone closes the modal. With modals stacked, Escape shall close only the topmost. An Escape pressed while composing text belongs to the input method and closes nothing.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-2.2 - Outside presses

An ordinary blocking or anchored `Dialog` shall close on a press that starts and ends outside it. A press that starts inside and ends outside shall leave it open. Set `isDismissable={false}` to keep draft or form content open on outside presses. `AlertDialog` defaults to outside dismissal disabled, and outside presses leave any dialog open while a built-in action is pending. With dialogs stacked, only the topmost responds.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-2.3 - Refusing dismissal

`isDismissDisabled` shall refuse every way of dismissing the modal at once: it disables Cancel and the close button and ignores Escape and outside presses, for an operation that cannot be cancelled. The actions can still close it.

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-surface.tsx`
Verification: `src/components/dialog/dialog.test.tsx`

### UIC-DIALOG-2.4 - Vetoing a dismissal

`shouldCloseOnEscape()` shall be asked each time Escape would close the dialog, and `shouldCloseOnInteractOutside(element)` each time an outside press would close a dismissable one, with the element pressed; when either returns false the dialog stays open and the press or key goes no further, so a host can keep unsaved work and ask first. Neither is asked while that dismissal is refused anyway.

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-surface.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

## UIC-DIALOG-3 - Focus

### UIC-DIALOG-3.1 - Initial focus

When the modal opens, focus shall move to the element inside it that has `autoFocus` (including a footer action with `autoFocus`); otherwise, with `initialFocus="first"` (the default), to the first focusable element of the body, then of the footer, then of the header; otherwise to the dialog element. Unavailable elements, including ones hidden by CSS or disabled by a fieldset, shall be skipped. `initialFocus="dialog"` focuses the dialog element.

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-focus.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-3.2 - Containment

While the modal is open and topmost, Tab and Shift+Tab shall cycle through its focusable elements, wrapping at either end, and focus moved outside it shall return inside.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-3.3 - Restoration

When the modal closes, focus shall return to the element that was focused when it opened, usually its trigger. Closing a modal opened from another shall return focus inside the one beneath. The opener is read through open shadow roots and frames, and focus returns to it whether the modal floats, is retained or not, so a modal inside a web component (a portal host in its shadow root) returns focus to its trigger there. When the opener has left the page by then, as a menu item does with its menu, focus returns to the control that opened the opener's container (the element whose `aria-controls` names it, such as the menu's button), whatever the presentation. A dialog opened from content that a `LoadingRegion` or `Skeleton` blocks stays usable, with the menus and popups inside it, and when it closes while that content is blocked, focus waits on the region and returns to the opener once blocking ends ([UIC-LOADING-OVERLAY-3.5](LOADING-OVERLAY.md#uic-loading-overlay-35---overlays-opened-from-the-content)).

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-surface.tsx`, `src/utils/focus-target.ts`
Verification: `src/components/dialog/dialog.test.tsx`, `src/components/dialog/dialog-shadow.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-3.4 - Chosen focus targets

`initialFocus` given a ref or a function returning an element shall focus that element on open, ahead of an `autoFocus` element, and fall back to `first` when it names no element in the document or the browser refuses to focus it. `finalFocus`, a ref or a function asked at that moment, shall receive focus when the dialog leaves the page instead of the element focused when it opened, provided focus was still inside the dialog or on the body. The element focused when it opened is found through same-origin frames, so a dialog opened from a control inside a frame returns focus to that control, not to the frame element. It is read from the document of the dialog's portal container (UIC-PORTAL-1.7), so a dialog rendered into a popup window or frame returns focus to the control focused there, not to whatever the opener window last focused.

Implementation: `src/components/dialog/dialog-focus.tsx`, `src/components/dialog/dialog-surface.tsx`, `src/utils/focus-target.ts`, `src/utils/tabbable.ts`
Verification: `src/components/dialog/dialog-focus.test.tsx`, `src/utils/focus-target.test.ts`, `e2e/dialog.spec.ts`

## UIC-DIALOG-4 - Header and body

### UIC-DIALOG-4.1 - Title and description

`title` shall render as the dialog's level-2 heading and name the dialog, unless `aria-label` names it instead. `description`, when given, shall render under the title and describe the dialog through `aria-describedby`; without it the caller's `aria-describedby` applies. `role="alertdialog"` marks a decision that interrupts the reader.

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-header.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-4.2 - Header actions and close button

`headerActions` shall render at the end of the header row, after the title, without changing the dialog's name. `showCloseButton` shall add a close button named by the provider's `close` string that closes the modal like Escape.

Implementation: `src/components/dialog/dialog-header.tsx`
Verification: `src/components/dialog/dialog.test.tsx`

### UIC-DIALOG-4.3 - Body

The children shall render in the body. Children given as a function receive `close`, which closes the modal, and `runPrimaryAction` ([UIC-DIALOG-6.3](#uic-dialog-63---primary-action-from-the-content)). The body publishes the title's heading level (2) to its content, so automatic headings in it, such as a `SectionHeader`, `Card` or `Disclosure` title, start at level 3 wherever the dialog was opened ([UIC-SECTION-HEADER-2.1](SECTION-HEADER.md#uic-section-header-21---automatic-heading-levels)).

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`

### UIC-DIALOG-4.4 - Composed parts

Without a built-in header, children shall render as the dialog's composition. `DialogHeader` and `DialogFooter` group their children, and `DialogTitle` names the dialog through a level-2 heading. `DialogDescription` describes it through `aria-describedby` and may have a caller-supplied id. `DialogBody` gives its content the body slot and heading level described in [UIC-DIALOG-4.3](#uic-dialog-43---body). `DialogClose` is a button that closes the dialog and restores focus. It is disabled when the dialog refuses dismissal.

Implementation: `src/components/dialog/dialog-parts.tsx`, `src/components/dialog/dialog-surface.tsx`
Verification: `src/components/dialog/dialog-parts.test.tsx`, `e2e/dialog.spec.ts`

## UIC-DIALOG-5 - Footer

### UIC-DIALOG-5.1 - Built-in action bar

The footer shall draw, in order, Cancel, the `secondaryAction` and the `primaryAction`, so the primary action is rightmost, all as [Buttons](BUTTON.md) of size `md`. Cancel shall show by default when there is a primary or secondary action, show alone when `cancelAction` is given, and hide when `cancelAction` is `null`; it is labelled by `cancelAction.label` or the provider's `cancel` string and closes the modal. The primary action's variant defaults to `primary`, or `destructive` for tone `danger`; the secondary action's to `secondary`; an action's `variant` overrides its default. Each action forwards its `id`, `data-*` attributes, `autoFocus` and `focusableWhenDisabled` to its button, and appends its `className` after the button's hook classes. `actions` shall replace the built-in buttons with the caller's own, and `footerContent` shall render at the start of the footer.

Implementation: `src/components/dialog/dialog-footer.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-5.2 - Action lifecycle

Pressing an action shall call its `onPress` with `close`, which closes this opening of the modal. When `onPress` returns a promise, its button shall be pending ([Action Button](BUTTON.md)'s lifecycle: spinner named by `pendingLabel`, `data-pending`, repeat presses refused, even before the pending state renders) until it settles, the other action shall be disabled meanwhile (a focused one stays focusable, refusing presses, so the focus is not lost), and Cancel shall stay available. An action with `isDisabled` never runs; `isPending` holds it pending from outside.

Implementation: `src/components/dialog/dialog-footer.tsx`, `src/components/dialog/use-dialog-actions.ts`
Verification: `src/components/dialog/dialog.test.tsx`, `src/components/dialog/dialog-running-focus.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-5.3 - Failed actions

When an action's promise rejects, the modal shall stay open, the button shall return to idle, and the footer shall announce the error's message, or the provider's `actionFailed` string when it has none, as an alert. The next attempt clears it.

Implementation: `src/components/dialog/use-dialog-actions.ts`, `src/components/dialog/dialog-footer.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-5.4 - Separate openings

Closing the modal shall clear its pending state and its failure. An action from an earlier opening that settles later shall not announce an error, release the pending state or close a later opening.

Implementation: `src/components/dialog/use-dialog-actions.ts`
Verification: `src/components/dialog/dialog.test.tsx`

### UIC-DIALOG-5.5 - Footer message

The footer shall show one message: `error`, else an action's failure, as an alert (`role="alert"`, `data-tone="danger"`), else `status` as a polite status (`role="status"`, `data-tone="neutral"`). Switching between the two shall insert a fresh element, so the new role is announced.

Implementation: `src/components/dialog/dialog-footer.tsx`
Verification: `src/components/dialog/dialog.test.tsx`

## UIC-DIALOG-6 - Keyboard primary action

### UIC-DIALOG-6.1 - Control+Enter

Enter with exactly one of Control or Command and no other modifier, pressed anywhere in the modal's content (including a popover opened from it), shall run the primary action through the same lifecycle as a press. It shall do nothing while the primary action is disabled or pending, for plain Enter, for a repeated key or text composition, for a key press already handled, from a multiline editor (a `textarea`, an editable element or a multiline textbox) and when `actions` replaces the built-in buttons. A modal opened from another handles its own key presses. `isDialogPrimaryShortcut` exposes the key test.

A focused library Button inside the dialog, including Cancel, the close button and secondary actions, shall leave modified Enter to the dialog instead of activating its own press. The button's caller `onKeyDown` shall run exactly once and may prevent the shortcut, as may a content ancestor's handler. The dialog shall still refuse the focused button's native Enter activation when the primary is disabled, pending or otherwise excluded. Unmodified Enter and Space keep their ordinary button behavior. This handling shall apply only inside the dialog's primary-key boundary; buttons elsewhere remain unchanged.

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-surface.tsx`, `src/components/dialog/dialog-shortcut.ts`, `src/components/button/button-primary-keys.tsx`, `src/utils/primary-action-keys.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `src/components/dialog/dialog-focused-shortcuts.test.tsx`, `src/components/dialog/dialog-consumed-escape.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-6.2 - Caller keys

`onKeyDown` shall receive each key press inside the dialog that the dialog does not handle itself (Escape, and a Control+Enter that runs the primary action), so a dialog's content can add its own shortcuts.

Implementation: `src/components/dialog/dialog-surface.tsx`, `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`

### UIC-DIALOG-6.3 - Primary action from the content

`runPrimaryAction`, given to children that are a function, shall run the primary action through the same lifecycle as a press: its button pending until a returned promise settles, a repeat refused even before the pending state renders, and a rejection announced as a failure. It shall do nothing whenever Control+Enter would not run the action: while it is disabled or pending, while another action runs, and when `actions` replaces the built-in buttons. A dialog whose field saves on Enter calls it, so one key press runs the action once.

Implementation: `src/components/dialog/dialog-surface.tsx`, `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`, `e2e/dialog.spec.ts`

## UIC-DIALOG-7 - Hooks

### UIC-DIALOG-7.1 - Hooks and caller attributes

`Dialog` shall carry the hooks below, append the caller's `className` to the overlay, forward caller `data-*` attributes to the overlay and `id` to the dialog element, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog.test.tsx`

## UIC-DIALOG-8 - Presentations

### UIC-DIALOG-8.1 - Non-modal dialog

With `isNonModal`, the dialog shall float over a page it does not block: the overlay (fixed, zero inset, on the `modal` layer, publishing `data-non-modal`) lets pointer presses through to the page around the panel (`pointer-events` set inline on both), the page stays visible to assistive technology and reachable by Tab, and outside presses never close it. Focus moves into the dialog on open as in a modal; Escape pressed inside closes it, with the same settings and veto; when it closes, focus returns to the element focused when it opened (or `finalFocus`) only if focus was still inside the dialog or on the body. It follows `isOpen`, `defaultOpen` or an enclosing `DialogTrigger` like a modal, and publishes `data-entering` and `data-exiting` on the overlay and panel while the panel's animations run. It renders through a top-layer portal and its panel joins React Aria's focus scopes (without containing or restoring focus), so a non-modal dialog opened while a blocking overlay is open, such as from a modal's body, stays reachable by focus and pointer and visible to assistive technology, and Escape inside it closes it alone.

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-presentations.tsx`, `src/components/dialog/dialog-surface.tsx`
Verification: `src/components/dialog/dialog-presentations.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-8.2 - Anchored dialog

With `placement` (a `Placement`), the dialog shall open inside a `DialogTrigger` as a popover against the trigger at that placement, `POPOVER_OFFSET` (8 pixels) away and kept `DEFAULT_OVERLAY_GUTTER` (8 pixels) inside the viewport, instead of over the page. The popover carries the overlay's hooks (`ui-dialog`, `data-layer="dropdown"` with that layer's z-index, tone, size and body layout) with React Aria's `data-placement`, `data-trigger`, `data-entering` and `data-exiting`, and holds the dialog directly, with no panel. The dialog element takes `role="dialog"`, which React Aria's popover needs to stay a plain container. React Aria's popover traps focus, hides the page from assistive technology and returns focus to the trigger; Escape, Cancel and the actions behave as in a modal, and outside presses follow [UIC-DIALOG-2.2](#uic-dialog-22---outside-presses). `placement` takes precedence over `isNonModal`. The popover is the [Popover](POPOVER.md)'s floating panel.

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-presentations.tsx`, `src/components/popover/popover.tsx`
Verification: `src/components/dialog/dialog-presentations.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-8.3 - Sheet

`Sheet` shall use the blocking dialog behavior, including the same trigger, parts, focus trapping and restoration, and dismissal. Its overlay publishes `data-side` for `top`, `right` (the default), `bottom` or `left`. The reference stylesheet places the panel flush with that viewport edge. Gesture interaction belongs to [Drawer](DRAWER.md).

Implementation: `src/components/dialog/dialog.tsx`, `labs/reference/dialog.css`
Verification: `src/components/dialog/dialog-parts.test.tsx`, `e2e/dialog.spec.ts`

## UIC-DIALOG-9 - Retention

### UIC-DIALOG-9.1 - Retained body

With `keepMounted`, a blocking or non-modal dialog shall stay mounted once it has opened: closing it keeps the dialog, its body and every component in it as the same React instances, so local state, drafts, element refs and editors survive until it opens again. Before its first opening it renders nothing, and without `keepMounted` closing unmounts the dialog as before. An anchored dialog (`placement`) ignores `keepMounted`.

Implementation: `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-retained.tsx`, `src/components/dialog/dialog-presentations.tsx`
Verification: `src/components/dialog/dialog-retained.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-9.2 - A closed retained dialog

While closed, a retained dialog shall be no open modal: its overlay carries `inert` and the functional inline styles `visibility: hidden` and `pointer-events: none`, so it is out of the accessibility tree, the tab order and the way of pointers whatever the host stylesheet's display, and, fixed over the viewport, reserves no layout space. It keeps no focus trap, scroll lock or hidden page, and takes no part in Escape or outside presses.

Implementation: `src/components/dialog/dialog-presentations.tsx`, `src/components/dialog/dialog-retained.tsx`
Verification: `src/components/dialog/dialog-retained.test.tsx`, `e2e/dialog.spec.ts`

### UIC-DIALOG-9.3 - Each opening

Each opening of a retained dialog shall move focus in as a first opening does ([UIC-DIALOG-3.1](#uic-dialog-31---initial-focus)), contain it while open, and on each close return it to `finalFocus` or the element focused when it opened, once per transition, when its exit has ended: until then the leaving dialog keeps focus and is not inert, so focus never falls to the body while it animates out; it turns inert once the exit ends, and call `onExitComplete` once, however many times it opens and closes. Its footer actions start each opening afresh ([UIC-DIALOG-5.4](#uic-dialog-54---separate-openings)).

Implementation: `src/components/dialog/dialog-surface.tsx`, `src/components/dialog/dialog-presentations.tsx`, `src/utils/focus-target.ts`
Verification: `src/components/dialog/dialog-retained.test.tsx`

### UIC-DIALOG-9.4 - Other modals

While a retained dialog is closed, other modals shall open, contain focus, lock scrolling, hide the page and close on Escape or outside presses as they would without it; a reopened retained dialog does the same as the topmost modal.

Implementation: `src/components/dialog/dialog-presentations.tsx`
Verification: `src/components/dialog/dialog-retained.test.tsx`

### UIC-DIALOG-9.5 - Control and teardown

A retained dialog shall follow `isOpen`, `defaultOpen` or its `DialogTrigger` as any dialog does. Removing the `Dialog` unmounts the retained body once, releasing its refs once.

Implementation: `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog-retained.test.tsx`

## UIC-DIALOG-21 - Decision

### UIC-DIALOG-21.1 - Structure

`AlertDialog` shall render the dialog parts with `role="alertdialog"` and ignore outside presses by default. `AlertDialogConfirmation` shall use it for a decision named by `title`, whose body shows `message` in the `ui-dialog__message` slot, describing the dialog, followed by any children. Its footer holds Cancel, labelled by `cancelLabel` or the provider's `cancel` string, and the confirm action, labelled by `confirmLabel` or the provider's `confirm` string.

Implementation: `src/components/dialog/dialog-confirm.tsx`, `src/components/dialog/dialog.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`, `src/components/dialog/dialog-parts.test.tsx`, `e2e/dialog-confirmation.spec.ts`, `e2e/dialog.spec.ts`

### UIC-DIALOG-21.2 - Outcomes

Confirming shall run `onConfirm` and then close the dialog without calling `onCancel`. When `onConfirm` returns a promise the confirm action is pending until it settles; a rejection keeps the dialog open with the error in its footer ([UIC-DIALOG-5.3](DIALOG.md#uic-dialog-53---failed-actions)). Cancel and Escape shall close it and call `onCancel` once, including when a `DialogTrigger` holds the open state. With `isDismissable`, an outside press does the same once any pending action settles. Every close the dialog makes reports `onOpenChange(false)`.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`, `e2e/dialog-confirmation.spec.ts`

### UIC-DIALOG-21.3 - Safe focus

When the dialog opens, focus shall land on Cancel, the safe choice, or on the confirm action with `autoFocusConfirm`. When it closes, focus returns to the element focused when it opened.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`, `e2e/dialog-confirmation.spec.ts`

### UIC-DIALOG-21.4 - Destructive tone

`tone="danger"` shall mark a destructive or irreversible decision: the modal publishes `data-tone="danger"` and the confirm action uses the `destructive` button variant. The default is `neutral`.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`, `e2e/dialog-confirmation.spec.ts`

### UIC-DIALOG-21.5 - Text messages

A message given as a string shall render as text: markup in it is shown, never interpreted.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`

### UIC-DIALOG-21.6 - Third action

`secondaryActionLabel` shall add a third action between Cancel and the confirm action (the modal's secondary action, `ui-dialog__secondary`), for a choice such as "Don't save" beside Cancel and Save. Pressing it shall run `onSecondaryAction` through the same lifecycle as the confirm action (pending while a returned promise runs, open with the error when it rejects) and then close the dialog without calling `onCancel` or `onConfirm`.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`, `e2e/dialog-confirmation.spec.ts`

### UIC-DIALOG-21.7 - News tones and icon

`tone` shall also take `info`, `success` and `warning`, published in the modal's `data-tone`, for a dialog that brings news. The title shall start with a decorative icon (`ui-dialog__confirmation-icon`, also `ui-icon`) inside the heading: by default the `info`, `success` or `warning` glyph for those tones and none for `neutral` and `danger`; `icon`, an imported icon component or rendered element, replaces it (`icon={ErrorGlyph}` with `tone="danger"` marks an error), and `icon={null}` leaves it out. The icon does not change the dialog's name.

Implementation: `src/components/dialog/dialog-confirm.tsx`, `labs/reference/dialog.css`
Verification: `src/components/dialog/dialog-confirm.test.tsx`, `e2e/dialog-confirmation.spec.ts`

### UIC-DIALOG-21.8 - Acknowledgement

`cancelLabel={null}` shall leave Cancel out, for a dialog that only needs acknowledging; focus then starts on the confirm action. Escape closes it and calls `onCancel`. Outside presses do the same only when enabled.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`

### UIC-DIALOG-21.9 - Anchored confirmation

With `placement`, inside a React Aria `DialogTrigger`, the confirmation shall open as a popover against its trigger ([UIC-DIALOG-8.2](DIALOG.md#uic-dialog-82---anchored-dialog)) instead of over the page, for a quick decision next to the control that asked for it. Its dialog takes `role="dialog"`; focus starts on Cancel and returns to the trigger, and the outcomes are those of the modal confirmation.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`, `e2e/dialog-confirmation.spec.ts`

## UIC-DIALOG-22 - Imperative confirmation

### UIC-DIALOG-22.1 - Awaiting an answer

`confirm(controller, options)` shall open a `Dialog` with `options` through `controller` and return a promise that resolves `true` once the reader confirms and `onConfirm` (if any) succeeds, and `false` when the dialog closes any other way (Cancel, the third action after `onSecondaryAction`, Escape, an outside press, the controller's `closeAll`). The promise settles exactly once and the dialog leaves the controller when it closes.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`, `e2e/dialog-confirmation.spec.ts`

### UIC-DIALOG-22.2 - Alert

`alert(controller, options)` shall open, through `controller`, a `Dialog` with `options` (tone `info` by default) and no Cancel, whose one action is labelled by `confirmLabel` or the provider's `ok` string and has focus, and return a promise that resolves once the dialog closes, by that action (after `onConfirm`, if any, succeeds), Escape, an outside press or `closeAll`.

Implementation: `src/components/dialog/dialog-prompts.tsx`, `src/core/strings/common.ts`
Verification: `src/components/dialog/dialog-prompts.test.tsx`, `e2e/dialog-confirmation.spec.ts`

### UIC-DIALOG-22.3 - Prompt

`prompt(controller, options)` shall open, through `controller`, a `Dialog` titled `title`, described by `message`, holding a [Text Field](TEXT-FIELD.md) named by `label` that starts with `defaultValue` and has focus, with Cancel (`cancelLabel`) and a primary action labelled by `confirmLabel` or the provider's `ok` string. It returns a promise that resolves to the field's text when the reader presses the action, presses Enter in the field or Control+Enter, and to `null` when the dialog closes any other way. An Enter during a text composition, or the one that confirms an input method candidate (key code 229), belongs to the input method and answers nothing. The promise settles once and the dialog leaves the controller.

Implementation: `src/components/dialog/dialog-prompts.tsx`
Verification: `src/components/dialog/dialog-prompts.test.tsx`, `e2e/dialog-confirmation.spec.ts`

## UIC-DIALOG-23 - Hooks

### UIC-DIALOG-23.1 - Hooks and caller attributes

The Dialog confirmation helper shall carry the hooks below on top of the modal's, append the caller's `className`, forward caller `data-*` attributes to the overlay and `id` to the dialog element.

Implementation: `src/components/dialog/dialog-confirm.tsx`
Verification: `src/components/dialog/dialog-confirm.test.tsx`

## Dialog Controller

`createDialogController` creates an imperative store of open modals, for code that opens a modal from outside a render tree or without owning its open state: an event handler deep in a tool, a keyboard command, a non-React module. The host creates a controller, renders `DialogHost` with it once, and hands the controller to whatever opens modals. Each opening returns a handle to close or update it and a promise of its result. The library keeps no controller of its own; every controller is an instance its host creates. Each modal is a [Dialog](DIALOG.md), or any modal the caller draws. [Confirm Dialog](DIALOG.md#uic-dialog-22---imperative-confirmation) builds awaitable helpers on it: `confirm` for a yes-or-no answer, `alert` for an acknowledgement and `prompt` for a line of text.

## UIC-DIALOG-24 - Controller

### UIC-DIALOG-24.1 - Instances

`createDialogController` shall return a new, independent controller each time. Controllers share no state, and the library creates none at module load.

Implementation: `src/components/dialog/dialog-controller.ts`
Verification: `src/components/dialog/dialog-controller.test.tsx`

### UIC-DIALOG-24.2 - Opening

`open(options)` shall add a modal above every open one and return its handle, with an `id` unique within the controller and `isOpen` true. With modal options, the entry renders a `Dialog` with those props and `content` as its body; `content` given as a function receives the handle. With `render`, the entry calls it with `isOpen`, `onOpenChange`, `close` and the handle, and renders what it returns, so a caller can open a modal of its own (for example a [Confirm Dialog](DIALOG.md)).

Implementation: `src/components/dialog/dialog-controller.ts`
Verification: `src/components/dialog/dialog-controller.test.tsx`, `e2e/dialog-controller.spec.ts`

### UIC-DIALOG-24.3 - Closing and results

`handle.close(value)` shall close the modal and settle `handle.result` with `value`. Dismissing the modal (Escape, an outside press, Cancel, the close button) shall close it and settle the result with `undefined`. The result settles exactly once: later calls to `close` do nothing. `closeAll()` dismisses every open modal, topmost first.

Implementation: `src/components/dialog/dialog-controller.ts`
Verification: `src/components/dialog/dialog-controller.test.tsx`, `e2e/dialog-controller.spec.ts`

### UIC-DIALOG-24.4 - Updates

`handle.update(options)` shall merge the options into the open modal, which re-renders with them (a new title, footer state, content or `render`). It does nothing after the modal closes.

Implementation: `src/components/dialog/dialog-controller.ts`
Verification: `src/components/dialog/dialog-controller.test.tsx`, `e2e/dialog-controller.spec.ts`

### UIC-DIALOG-24.5 - Subscription

`getSnapshot()` shall return the open modals oldest first, as a new array after every change and the same array otherwise, and `subscribe(listener)` shall call the listener after every change until the returned function unsubscribes it, so a host can render the list with `useSyncExternalStore`.

Implementation: `src/components/dialog/dialog-controller.ts`
Verification: `src/components/dialog/dialog-controller.test.tsx`

## UIC-DIALOG-25 - Host

### UIC-DIALOG-25.1 - Rendering

`DialogHost` shall render every open modal of its controller, oldest first. Dialogs opened before it mounts shall appear when it mounts, in opening order, and closed modals shall leave.

Implementation: `src/components/dialog/dialog-host.tsx`
Verification: `src/components/dialog/dialog-controller.test.tsx`, `e2e/dialog-controller.spec.ts`

### UIC-DIALOG-25.2 - Stacking and focus

The most recently opened modal shall stack on top and alone respond to Escape and outside presses, while the modals beneath stay mounted with their state. Each blocking modal publishes its place among the open blocking modals of its document in `data-stack-index` on its overlay (0 for the lowest, in opening order, kept while it leaves), as drawers do ([DRAWER.md](DRAWER.md)), so the stylesheet dims and blurs the page once: the reference stylesheet blurs the page behind a modal's scrim (`--ref-scrim-blur`, as a drawer's backdrop), and a modal over another takes the weaker scrim (`--ref-scrim-weak`) without a further blur. Closing the topmost shall return focus into the modal beneath it, and closing the last shall return focus to the element focused when it opened.

Implementation: `src/components/dialog/dialog-host.tsx`, `src/components/dialog/dialog.tsx`, `src/components/dialog/dialog-stack.ts`, `labs/reference/dialog.css`
Verification: `src/components/dialog/dialog-controller.test.tsx`, `e2e/dialog-controller.spec.ts`

### UIC-DIALOG-25.3 - Another controller

Given another controller, `DialogHost` shall drop the modals it showed and show the new controller's afresh, including the one-at-a-time mounting of UIC-DIALOG-25.1: modal IDs are unique within a controller only, so a modal of the new controller never takes the draft, pending action, error or focus of the old controller's modal with the same ID, and the old controller's later actions and updates change nothing shown. Updates from the same controller keep each modal's state.

Implementation: `src/components/dialog/dialog-host.tsx`
Verification: `src/components/dialog/dialog-host-replace.test.tsx`, `e2e/dialog-controller.spec.ts`

### UIC-DIALOG-25.4 - Closing with an exit

A modal the controller closes (by its handle, Cancel, Escape, an outside press, an action's `close` or `closeAll`) shall leave the controller's list and settle its `result` at once, while `DialogHost` keeps it on the page, closed, until its exit ends: the `Dialog` runs its exit and calls the entry's `onExitComplete` once, and focus returns as when a `Dialog` closes. A host unmounted while the modal is open tears it down without an exit or `onExitComplete`. A modal drawn by `render` leaves the page as soon as it closes.

Implementation: `src/components/dialog/dialog-host.tsx`
Verification: `src/components/dialog/dialog-host-exit.test.tsx`, `e2e/dialog-controller.spec.ts`

## Markup

`DialogHost` renders no element of its own: each open modal carries the hooks of [Dialog](DIALOG.md), or of the modal its `render` draws.

## Hooks

| Hook                           | Kind      | Values / Meaning                                  |
| ------------------------------ | --------- | ------------------------------------------------- |
| `ui-dialog`                    | root      | `dialog-overlay`                                  | The overlay covering the viewport, or an anchored dialog's popover.       |
| `ui-dialog__panel`             | slot      | `dialog-content`                                  | The box holding the dialog.                                               |
| `ui-dialog__dialog`            | slot      | `dialog`                                          | The `role="dialog"` element.                                              |
| `ui-dialog__header`            | slot      | `dialog-header`                                   | The header row.                                                           |
| `ui-dialog__heading`           | slot      |                                                   | Groups the title and description.                                         |
| `ui-dialog__title`             | slot      | `dialog-title`                                    | The `<h2>` title.                                                         |
| `ui-dialog__description`       | slot      | `dialog-description`                              | The description under the title.                                          |
| `ui-dialog__header-actions`    | slot      |                                                   | Caller content at the end of the header.                                  |
| `ui-dialog__close`             | slot      | `dialog-close`                                    | The close button (also `ui-button`).                                      |
| `ui-dialog__body`              | slot      |                                                   | The body.                                                                 |
| `ui-dialog__footer`            | slot      | `dialog-footer`                                   | The footer.                                                               |
| `ui-dialog__footer-content`    | slot      |                                                   | Caller content at the start of the footer.                                |
| `ui-dialog__message`           | slot      |                                                   | The footer status or error message.                                       |
| `ui-dialog__actions`           | slot      |                                                   | The action bar.                                                           |
| `ui-dialog__cancel`            | slot      |                                                   | The Cancel button (also `ui-button`).                                     |
| `ui-dialog__secondary`         | slot      |                                                   | The secondary action (also `ui-button`).                                  |
| `ui-dialog__primary`           | slot      |                                                   | The primary action (also `ui-button`).                                    |
| `data-layer`                   | attribute | `modal`, `dropdown`                               | The overlay layer (`dropdown` when anchored); z-index set inline.         |
| `data-tone`                    | attribute | `neutral`, `info`, `success`, `warning`, `danger` | On the overlay, emphasis; on the message, `danger` for an error.          |
| `data-size`                    | attribute | `sm`, `md`, `lg`, `xl`, `full`                    | Dialog width.                                                             |
| `data-side`                    | attribute | `top`, `right`, `bottom`, `left`                  | The viewport edge that holds a sheet.                                     |
| `data-body-layout`             | attribute | `block`, `column`                                 | Body layout.                                                              |
| `data-entering`                | state     | `true`                                            | On the overlay and panel while an entry animation runs (React Aria).      |
| `data-exiting`                 | state     | `true`                                            | On the overlay and panel while an exit animation runs (React Aria).       |
| `data-non-modal`               | state     | `true`                                            | On the overlay of a dialog that does not block the page.                  |
| `data-stack-index`             | state     | `0`, `1`, …                                       | On a blocking dialog's overlay, its place among open ones, from 0.        |
| `data-placement`               | state     | `top`, `bottom`, `left`, `right`, `center`        | On an anchored dialog, the side of the trigger it opened on (React Aria). |
| `data-trigger`                 | state     | `DialogTrigger`                                   | On an anchored dialog, what opened it (React Aria).                       |
| `ui-dialog__confirmation-icon` | slot      |                                                   | The decorative icon leading the title (also `ui-icon`).                   |
