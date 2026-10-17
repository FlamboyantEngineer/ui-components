# Context Menu

A context menu lists actions for whatever the reader points at. `ContextMenu` shows a menu that something outside React opens, moves and closes through a `MenuController` (from `createMenuController` or `useMenuController`), anchored to a viewport point or an element; a host keeps its own menu state and drives the controller. `ContextMenuTrigger` composes a `ContextMenu` with any element: it opens at the pointer on a secondary click or a long touch, and below the element on the Context Menu key or Shift+F10. Both draw the menu family's hooks ([MENU.md](MENU.md)) and put their popover on the `context-menu` overlay layer by default; they add no hooks of their own.

## UIC-CONTEXT-MENU-1 - Context menu trigger

### UIC-CONTEXT-MENU-1.1 - Opening at the pointer

A secondary click on the target (a `contextmenu` event) shall prevent the browser's own menu, keep the event from reaching enclosing context menu triggers, and open the menu below and after the pointer, 2 pixels away, flipped above or shifted along the edge when it does not fit in the viewport. The menu is a React Aria popover anchored to that point (`getTargetRect`), so it publishes `data-placement`.

Implementation: `src/components/context-menu/context-menu.tsx`, `src/components/context-menu/context-menu-target.ts`, `src/components/context-menu/menu-anchor.ts`
Verification: `src/components/context-menu/context-menu-target.test.tsx`, `e2e/context-menu.spec.ts`

### UIC-CONTEXT-MENU-1.2 - Opening from the keyboard

The Context Menu key or Shift+F10 pressed on the focused target shall open the menu below the target, as React Aria places a menu against its trigger.

Implementation: `src/components/context-menu/context-menu-target.ts`, `src/components/context-menu/menu-anchor.ts`
Verification: `src/components/context-menu/context-menu-target.test.tsx`, `e2e/context-menu.spec.ts`

### UIC-CONTEXT-MENU-1.3 - Long press

A touch that rests on the target for 500 milliseconds without moving more than 10 pixels shall open the menu at the touch point. A `contextmenu` event the platform sends for the same press is ignored, so the menu opens once.

Implementation: `src/components/context-menu/context-menu-target.ts`
Verification: `src/components/context-menu/context-menu-target.test.tsx`, `e2e/context-menu.spec.ts`

### UIC-CONTEXT-MENU-1.4 - Focus

Opening shall move focus to the first enabled item. A focusable target takes focus as the menu opens, so closing the menu by an action, Escape or a press outside returns focus to it; otherwise focus returns to where it was before the menu opened.

Implementation: `src/components/context-menu/context-menu-target.ts`, `src/components/context-menu/context-menu.tsx`
Verification: `src/components/context-menu/context-menu-target.test.tsx`, `e2e/context-menu.spec.ts`

### UIC-CONTEXT-MENU-1.5 - Dismissal

The open menu shall close on Escape, on a primary press outside it and on a secondary press outside it (where the browser then shows its own menu), without running an action. A secondary click inside the menu does not open the browser's menu. With `isDisabled` the target keeps the browser's menu and opens none.

Implementation: `src/components/context-menu/context-menu.tsx`, `src/components/context-menu/menu-state.ts`
Verification: `src/components/context-menu/context-menu-target.test.tsx`, `e2e/context-menu.spec.ts`

### UIC-CONTEXT-MENU-1.6 - Target and menu

`ContextMenuTrigger`'s first child shall be the target element, which receives the trigger's event handlers and a ref; its own handlers and ref keep working, and it keeps its own role and name. The remaining children (a `Menu`) are the menu. The menu and its popover (a React Aria dialog) are named by `aria-label`, by default the provider string `contextMenu`, unless the `Menu` has its own `aria-label`; the popover takes `className`, `id` and caller `data-*` attributes and sits on the `context-menu` layer.

Implementation: `src/components/context-menu/context-menu.tsx`, `src/components/context-menu/context-menu-target.ts`, `src/core/strings.ts`
Verification: `src/components/context-menu/context-menu-target.test.tsx`, `src/components/context-menu/context-menu.test.tsx`

## UIC-CONTEXT-MENU-2 - Menu controller

### UIC-CONTEXT-MENU-2.1 - Controller

`createMenuController()` shall return a controller with `open(anchor, { items })`, where the anchor is a viewport point `{ x, y }` or an element, `move(anchor)`, `setItems(items)`, `close()`, `isOpen()`, `getSnapshot()` and `subscribe(listener)`. The snapshot (`isOpen`, `anchor`, `items`) is immutable and replaced on every change; listeners run after each change and only then. Opening an open menu moves it; moving or closing a closed menu changes nothing. `useMenuController()` returns a controller that lives as long as the calling component, and `useMenuControllerState(controller)` subscribes a component to its snapshot.

Implementation: `src/components/context-menu/menu-controller.ts`
Verification: `src/components/context-menu/menu-controller.test.ts`

### UIC-CONTEXT-MENU-2.2 - Controlled menu

`ContextMenu` shall show its children (a `Menu`), or a `Menu` of the controller's entries, while its controller is open: below and after a point anchor, or against an element anchor with `placement` (`bottom start` by default). Focus enters the first item, and an action, Escape or a press outside closes the controller, so subscribers see the menu close.

Implementation: `src/components/context-menu/context-menu.tsx`, `src/components/context-menu/menu-state.ts`
Verification: `src/components/context-menu/context-menu.test.tsx`, `e2e/context-menu.spec.ts`

### UIC-CONTEXT-MENU-2.3 - Moving an open menu

`move(anchor)` shall reposition the open menu at the new anchor without remounting it: its items, focus and submenus stay as they are.

Implementation: `src/components/context-menu/menu-anchor.ts`
Verification: `src/components/context-menu/context-menu.test.tsx`, `e2e/context-menu.spec.ts`

### UIC-CONTEXT-MENU-2.4 - Layers

A `ContextMenu` shall sit on `layer` (`context-menu` by default), so it stacks above `dropdown` menus and below `tooltip` and `toast` content ([PORTAL.md](PORTAL.md)).

Implementation: `src/components/context-menu/context-menu.tsx`, `src/components/menu/menu-popover.tsx`
Verification: `src/components/context-menu/context-menu.test.tsx`, `e2e/context-menu.spec.ts`
