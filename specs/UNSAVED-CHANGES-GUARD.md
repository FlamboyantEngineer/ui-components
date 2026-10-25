# Unsaved Changes Guard

`UnsavedChangesGuard` is the one way to protect unsaved edits. Editors under it register their changes with `useUnsavedChanges({ isDirty, label, onSave, onDiscard })`. Code that leaves (a client-side route change, a tab switch, closing a panel or a dialog) awaits `confirmLeave()` from `useUnsavedChangesGuard()`: it resolves at once while nothing is dirty, and otherwise asks the reader in a [Confirm Dialog](MODAL.md) to save, discard or stay, then resolves whether to go on. While anything is dirty the browser also confirms closing or reloading the page. A guard inside another asks about its own editors alone and stands in its parent for them, so a panel can protect its edits while the page still protects everything.

## UIC-UNSAVED-CHANGES-GUARD-1 - Registration

### UIC-UNSAVED-CHANGES-GUARD-1.1 - Registering editors

`useUnsavedChanges(options)` shall register its component with the nearest `UnsavedChangesGuard` from the moment it mounts until it unmounts: whether it `isDirty`, its `label` for the confirmation's list, and its optional `onSave` and `onDiscard` actions. Each render replaces the registration, so the guard reads the latest state and actions, already in the task that rendered them; unmounting removes that registration and no other. `useUnsavedChanges` and `useUnsavedChangesGuard` throw outside a guard, so an editor never believes itself protected when it is not.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`, `src/components/unsaved-changes-guard/unsaved-changes-store.ts`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

### UIC-UNSAVED-CHANGES-GUARD-1.2 - Dirty state

`useUnsavedChangesGuard()` shall return `isDirty`, true while any editor registered with the guard is dirty, and re-render its component when that changes, for a control that shows the state (a Save button, a status).

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`, `src/components/unsaved-changes-guard/unsaved-changes-store.ts`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

### UIC-UNSAVED-CHANGES-GUARD-1.3 - Leaving the page

While anything under the guard is dirty, the guard shall cancel the window's `beforeunload` event, so the browser asks before the page closes or reloads with its own wording. `shouldConfirmUnload={false}` turns this off. The listener leaves when everything is clean or the guard unmounts.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`

## UIC-UNSAVED-CHANGES-GUARD-2 - Confirming a leave

### UIC-UNSAVED-CHANGES-GUARD-2.1 - Clean leaves

`confirmLeave()` shall resolve `true` without asking when no editor under the guard is dirty.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

### UIC-UNSAVED-CHANGES-GUARD-2.2 - The question

Otherwise `confirmLeave(options)` shall open a `Modal` titled by `options.title`, the guard's `title` or the provider's `unsavedChanges` string, and described by `options.message`, the guard's `message` or the provider's question: `saveBeforeLeaving` when Save is offered, `discardBeforeLeaving` otherwise. Under the message, the `ui-unsaved-changes-guard__list` list names the labels of the dirty editors in registration order; editors without a label are left out, and the list is left out when none has one. The dialog keeps what it showed when it was asked while it closes.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`, `src/core/common-strings.ts`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

### UIC-UNSAVED-CHANGES-GUARD-2.3 - Save

When every dirty editor has `onSave`, the dialog shall offer Stay, Discard and Save, labelled by the provider's `stay`, `discard` and `save` strings. Save runs each dirty editor's `onSave` in turn, awaiting a returned promise; the action is pending meanwhile (named by the provider's `saving` string), and once all succeed the dialog closes and `confirmLeave` resolves `true`. A rejection stops there and keeps the dialog open with the error in its footer, and the promise stays unsettled until the reader chooses again.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`, `src/components/unsaved-changes-guard/unsaved-changes-store.ts`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

### UIC-UNSAVED-CHANGES-GUARD-2.4 - Discard

Discard shall run each dirty editor's `onDiscard`, if any, in turn, then close the dialog and resolve `true`. When a dirty editor has no `onSave`, Save is not offered: Discard is the dialog's confirm action, with the `danger` tone, beside Stay.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`, `src/components/unsaved-changes-guard/unsaved-changes-store.ts`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

### UIC-UNSAVED-CHANGES-GUARD-2.5 - Stay

Stay, Escape and every other way of closing the dialog without Save or Discard shall resolve `false`, leaving every editor and its changes as they were.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

### UIC-UNSAVED-CHANGES-GUARD-2.6 - One question at a time

A `confirmLeave` made while the dialog is open shall resolve the earlier one `false` and show its own question. Unmounting the guard resolves an open question `false`. Each promise settles once.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`

## UIC-UNSAVED-CHANGES-GUARD-3 - Nesting

### UIC-UNSAVED-CHANGES-GUARD-3.1 - Nested guards

A guard inside another shall own the registrations of the editors under it: its `confirmLeave` asks about them alone, with its own text. It registers itself with its parent as one editor that is dirty while any of them is, lists their labels, saves them (when every dirty one can) and discards them, so the parent's question covers every editor beneath it.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

## UIC-UNSAVED-CHANGES-GUARD-4 - Accessibility and hooks

### UIC-UNSAVED-CHANGES-GUARD-4.1 - Safe focus and keyboard

The question shall be an alert dialog named by its title and described by its message, with focus on Stay when it opens, so Enter or Space never throws work away by accident; Escape stays. Focus returns to the element focused when it opened.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`, `src/components/modal/modal-confirm.tsx`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`, `e2e/unsaved-changes-guard.spec.ts`

### UIC-UNSAVED-CHANGES-GUARD-4.2 - Hooks and caller attributes

The guard renders no element of its own around its children. Its dialog shall carry the hooks below on top of the Confirm Dialog's and the Modal's, with the caller's `className` and `data-*` attributes on the overlay and `id` on the dialog element.

Implementation: `src/components/unsaved-changes-guard/unsaved-changes-guard.tsx`
Verification: `src/components/unsaved-changes-guard/unsaved-changes-guard.test.tsx`

## Hooks

| Hook                             | Kind | Values | Description                                                        |
| -------------------------------- | ---- | ------ | ------------------------------------------------------------------ |
| `ui-unsaved-changes-guard`       | root |        | The question's modal overlay, alongside `ui-modal` and `ui-modal`. |
| `ui-unsaved-changes-guard__list` | slot |        | The list of the dirty editors' labels (`<ul>`).                    |
