# Dock Panel

`DockPanel` is a panel against an edge of an application frame, beside its main content. Expanded, it shows one horizontal strip of [Tabs](TABS.md), one per pane, beside a collapse button, above the selected pane; collapsed, a rail of launchers that expand it again, vertical beside a side edge and horizontal at the bottom. A separator on its inner edge resizes it, and a drag on the collapsed separator expands it in the same gesture. Below a frame width the selected pane opens in a [Drawer](DRAWER.md) instead. `DockPanelPane` is one pane: its tab's icon, label and count, optional pane-local actions and footer, and the content. Panes stay mounted while hidden and when they move between the docked body and the drawer, so their state survives switching, collapsing and resizing the frame. The selection, expanded state and size are each controlled or held by the panel, which persists the values it holds through the provider storage ([PROVIDER.md](PROVIDER.md)). The separator is [Split View](SPLIT-VIEW.md)'s `ResizeHandle`. Routing, data and persistence policy stay with the host.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-DOCK-PANEL-1 - Structure

### UIC-DOCK-PANEL-1.1 - Panel and panes

`DockPanel` shall render a `<section>` region named by `label`, holding a `Tabs` element in a `ui-dock-panel__tabs` slot, which holds the separator while the panel is docked (not an overlay), a `ui-dock-panel__header` element and a `ui-dock-panel__body` element. The panes render, through a portal, into one `ui-dock-panel__panes` element that the body holds, and the drawer while it is open (UIC-DOCK-PANEL-4.1); on the server and until the page hydrates they render in place in the body. Its panes are its `DockPanelPane` children, in order; other children are ignored. The root publishes `position` in `data-position`: `end` (the default), `start` or `bottom`, with `start` and `end` following the reading direction. The reference sheet owns the layout: the root is a column in every state, the `Tabs` element lays nothing out (`display: contents`), so the generic Tabs orientation rules cannot change the panel's direction, and the separator straddles the inner edge without taking room. A docked panel fills a host that sets its height, never growing past it, and is as tall as its selected pane in a host that sets none.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-parts.tsx`, `labs/reference/dock-panel.css`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-1.2 - Tabs

While expanded and docked, the header shall hold one horizontal `TabList` in a `ui-dock-panel__strip` element, named by the panel's label, with a `Tab` per pane (`ui-dock-panel__tab`): its `icon`, its `label` as given and its `count` capped at `9+`, using the pane's `countVariant` (`subtle` by default), whose accessible description keeps the full count (UIC-TABS-1.2), refused while the pane `isDisabled`. Each tab controls its pane, which is labelled by it. The collapse toggle (UIC-DOCK-PANEL-2.2) sits after the strip, outside it, so the strip scrolls without it. While the panel is collapsed or an overlay the strip stays mounted but `hidden`, so the tabs keep pairing with their panes.

Implementation: `src/components/dock-panel/dock-panel-tabs.tsx`, `labs/reference/dock-panel.css`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-1.3 - Launchers

While collapsed or an overlay, the header shall hold the launchers as one toolbar (`role="toolbar"`, `ui-dock-panel__launchers`) named by the provider's `panelPanes` string from the panel's label, in a `ui-dock-panel__strip` element: vertical beside a side edge and horizontal at the bottom (`aria-orientation` and `data-orientation`). Each pane has a launcher, a button in a `ui-dock-panel__launcher` slot holding its icon (`ui-dock-panel__launcher-icon`), its label as text (`ui-dock-panel__launcher-label`) and, for a count above zero, a `Badge` using the pane's `launcherCountVariant` (`solid` by default, independently of the expanded tab) in a `ui-dock-panel__count` slot capped at `9+` and hidden from assistive technology. The button is named by its label, described by the provider's `itemCount` text with the full count, and refused while its pane `isDisabled`; it has no tooltip, since its label shows. The selected pane's launcher publishes `data-selected`, which the reference sheet does not paint. In the reference sheet the collapsed panel is a 40 pixel rail: beside a side edge the toggle sits above the launchers and each launcher reads bottom to top (`writing-mode: vertical-rl` turned half a turn) with its icon and count upright; at the bottom the toggle sits before a row of launchers. A short rail keeps every label and scrolls natively; it never drops to icons only.

Implementation: `src/components/dock-panel/dock-panel-launchers.tsx`, `src/core/strings/common.ts`, `labs/reference/dock-panel.css`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-1.4 - Pane

Inside an `DockPanel`, `DockPanelPane` shall render as its tab's `TabPanel` in a `ui-dock-panel__pane` slot: an `ActionRow` of its `actions` in a `ui-dock-panel__actions` slot when it has any (`size="sm"`), its children in a `ui-dock-panel__content` slot, which is in the tab order (`tabIndex="0"`) so the keyboard can scroll it when it overflows, and its `footer` in a `ui-dock-panel__footer` slot when given. It draws no title: its tab already names it. Outside an `DockPanel` the pane renders the same parts in a visible `<section>`.

