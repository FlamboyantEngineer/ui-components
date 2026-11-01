# Modal

`Modal` is a blocking dialog: a task or decision the reader finishes or cancels before returning to the page beneath. It has a title, an optional description, a body and a footer whose built-in action bar holds Cancel, an optional secondary action and the primary action. It is built on React Aria's `ModalOverlay`, `Modal`, `Dialog` and `Heading`, which provide the focus trap, Escape, outside presses, hiding the page from assistive technology and focus restoration. The same dialog can also float over the page without blocking it, or open as a popover against its trigger (React Aria `Popover`). Imperative callers open modals through [Modal Controller](MODAL-CONTROLLER.md); yes-or-no decisions use [Confirm Dialog](MODAL.md).

## UIC-MODAL-1 - Overlay

### UIC-MODAL-1.1 - Opening and closing

`Modal` shall be open while `isOpen` is true (or, uncontrolled, from `defaultOpen`), report every close through `onOpenChange(false)`, and render nothing while closed (unless retained, [UIC-MODAL-9.1](#uic-modal-91---retained-body)). Inside a `ModalTrigger` ([UIC-MODAL-1.6](#uic-modal-16---trigger)) or a React Aria `DialogTrigger`, with neither `isOpen` nor `defaultOpen`, it shall follow the trigger's open state: the trigger's `onOpenChange` reports every change, and the modal's own `onOpenChange` reports the closes the modal makes (Cancel, the close button, Escape, an outside press, an action), so a confirmation can tell a cancel inside a trigger. While open it renders, in an overlay at the end of the document body, the `ui-modal` overlay, the `ui-modal__panel` box and the `ui-modal__dialog` element with `role="dialog"`.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-1.2 - Layering

The overlay shall cover the viewport (fixed position, zero inset) and carry the z-index of the `modal` overlay layer ([UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)) as a functional inline style, with `data-layer="modal"`. A `layerZIndex` from `PortalContainerProvider` or `PortalHost` above it applies. Every presentation renders into the overlay container they choose ([UIC-PORTAL-1.2](PORTAL.md#uic-portal-12---choosing-the-container)), the document body by default; floating and retained dialogs render through a `Portal` on the `modal` layer, so they render nothing on the server and until hydrated. A modal opened while another is open shall stack above it, and content on the `dropdown`, `context-menu`, `tooltip` and `toast` layers shall stack above every modal.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-1.3 - Blocking the page

While a modal is open, the content outside it shall be hidden from assistive technology and unreachable by focus, and pointer presses outside the dialog shall land on the overlay rather than on the page beneath.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-1.4 - Tones, sizes and body layout

The overlay shall publish `data-tone` (`neutral`, the default, `danger` for a destructive decision, or `info`, `success` or `warning` for the kind of news the dialog brings), `data-size` (`sm`, `md`, the default, `lg`, `xl`, or `full` for a dialog that fills the viewport) and `data-body-layout` (`block`, the default, or `column`, which lays the body out as a vertical stack so one child can take the remaining height). The host stylesheet maps them to widths and layouts; the reference sheet uses 400, 560, 800, 1120 pixels and the viewport less 16 pixels per side.

Implementation: `src/components/modal/modal.tsx`, `labs/reference/modal.css`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-1.5 - Exit complete

`onExitComplete` shall be called once each time the dialog has closed and left the page, after its exit animation has ended (at once without one), in every presentation. It is not called when the component is removed while the dialog is open.

Implementation: `src/components/modal/modal-dialog.tsx`
Verification: `src/components/modal/modal.test.tsx`, `src/components/modal/modal-presentations.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-1.6 - Trigger

`ModalTrigger` shall hold one pressable trigger, such as a `Button`, and a `Modal`, and add no element of its own: pressing the trigger opens the modal, which follows the trigger's open state, and closing it returns focus to the trigger. `isOpen` with `onOpenChange` on the trigger controls it, `defaultOpen` opens it at first, and `onOpenChange` reports each change the reader asks for.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`, `src/components/modal/modal-presentations.test.tsx`

### UIC-MODAL-1.7 - Tall content

The panel shall stay within the overlay, less its padding, whatever the height of the body: the header with its close button and the footer with its actions stay on screen, and the body scrolls inside the panel. The reference stylesheet sizes the overlay's single grid track to the padded viewport so the panel's height limit resolves against it, at every size and in both themes.

The frame shall stay in place while the reader works in a tall body: focusing a field or a restore button, expanding content or resizing the viewport scrolls the body, never the overlay. The reference stylesheet makes the body the containing block of what it positions (such as the visually hidden inputs of checkboxes), so nothing in a tall body gives the overlay scroll room; the overlay keeps its own scrolling for a viewport too short for the header and footer.

Implementation: `labs/reference/modal.css`
Verification: `e2e/modal.spec.ts`, `e2e/modal-tall-form.spec.ts`

## UIC-MODAL-2 - Dismissal

### UIC-MODAL-2.1 - Escape

Escape pressed inside the modal shall close it, unless `isKeyboardDismissDisabled` is set. A component inside the modal that handles Escape itself (an open list, an editor), by stopping it or by calling `preventDefault`, shall keep it, leaving the modal open in every presentation (blocking, floating or anchored) without asking `shouldCloseOnEscape`; the next Escape it leaves alone closes the modal. With modals stacked, Escape shall close only the topmost. An Escape pressed while composing text belongs to the input method and closes nothing.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-2.2 - Outside presses

With `isDismissable`, a press that starts and ends outside the dialog shall close the modal. A press that starts inside the dialog and ends outside it shall not. Without `isDismissable` (the default), outside presses do nothing. With modals stacked, only the topmost responds.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-2.3 - Refusing dismissal

`isDismissDisabled` shall refuse every way of dismissing the modal at once: it disables Cancel and the close button and ignores Escape and outside presses, for an operation that cannot be cancelled. The actions can still close it.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`

### UIC-MODAL-2.4 - Vetoing a dismissal

`shouldCloseOnEscape()` shall be asked each time Escape would close the dialog, and `shouldCloseOnInteractOutside(element)` each time an outside press would close a dismissable one, with the element pressed; when either returns false the dialog stays open and the press or key goes no further, so a host can keep unsaved work and ask first. Neither is asked while that dismissal is refused anyway.

Implementation: `src/components/modal/modal.tsx`, `src/components/modal/modal-dialog.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

## UIC-MODAL-3 - Focus

### UIC-MODAL-3.1 - Initial focus

When the modal opens, focus shall move to the element inside it that has `autoFocus` (including a footer action with `autoFocus`); otherwise, with `initialFocus="first"` (the default), to the first focusable element of the body, then of the footer, then of the header; otherwise to the dialog element. Unavailable elements, including ones hidden by CSS or disabled by a fieldset, shall be skipped. `initialFocus="dialog"` focuses the dialog element.

Implementation: `src/components/modal/modal.tsx`, `src/components/modal/modal-focus.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-3.2 - Containment

While the modal is open and topmost, Tab and Shift+Tab shall cycle through its focusable elements, wrapping at either end, and focus moved outside it shall return inside.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-3.3 - Restoration

When the modal closes, focus shall return to the element that was focused when it opened, usually its trigger. Closing a modal opened from another shall return focus inside the one beneath. The opener is read through open shadow roots and frames, and focus returns to it whether the modal floats, is retained or not, so a modal inside a web component (a portal host in its shadow root) returns focus to its trigger there.

Implementation: `src/components/modal/modal.tsx`, `src/components/modal/modal-dialog.tsx`, `src/utils/focus-target.ts`
Verification: `src/components/modal/modal.test.tsx`, `src/components/modal/modal-shadow.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-3.4 - Chosen focus targets

`initialFocus` given a ref or a function returning an element shall focus that element on open, ahead of an `autoFocus` element, and fall back to `first` when it names no element in the document or the browser refuses to focus it. `finalFocus`, a ref or a function asked at that moment, shall receive focus when the dialog leaves the page instead of the element focused when it opened, provided focus was still inside the dialog or on the body. The element focused when it opened is found through same-origin frames, so a dialog opened from a control inside a frame returns focus to that control, not to the frame element. It is read from the document of the dialog's portal container (UIC-PORTAL-1.7), so a dialog rendered into a popup window or frame returns focus to the control focused there, not to whatever the opener window last focused.

Implementation: `src/components/modal/modal-focus.tsx`, `src/components/modal/modal-dialog.tsx`, `src/utils/focus-target.ts`, `src/utils/tabbable.ts`
Verification: `src/components/modal/modal-focus.test.tsx`, `src/utils/focus-target.test.ts`, `e2e/modal.spec.ts`

## UIC-MODAL-4 - Header and body

### UIC-MODAL-4.1 - Title and description

`title` shall render as the dialog's level-2 heading and name the dialog, unless `aria-label` names it instead. `description`, when given, shall render under the title and describe the dialog through `aria-describedby`; without it the caller's `aria-describedby` applies. `role="alertdialog"` marks a decision that interrupts the reader.

Implementation: `src/components/modal/modal.tsx`, `src/components/modal/modal-header.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-4.2 - Header actions and close button

`headerActions` shall render at the end of the header row, after the title, without changing the dialog's name. `showCloseButton` shall add a close button named by the provider's `close` string that closes the modal like Escape.

Implementation: `src/components/modal/modal-header.tsx`
Verification: `src/components/modal/modal.test.tsx`

### UIC-MODAL-4.3 - Body

The children shall render in the body. Children given as a function receive `close`, which closes the modal, and `runPrimaryAction` ([UIC-MODAL-6.3](#uic-modal-63---primary-action-from-the-content)).

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`

## UIC-MODAL-5 - Footer

### UIC-MODAL-5.1 - Built-in action bar

The footer shall draw, in order, Cancel, the `secondaryAction` and the `primaryAction`, so the primary action is rightmost, all as [Buttons](BUTTON.md) of size `md`. Cancel shall show by default when there is a primary or secondary action, show alone when `cancelAction` is given, and hide when `cancelAction` is `null`; it is labelled by `cancelAction.label` or the provider's `cancel` string and closes the modal. The primary action's variant defaults to `primary`, or `danger` in a modal of tone `danger`; the secondary action's to `secondary`; an action's `variant` overrides its default. Each action forwards its `id`, `data-*` attributes, `autoFocus` and `focusableWhenDisabled` to its button, and appends its `className` after the button's hook classes. `actions` shall replace the built-in buttons with the caller's own, and `footerContent` shall render at the start of the footer.

Implementation: `src/components/modal/modal-footer.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-5.2 - Action lifecycle

Pressing an action shall call its `onPress` with `close`, which closes this opening of the modal. When `onPress` returns a promise, its button shall be pending ([Action Button](BUTTON.md)'s lifecycle: spinner named by `pendingLabel`, `data-pending`, repeat presses refused, even before the pending state renders) until it settles, the other action shall be disabled meanwhile, and Cancel shall stay available. An action with `isDisabled` never runs; `isPending` holds it pending from outside.

Implementation: `src/components/modal/modal-footer.tsx`, `src/components/modal/use-modal-actions.ts`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-5.3 - Failed actions

When an action's promise rejects, the modal shall stay open, the button shall return to idle, and the footer shall announce the error's message, or the provider's `actionFailed` string when it has none, as an alert. The next attempt clears it.

Implementation: `src/components/modal/use-modal-actions.ts`, `src/components/modal/modal-footer.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-5.4 - Separate openings

Closing the modal shall clear its pending state and its failure. An action from an earlier opening that settles later shall not announce an error, release the pending state or close a later opening.

Implementation: `src/components/modal/use-modal-actions.ts`
Verification: `src/components/modal/modal.test.tsx`

### UIC-MODAL-5.5 - Footer message

The footer shall show one message: `error`, else an action's failure, as an alert (`role="alert"`, `data-tone="danger"`), else `status` as a polite status (`role="status"`, `data-tone="neutral"`). Switching between the two shall insert a fresh element, so the new role is announced.

Implementation: `src/components/modal/modal-footer.tsx`
Verification: `src/components/modal/modal.test.tsx`

## UIC-MODAL-6 - Keyboard primary action

### UIC-MODAL-6.1 - Control+Enter

Enter with exactly one of Control or Command and no other modifier, pressed anywhere in the modal's content (including a popover opened from it), shall run the primary action through the same lifecycle as a press. It shall do nothing while the primary action is disabled or pending, for plain Enter, for a repeated key or text composition, for a key press already handled, from a multiline editor (a `textarea`, an editable element or a multiline textbox) and when `actions` replaces the built-in buttons. A modal opened from another handles its own key presses. `isModalPrimaryShortcut` exposes the key test.

Implementation: `src/components/modal/modal.tsx`, `src/components/modal/modal-shortcut.ts`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-6.2 - Caller keys

`onKeyDown` shall receive each key press inside the dialog that the dialog does not handle itself (Escape, and a Control+Enter that runs the primary action), so a dialog's content can add its own shortcuts.

Implementation: `src/components/modal/modal-dialog.tsx`, `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`

### UIC-MODAL-6.3 - Primary action from the content

`runPrimaryAction`, given to children that are a function, shall run the primary action through the same lifecycle as a press: its button pending until a returned promise settles, a repeat refused even before the pending state renders, and a rejection announced as a failure. It shall do nothing whenever Control+Enter would not run the action: while it is disabled or pending, while another action runs, and when `actions` replaces the built-in buttons. A dialog whose field saves on Enter calls it, so one key press runs the action once.

Implementation: `src/components/modal/modal-dialog.tsx`, `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`, `e2e/modal.spec.ts`

## UIC-MODAL-7 - Hooks

### UIC-MODAL-7.1 - Hooks and caller attributes

`Modal` shall carry the hooks below, append the caller's `className` to the overlay, forward caller `data-*` attributes to the overlay and `id` to the dialog element, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal.test.tsx`

## UIC-MODAL-8 - Presentations

### UIC-MODAL-8.1 - Non-modal dialog

With `isNonModal`, the dialog shall float over a page it does not block: the overlay (fixed, zero inset, on the `modal` layer, publishing `data-non-modal`) lets pointer presses through to the page around the panel (`pointer-events` set inline on both), the page stays visible to assistive technology and reachable by Tab, and outside presses never close it. Focus moves into the dialog on open as in a modal; Escape pressed inside closes it, with the same settings and veto; when it closes, focus returns to the element focused when it opened (or `finalFocus`) only if focus was still inside the dialog or on the body. It follows `isOpen`, `defaultOpen` or an enclosing `ModalTrigger` like a modal, and publishes `data-entering` and `data-exiting` on the overlay and panel while the panel's animations run.

Implementation: `src/components/modal/modal.tsx`, `src/components/modal/modal-presentations.tsx`, `src/components/modal/modal-dialog.tsx`
Verification: `src/components/modal/modal-presentations.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-8.2 - Anchored dialog

With `placement` (a `Placement`), the dialog shall open inside a `ModalTrigger` as a popover against the trigger at that placement, `POPOVER_OFFSET` (8 pixels) away and kept `DEFAULT_OVERLAY_GUTTER` (8 pixels) inside the viewport, instead of over the page. The popover carries the overlay's hooks (`ui-modal`, `data-layer="dropdown"` with that layer's z-index, tone, size and body layout) with React Aria's `data-placement`, `data-trigger`, `data-entering` and `data-exiting`, and holds the dialog directly, with no panel. The dialog element takes `role="dialog"`, which React Aria's popover needs to stay a plain container. React Aria's popover traps focus, hides the page from assistive technology and returns focus to the trigger; Escape, Cancel and the actions behave as in a modal, and an outside press closes it only when `isDismissable`. `placement` takes precedence over `isNonModal`. The popover is the [Popover](POPOVER.md)'s floating panel.

Implementation: `src/components/modal/modal.tsx`, `src/components/modal/modal-presentations.tsx`, `src/components/popover/popover.tsx`
Verification: `src/components/modal/modal-presentations.test.tsx`, `e2e/modal.spec.ts`

## UIC-MODAL-9 - Retention

### UIC-MODAL-9.1 - Retained body

With `keepMounted`, a blocking or non-modal dialog shall stay mounted once it has opened: closing it keeps the dialog, its body and every component in it as the same React instances, so local state, drafts, element refs and editors survive until it opens again. Before its first opening it renders nothing, and without `keepMounted` closing unmounts the dialog as before. An anchored dialog (`placement`) ignores `keepMounted`.

Implementation: `src/components/modal/modal.tsx`, `src/components/modal/modal-retained.tsx`, `src/components/modal/modal-presentations.tsx`
Verification: `src/components/modal/modal-retained.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-9.2 - A closed retained dialog

While closed, a retained dialog shall be no open modal: its overlay carries `inert` and the functional inline styles `visibility: hidden` and `pointer-events: none`, so it is out of the accessibility tree, the tab order and the way of pointers whatever the host stylesheet's display, and, fixed over the viewport, reserves no layout space. It keeps no focus trap, scroll lock or hidden page, and takes no part in Escape or outside presses.

Implementation: `src/components/modal/modal-presentations.tsx`, `src/components/modal/modal-retained.tsx`
Verification: `src/components/modal/modal-retained.test.tsx`, `e2e/modal.spec.ts`

### UIC-MODAL-9.3 - Each opening

Each opening of a retained dialog shall move focus in as a first opening does ([UIC-MODAL-3.1](#uic-modal-31---initial-focus)), contain it while open, and on each close return it to `finalFocus` or the element focused when it opened, once per transition, and call `onExitComplete` once, however many times it opens and closes. Its footer actions start each opening afresh ([UIC-MODAL-5.4](#uic-modal-54---separate-openings)).

Implementation: `src/components/modal/modal-dialog.tsx`, `src/utils/focus-target.ts`
Verification: `src/components/modal/modal-retained.test.tsx`

### UIC-MODAL-9.4 - Other modals

While a retained dialog is closed, other modals shall open, contain focus, lock scrolling, hide the page and close on Escape or outside presses as they would without it; a reopened retained dialog does the same as the topmost modal.

Implementation: `src/components/modal/modal-presentations.tsx`
Verification: `src/components/modal/modal-retained.test.tsx`

### UIC-MODAL-9.5 - Control and teardown

A retained dialog shall follow `isOpen`, `defaultOpen` or its `ModalTrigger` as any dialog does. Removing the `Modal` unmounts the retained body once, releasing its refs once.

Implementation: `src/components/modal/modal.tsx`
Verification: `src/components/modal/modal-retained.test.tsx`

## UIC-MODAL-21 - Decision

### UIC-MODAL-21.1 - Structure

`confirm(controller, options)` shall use a confirmation helper that renders a `Modal` with `role="alertdialog"`, named by `title`, whose body shows `message` in the `ui-modal__message` slot, describing the dialog, followed by any children. Its footer holds Cancel, labelled by `cancelLabel` or the provider's `cancel` string, and the confirm action, labelled by `confirmLabel` or the provider's `confirm` string.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`, `e2e/modal-confirmation.spec.ts`

### UIC-MODAL-21.2 - Outcomes

Confirming shall run `onConfirm` and then close the dialog without calling `onCancel`. When `onConfirm` returns a promise the confirm action is pending until it settles; a rejection keeps the dialog open with the error in its footer ([UIC-MODAL-5.3](MODAL.md#uic-modal-53---failed-actions)). Cancel, Escape and, with `isDismissable`, an outside press shall close it and call `onCancel` once, also inside a `ModalTrigger` or `DialogTrigger` that holds the open state. Every close the dialog makes reports `onOpenChange(false)`.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`, `e2e/modal-confirmation.spec.ts`

### UIC-MODAL-21.3 - Safe focus

When the dialog opens, focus shall land on Cancel, the safe choice, or on the confirm action with `autoFocusConfirm`. When it closes, focus returns to the element focused when it opened.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`, `e2e/modal-confirmation.spec.ts`

### UIC-MODAL-21.4 - Destructive tone

`tone="danger"` shall mark a destructive or irreversible decision: the modal publishes `data-tone="danger"` and the confirm action uses the `danger` button variant. The default is `neutral`.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`, `e2e/modal-confirmation.spec.ts`

### UIC-MODAL-21.5 - Text messages

A message given as a string shall render as text: markup in it is shown, never interpreted.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`

### UIC-MODAL-21.6 - Third action

`secondaryActionLabel` shall add a third action between Cancel and the confirm action (the modal's secondary action, `ui-modal__secondary`), for a choice such as "Don't save" beside Cancel and Save. Pressing it shall run `onSecondaryAction` through the same lifecycle as the confirm action (pending while a returned promise runs, open with the error when it rejects) and then close the dialog without calling `onCancel` or `onConfirm`.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`, `e2e/modal-confirmation.spec.ts`

### UIC-MODAL-21.7 - News tones and icon

`tone` shall also take `info`, `success` and `warning`, published in the modal's `data-tone`, for a dialog that brings news. The title shall start with a decorative icon (`ui-modal__confirmation-icon`, also `ui-icon`) inside the heading: by default the `info`, `success` or `warning` glyph for those tones and none for `neutral` and `danger`; `icon`, an imported icon component or rendered element, replaces it (`icon={ErrorGlyph}` with `tone="danger"` marks an error), and `icon={null}` leaves it out. The icon does not change the dialog's name.

Implementation: `src/components/modal/modal-confirm.tsx`, `labs/reference/modal.css`
Verification: `src/components/modal/modal-confirm.test.tsx`, `e2e/modal-confirmation.spec.ts`

### UIC-MODAL-21.8 - Acknowledgement

`cancelLabel={null}` shall leave Cancel out, for a dialog that only needs acknowledging; focus then starts on the confirm action. Escape and an outside press still close it and call `onCancel`.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`

### UIC-MODAL-21.9 - Anchored confirmation

With `placement`, inside a React Aria `DialogTrigger`, the confirmation shall open as a popover against its trigger ([UIC-MODAL-8.2](MODAL.md#uic-modal-82---anchored-dialog)) instead of over the page, for a quick decision next to the control that asked for it. Its dialog takes `role="dialog"`; focus starts on Cancel and returns to the trigger, and the outcomes are those of the modal confirmation.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`, `e2e/modal-confirmation.spec.ts`

## UIC-MODAL-22 - Imperative confirmation

### UIC-MODAL-22.1 - Awaiting an answer

`confirm(controller, options)` shall open a `Modal` with `options` through `controller` and return a promise that resolves `true` once the reader confirms and `onConfirm` (if any) succeeds, and `false` when the dialog closes any other way (Cancel, the third action after `onSecondaryAction`, Escape, an outside press, the controller's `closeAll`). The promise settles exactly once and the dialog leaves the controller when it closes.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`, `e2e/modal-confirmation.spec.ts`

### UIC-MODAL-22.2 - Alert

`alert(controller, options)` shall open, through `controller`, a `Modal` with `options` (tone `info` by default) and no Cancel, whose one action is labelled by `confirmLabel` or the provider's `ok` string and has focus, and return a promise that resolves once the dialog closes, by that action (after `onConfirm`, if any, succeeds), Escape, an outside press or `closeAll`.

Implementation: `src/components/modal/modal-prompts.tsx`, `src/core/strings/common.ts`
Verification: `src/components/modal/modal-prompts.test.tsx`, `e2e/modal-confirmation.spec.ts`

### UIC-MODAL-22.3 - Prompt

`prompt(controller, options)` shall open, through `controller`, a `Modal` titled `title`, described by `message`, holding a [Text Field](TEXT-FIELD.md) named by `label` that starts with `defaultValue` and has focus, with Cancel (`cancelLabel`) and a primary action labelled by `confirmLabel` or the provider's `ok` string. It returns a promise that resolves to the field's text when the reader presses the action, presses Enter in the field or Control+Enter, and to `null` when the dialog closes any other way. An Enter during a text composition, or the one that confirms an input method candidate (key code 229), belongs to the input method and answers nothing. The promise settles once and the dialog leaves the controller.

Implementation: `src/components/modal/modal-prompts.tsx`
Verification: `src/components/modal/modal-prompts.test.tsx`, `e2e/modal-confirmation.spec.ts`

## UIC-MODAL-23 - Hooks

### UIC-MODAL-23.1 - Hooks and caller attributes

The Modal confirmation helper shall carry the hooks below on top of the modal's, append the caller's `className`, forward caller `data-*` attributes to the overlay and `id` to the dialog element.

Implementation: `src/components/modal/modal-confirm.tsx`
Verification: `src/components/modal/modal-confirm.test.tsx`

## Hooks

| Hook                       | Kind      | Values                                            | Description                                                               |
| -------------------------- | --------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| `ui-modal`                 | root      |                                                   | The overlay covering the viewport, or an anchored dialog's popover.       |
| `ui-modal__panel`          | slot      |                                                   | The box holding the dialog.                                               |
| `ui-modal__dialog`         | slot      |                                                   | The `role="dialog"` element.                                              |
| `ui-modal__header`         | slot      |                                                   | The header row.                                                           |
| `ui-modal__heading`        | slot      |                                                   | Groups the title and description.                                         |
| `ui-modal__title`          | slot      |                                                   | The `<h2>` title.                                                         |
| `ui-modal__description`    | slot      |                                                   | The description under the title.                                          |
| `ui-modal__header-actions` | slot      |                                                   | Caller content at the end of the header.                                  |
| `ui-modal__close`          | slot      |                                                   | The header close button (also `ui-button`).                               |
| `ui-modal__body`           | slot      |                                                   | The body.                                                                 |
| `ui-modal__footer`         | slot      |                                                   | The footer.                                                               |
| `ui-modal__footer-content` | slot      |                                                   | Caller content at the start of the footer.                                |
| `ui-modal__message`        | slot      |                                                   | The footer status or error message.                                       |
| `ui-modal__actions`        | slot      |                                                   | The action bar.                                                           |
| `ui-modal__cancel`         | slot      |                                                   | The Cancel button (also `ui-button`).                                     |
| `ui-modal__secondary`      | slot      |                                                   | The secondary action (also `ui-button`).                                  |
| `ui-modal__primary`        | slot      |                                                   | The primary action (also `ui-button`).                                    |
| `data-layer`               | attribute | `modal`, `dropdown`                               | The overlay layer (`dropdown` when anchored); z-index set inline.         |
| `data-tone`                | attribute | `neutral`, `info`, `success`, `warning`, `danger` | On the overlay, emphasis; on the message, `danger` for an error.          |
| `data-size`                | attribute | `sm`, `md`, `lg`, `xl`, `full`                    | Dialog width.                                                             |
| `data-body-layout`         | attribute | `block`, `column`                                 | Body layout.                                                              |
| `data-entering`            | state     | `true`                                            | On the overlay and panel while an entry animation runs (React Aria).      |
| `data-exiting`             | state     | `true`                                            | On the overlay and panel while an exit animation runs (React Aria).       |
| `data-non-modal`           | state     | `true`                                            | On the overlay of a dialog that does not block the page.                  |
| `data-stack-index`         | state     | `0`, `1`, …                                       | On a blocking dialog's overlay, its place among open ones, from 0.        |
| `data-placement`           | state     | `top`, `bottom`, `left`, `right`, `center`        | On an anchored dialog, the side of the trigger it opened on (React Aria). |
| `data-trigger`             | state     | `DialogTrigger`                                   | On an anchored dialog, what opened it (React Aria).                       |

| `ui-modal__confirmation-icon` | slot | | The decorative icon leading the title (also `ui-icon`). |