Implementation: `src/components/dock-panel/dock-panel-pane.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-1.5 - Hooks and caller attributes

`DockPanel` and `DockPanelPane` shall carry the hooks below, append the caller's `className` to their element, forward caller `data-*` attributes to it, and the panel forwards `id` to its root.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-pane.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`

## UIC-DOCK-PANEL-2 - Panes

### UIC-DOCK-PANEL-2.1 - Selection

One pane shall be selected at a time and stay selected while the panel is collapsed. `selectedKey` controls it, `defaultSelectedKey` sets it at first, and `onSelectionChange` receives the `id` of each other pane a tab or a launcher selects; selecting the selected pane again reports nothing. Without them, or when the key names no enabled pane, the first enabled pane is selected, and that pane, kept by its `id`, stays selected while it is enabled: panes added, reordered or disabled around it change nothing, and a panel that had no enabled pane selects the first one that comes. Only when it goes or is disabled does the first enabled pane take its place. This keeping is not a selection: `onSelectionChange` receives nothing.

Implementation: `src/components/dock-panel/use-dock-panel-state.ts`, `src/components/dock-panel/dock-panel.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-2.2 - Expanding and collapsing

`isExpanded` shall control whether the selected pane shows, `defaultExpanded` (true by default) sets it at first, and `onExpandedChange` receives each state the reader asks for; the root publishes `data-expanded` while expanded and docked. A toggle, a `Button` in a `ui-dock-panel__toggle` slot named by the provider's `collapsePanel` or `expandPanel` string from the panel's label, flips the state, reports it in `aria-expanded`, names the body in `aria-controls`, and draws a chevron toward the panel's edge to collapse and away from it to expand (`chevron-double-right` or `chevron-double-left` beside a side edge, after the reading direction, `chevron-down` or `chevron-up` at the bottom). It is refused without an enabled pane. Activating a launcher by press, Enter or Space selects its pane and expands the panel; activating the selected pane's launcher expands it without selecting again. Collapsed, the body and the tabs are hidden and only the rail shows.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-launchers.tsx`, `src/components/dock-panel/use-dock-panel-state.ts`, `src/core/strings/common.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-2.3 - Mounted panes

Every pane shall stay mounted for as long as the panel is: through switching panes, collapsing and expanding, opening and closing the drawer, and crossing `overlayBelow` either way, as many times as it happens. The panes are never rendered twice; the one `ui-dock-panel__panes` element moves between the body and the drawer. Each pane other than the selected one is `hidden` and `inert` (`data-inert`), and every pane is hidden while the body is, so its content keeps its state (form values, scroll position, loaded data) without taking focus or reaching assistive technology. Only hydrating a server-rendered page mounts the panes once more, as they move from the body into the portal.

Implementation: `src/components/dock-panel/dock-panel-parts.tsx`, `src/components/dock-panel/dock-panel-pane.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-2.4 - Keyboard and focus

In the expanded strip, the arrow keys, Home and End shall move focus between the enabled tabs and select the tab they reach (roving focus, automatic activation), and Tab leaves the strip for the toggle. Along the collapsed toolbar (Up and Down beside a side edge, Left and Right at the bottom), the arrow keys, Home and End move focus between the enabled launchers without activating them. When a launcher expands the panel, focus moves to its pane's tab. When the panel collapses while focus is in its tabs or its pane (from outside, since the toggle keeps its own focus), focus moves to the selected pane's launcher. When the element holding focus is removed or disabled, focus moves to the shown pane's tab, else to the first enabled launcher. Focus is read through open shadow roots, so this holds for a panel inside one.

Implementation: `src/components/dock-panel/dock-panel-launchers.tsx`, `src/components/dock-panel/use-dock-panel-focus.ts`, `src/utils/focus-target.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-2.5 - Scrolling strips

The tab strip shall scroll freely, without snapping, paging or stepper buttons: the wheel scrolls it as a [Tabs](TABS.md) scroll list does (UIC-TABS-2.4), and a short collapsed rail scrolls natively along its axis, a bottom rail taking the vertical wheel as a [scroll strip](SCROLL-STRIP.md). Edge fades are opt-in: with `showEdgeFades`, while a strip (tabs or launchers) hides content past an edge, a decorative `ui-dock-panel__fade` element (`data-edge` `start` or `end`, `data-orientation`, hidden otherwise and from assistive technology) covers that edge; the reference sheet draws it 26 pixels deep along the strip's axis. By default no fade renders. Each newly selected tab scrolls toward the middle of the strip (UIC-TABS-2.4); when the strip appears (the panel expands or docks) and whenever it resizes, the strip scrolls the least that shows the selected tab clear of both fades (or inside the strip, without them), aligning a tab wider than the room by its inline start. Otherwise the reader's own scroll position stays.

Implementation: `src/components/dock-panel/dock-panel-tabs.tsx`, `src/components/dock-panel/dock-panel-fades.tsx`, `src/utils/use-scroll-strip-overflow.ts`, `labs/reference/dock-panel.css`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

## UIC-DOCK-PANEL-3 - Size

### UIC-DOCK-PANEL-3.1 - Size and bounds

While expanded and docked, the root shall take its size inline, in pixels, as its width beside a side edge and its height at the bottom; the panel's size is the only geometry it sets, so the flex or grid layout around it resizes the main content directly. `size` controls it, `defaultSize` (320 by default) sets it at first. It stays between `minSize` (200 by default) and `maxSize` (640 by default); `minMainSize` lowers the largest size so the panel leaves that many pixels of its parent's client width (height at the bottom) to the content beside it, never below `minSize`. The parent is measured when it resizes, never during a drag. Collapsed, the root takes no inline size and remembers the size, which expanding resumes.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-parts.tsx`, `src/components/dock-panel/use-dock-panel-size.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-3.2 - Separator

While docked, a `ResizeHandle` in a `ui-dock-panel__handle` slot shall resize the panel from its inner edge: a vertical bar beside a side edge and a horizontal one at the bottom, named by the provider's `resizePanel` string from the panel's label, controlling the body and reporting the size and its bounds. Moving it toward the main content grows the panel, in either reading direction. Expanded, it is in the tab order: the arrow keys step 10 pixels, Shift+arrows 2, and Home and End jump to the bounds. Collapsed, it stays visible and draggable but leaves the tab order (`tabIndex="-1"`): the toggle and the launchers expand the panel from the keyboard. It is disabled without an enabled pane. A pointer drag follows the pointer pixel for pixel in the panel's own pixels, under an ancestor scale too, and the root publishes `data-resizing` while it lasts.

Implementation: `src/components/dock-panel/dock-panel-parts.tsx`, `src/components/split-view/resize-handle.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-3.3 - Drag to expand

A primary drag on the collapsed separator shall expand the panel at its first move, reporting `onExpandedChange(true)` once, and keep resizing it in the same captured gesture, with no second press: the panel resumes its remembered size and the drag's travel moves it from there. A press released without moving leaves it collapsed and reports no size. A key step on a focused collapsed separator expands it the same way.

Implementation: `src/components/dock-panel/use-dock-panel-size.ts`, `src/components/dock-panel/dock-panel-parts.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-3.4 - Preview, end and cancel

A drag shall preview its size at most once per animation frame: `onSizeChange` receives the latest size of each frame, and an uncontrolled panel shows it. When the drag or a key step ends, the final size is flushed (previewed if it is not yet) and `onSizeChangeEnd` receives it once, the moment a host saves it; an uncontrolled panel commits it then. A drag abandoned without an end (lost capture, cancellation, the panel collapsing, the separator unmounting or becoming disabled, or a change of position, writing direction, persist key, storage adapter or size bounds) releases capture, drops the pending frame and the live size, clears `data-resizing`, collapses again a panel the drag expanded, and calls `onSizeChangeCancel` so a controlled host returns to its saved size; its release reports no end.

Implementation: `src/components/dock-panel/use-dock-panel-size.ts`, `src/components/dock-panel/dock-panel.tsx`, `src/components/split-view/resize-handle.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-3.5 - Persisted state

With `persistKey`, the panel shall restore its uncontrolled selection, expanded state and size from the provider storage under `<persistKey>:selected`, `<persistKey>:expanded` and `<persistKey>:size` and save each as it changes, the size once when a drag or a key step ends, never during a drag. A stored value that cannot be read, or a stored pane that is no longer enabled, falls back to the defaults.

Implementation: `src/components/dock-panel/use-dock-panel-state.ts`, `src/components/dock-panel/use-dock-panel-size.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

## UIC-DOCK-PANEL-4 - Overlay

### UIC-DOCK-PANEL-4.1 - Drawer below a width

While its parent's client width is below `overlayBelow` pixels, the panel shall publish `data-overlay`, keep its body and tabs hidden, render no separator and take no inline size, so only its launcher rail stays in the frame. A launcher activation then selects its pane and opens it in a `Drawer` (`ui-dock-panel__drawer` on its overlay) at the panel's `position`, titled by the pane's `label`, with a close button. The drawer's body holds a `ui-dock-panel__drawer-body` element, which holds the panes element while the drawer is open; there only the selected pane shows, the others stay hidden and inert, and the drawer's modal focus containment and dismissal cover the pane. Closing the drawer, or docking, moves the panes element back into the body, keeping every pane mounted. The toggle opens the selected pane the same way. The drawer never opens by itself, whatever the expanded state, and leaves that state unchanged; Escape, an outside press, the close button or the open pane's launcher close it, focus returns to the launcher, and it closes when the panel docks again. Launchers and the toggle report the drawer in `aria-expanded`, and launchers announce the dialog they open (`aria-haspopup="dialog"`) instead of naming the body.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-parts.tsx`, `src/components/dock-panel/dock-panel-launchers.tsx`, `labs/reference/dock-panel.css`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

## Hooks

| Hook                            | Kind      | Values                   | Description                                                                      |
| ------------------------------- | --------- | ------------------------ | -------------------------------------------------------------------------------- |
| `ui-dock-panel`                 | root      |                          | The panel's `<section>`.                                                         |
| `ui-dock-panel__tabs`           | slot      |                          | The `Tabs` element (also `ui-tabs`), which lays nothing out.                     |
| `ui-dock-panel__header`         | slot      |                          | The tab strip and the toggle, or the toggle and the launchers.                   |
| `ui-dock-panel__strip`          | slot      |                          | The element around a scrolling list (tabs or launchers) and its fades.           |
| `ui-dock-panel__tab-list`       | slot      |                          | The expanded tab list (also `ui-tabs__list`).                                    |
| `ui-dock-panel__tab`            | slot      |                          | A pane's tab (also `ui-tabs__tab`).                                              |
| `ui-dock-panel__launchers`      | slot      |                          | The collapsed launcher toolbar.                                                  |
| `ui-dock-panel__launcher`       | slot      |                          | A launcher button.                                                               |
| `ui-dock-panel__launcher-icon`  | slot      |                          | A launcher's icon (also `ui-icon`).                                              |
| `ui-dock-panel__launcher-label` | slot      |                          | A launcher's label.                                                              |
| `ui-dock-panel__count`          | slot      |                          | A launcher's count (also `ui-badge`).                                            |
| `ui-dock-panel__fade`           | slot      |                          | A decorative fade over a strip edge that hides content.                          |
| `ui-dock-panel__toggle`         | slot      |                          | The collapse and expand button (also `ui-button`).                               |
| `ui-dock-panel__handle`         | slot      |                          | The separator (also `ui-resize-handle`).                                         |
| `ui-dock-panel__body`           | slot      |                          | The docked panel's body, which holds the panes element while no drawer does.     |
| `ui-dock-panel__panes`          | slot      |                          | The one element every pane renders into, in the body or in the drawer.           |
| `ui-dock-panel__drawer`         | slot      |                          | The overlay of the drawer that holds the panes while open (also `ui-drawer`).    |
| `ui-dock-panel__drawer-body`    | slot      |                          | The element in the drawer's body that holds the panes element while it is open.  |
| `ui-dock-panel__pane`           | slot      |                          | A pane (also `ui-tabs__panel`).                                                  |
| `ui-dock-panel__actions`        | slot      |                          | A pane's actions row (also `ui-action-row`).                                     |
| `ui-dock-panel__content`        | slot      |                          | A pane's content.                                                                |
| `ui-dock-panel__footer`         | slot      |                          | A pane's footer.                                                                 |
| `data-position`                 | attribute | `start`, `end`, `bottom` | The frame edge the panel sits against.                                           |
| `data-orientation`              | attribute | `horizontal`, `vertical` | The direction of the header, a strip, a launcher toolbar or a fade.              |
| `data-edge`                     | attribute | `start`, `end`           | The strip edge a fade covers.                                                    |
| `data-expanded`                 | state     | `true`                   | The docked panel shows its selected pane.                                        |
| `data-overlay`                  | state     | `true`                   | The parent is narrower than `overlayBelow`: the selected pane shows in a drawer. |
| `data-resizing`                 | state     | `true`                   | A pointer drag on the separator is in progress.                                  |
| `data-selected`                 | state     | `true`                   | On a launcher, its pane is the selected one.                                     |
| `data-hovered`                  | state     | `true`                   | On a launcher, the pointer is over it.                                           |
| `data-pressed`                  | state     | `true`                   | On a launcher, it is being pressed.                                              |
| `data-focused`                  | state     | `true`                   | On a launcher, it has focus.                                                     |
| `data-focus-visible`            | state     | `true`                   | On a launcher, it has keyboard focus.                                            |
| `data-disabled`                 | state     | `true`                   | On a launcher, its pane is disabled.                                             |
| `data-inert`                    | state     | `true`                   | On a pane, it is not the selected one: hidden and inert.                         |
