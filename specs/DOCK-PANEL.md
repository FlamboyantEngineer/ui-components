# Dock Panel

`DockPanel` is a panel docked against an edge of an application frame, beside its main content: a toolbar of pane launchers that stays visible while the panel is collapsed, one open pane at a time, a window splitter that resizes it, and a [Drawer](DRAWER.md) over the page when its frame is narrow. `DockPanelPane` is one pane: the launcher's label, icon and count, an optional header row (a title and [Action Row](ACTION-ROW.md) actions) and the content. Panes stay mounted while hidden and when they move between the docked body and the drawer, so their state survives switching, collapsing and resizing the frame; the selection, expanded state and size persist through the provider storage ([PROVIDER.md](PROVIDER.md)). The separator is [Split View](SPLIT-VIEW.md)'s `ResizeHandle`.

## UIC-DOCK-PANEL-1 - Structure

### UIC-DOCK-PANEL-1.1 - Panel and panes

`DockPanel` shall render a `<section>` region named by `label`, holding the launcher toolbar, the separator while it shows, and a `ui-dock-panel__body` element. The panes render, through a portal, into one `ui-dock-panel__panes` element that the body holds, and the drawer while it is open (UIC-DOCK-PANEL-4.1); on the server and until the page hydrates they render in place in the body. Its panes are its `DockPanelPane` children, in order; other children are ignored. The root publishes `position` in `data-position`: `end` (the default), `start` or `bottom`, with `start` and `end` following the reading direction. In the reference sheet a docked panel fills a host that sets its height, never growing past it, and is as tall as its open pane in a host that sets none.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-parts.tsx`, `labs/reference/dock-panel.css`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-1.2 - Launchers

The launchers shall form one toolbar (`role="toolbar"`, `ui-dock-panel__launchers`) named by the provider's `panelPanes` string from the panel's label, vertical beside a side edge and horizontal against the bottom (`aria-orientation` and `data-orientation`). Each pane has a launcher in a `ui-dock-panel__launcher` element: a `Button` drawing the pane's `icon`, named by its `label`, with the label as a tooltip toward the main content, refused while the pane `isDisabled`. A pane's `count` above zero shows as an overlay count `Badge` in a `ui-dock-panel__count` slot, capped at `99+` and hidden from assistive technology, and describes the button with the provider's `itemCount` text. Each launcher reports whether its pane is open in `aria-expanded` and names the pane element in `aria-controls`.

Implementation: `src/components/dock-panel/dock-panel-launchers.tsx`, `src/core/strings/common.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-1.3 - Pane

`DockPanelPane` shall render a `<section>` region in a `ui-dock-panel__pane` slot, named by its `label`, holding an `ActionRow` header in a `ui-dock-panel__header` slot and its children in a `ui-dock-panel__content` slot, which is in the tab order (`tabIndex="0"`) so the keyboard can scroll it when it overflows. The header leads with `title` as a heading in a `ui-dock-panel__title` slot, one level below the enclosing section's or level 3, and draws `actions` as the action row does (`size="sm"`); with neither title nor actions it renders nothing. Outside an `DockPanel` the pane renders visible.

Implementation: `src/components/dock-panel/dock-panel-pane.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-1.4 - Hooks and caller attributes

`DockPanel` and `DockPanelPane` shall carry the hooks below, append the caller's `className` to their element, forward caller `data-*` attributes to it, and the panel forwards `id` to its root.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-pane.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`

## UIC-DOCK-PANEL-2 - Panes

### UIC-DOCK-PANEL-2.1 - Selection

One pane shall be selected at a time and stay selected while the panel is collapsed; its launcher publishes `data-selected`. `selectedKey` controls it, `defaultSelectedKey` sets it at first, and `onSelectionChange` receives the `id` of each pane a launcher selects. Without them, or when the key names no enabled pane, the first enabled pane is selected.

Implementation: `src/components/dock-panel/use-dock-panel-state.ts`, `src/components/dock-panel/dock-panel-launchers.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-2.2 - Expanding and collapsing

`isExpanded` shall control whether the selected pane shows, `defaultExpanded` (true by default) sets it at first, and `onExpandedChange` receives each state the reader asks for; the root publishes `data-expanded` while expanded and docked. Pressing a launcher selects its pane and expands the panel; pressing the open pane's launcher collapses it. A toggle after the launchers, a `Button` in a `ui-dock-panel__toggle` slot named by the provider's `collapsePanel` or `expandPanel` string from the panel's label, flips the state, reports it in `aria-expanded`, names the body in `aria-controls`, and draws a chevron toward the panel's edge to collapse and away from it to expand (`chevron-double-right` or `chevron-double-left` beside a side edge, after the reading direction, `chevron-down` or `chevron-up` at the bottom). It is refused without an enabled pane. Collapsed, the body is hidden and only the launchers show.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-launchers.tsx`, `src/components/dock-panel/use-dock-panel-state.ts`, `src/core/strings/common.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-2.3 - Mounted panes

Every pane shall stay mounted for as long as the panel is: through switching panes, collapsing and expanding, opening and closing the drawer, and crossing `overlayBelow` either way, as many times as it happens. The panes are never rendered twice; the one `ui-dock-panel__panes` element moves between the body and the drawer. Each pane other than the shown one (the open pane while docked, the selected pane while an overlay) is `hidden` and `inert`, and every pane is hidden while the body is, so its content keeps its state (form values, scroll position, loaded data) without taking focus or reaching assistive technology. Only hydrating a server-rendered page mounts the panes once more, as they move from the body into the portal.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-parts.tsx`, `src/components/dock-panel/dock-panel-pane.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-2.4 - Keyboard and focus

The arrow keys along the launcher toolbar (Up and Down beside a side edge, Left and Right at the bottom) shall move focus between the launchers and the toggle, and Tab leaves the toolbar. When a launcher press opens its pane, focus moves to the pane element (`tabIndex="-1"`); when the open pane closes or another pane replaces it while focus is inside it, focus moves to its launcher. Focus is read through open shadow roots, so this holds for a panel inside one.

Implementation: `src/components/dock-panel/dock-panel-launchers.tsx`, `src/components/dock-panel/use-dock-panel-focus.ts`, `src/utils/focus-target.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

## UIC-DOCK-PANEL-3 - Size

### UIC-DOCK-PANEL-3.1 - Size and bounds

While expanded and docked, the root shall take its size inline, in pixels, as its width beside a side edge and its height at the bottom, launchers included. `size` controls it, `defaultSize` (320 by default) sets it at first, and `onSizeChange` receives each size from the separator. It stays between `minSize` (200 by default) and `maxSize` (640 by default); `minMainSize` lowers the largest size so the panel leaves that many pixels of its parent's client width (height at the bottom) to the content beside it, never below `minSize`. Collapsed, the root takes no inline size.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-parts.tsx`, `src/components/dock-panel/use-dock-panel-state.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-3.2 - Separator

While expanded and docked, a `ResizeHandle` in a `ui-dock-panel__handle` slot shall resize the panel from its inner edge: a vertical bar beside a side edge and a horizontal one at the bottom, named by the provider's `resizePanel` string from the panel's label, controlling the body, reporting the size and its bounds. Moving it toward the main content grows the panel. The arrow keys step 10 pixels, Shift+arrows 2, and Home and End jump to the bounds; a pointer drag follows the pointer pixel for pixel, and the root publishes `data-resizing` while it lasts.

Implementation: `src/components/dock-panel/dock-panel-parts.tsx`, `src/components/split-view/resize-handle.tsx`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

### UIC-DOCK-PANEL-3.3 - Persisted state

With `persistKey`, the panel shall restore its uncontrolled selection, expanded state and size from the provider storage under `<persistKey>:selected`, `<persistKey>:expanded` and `<persistKey>:size` and save each as it changes, the size when a drag ends or after a key step, never during a drag. A drag running when the persist key, the storage adapter or the size bounds change shall be abandoned: its live size is dropped, `data-resizing` clears, and its release commits nothing under either key. A stored value that cannot be read, or a stored pane that is no longer enabled, falls back to the defaults.

Implementation: `src/components/dock-panel/use-dock-panel-state.ts`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

## UIC-DOCK-PANEL-4 - Overlay

### UIC-DOCK-PANEL-4.1 - Drawer below a width

While its parent's client width is below `overlayBelow` pixels, the panel shall publish `data-overlay`, keep its body hidden, render no separator and take no inline size, so only its launchers stay in the frame. A launcher press then selects its pane and opens it in a `Drawer` (`ui-dock-panel__drawer` on its overlay) at the panel's `position`, titled by the pane's `title` or else its `label`, with a close button. The drawer's body holds a `ui-dock-panel__drawer-body` element, which holds the panes element while the drawer is open; there only the selected pane shows, the others stay hidden and inert, and the drawer's modal focus containment and dismissal cover the pane. Closing the drawer, or docking, moves the panes element back into the body, keeping every pane mounted. The toggle opens the selected pane the same way. The drawer never opens by itself, whatever the expanded state, and leaves that state unchanged; Escape, an outside press, the close button or the open pane's launcher close it, focus returns to the launcher, and it closes when the panel docks again. Launchers and the toggle report the drawer in `aria-expanded`, and launchers announce the dialog they open (`aria-haspopup="dialog"`) instead of naming a pane element. When the panel docks while focus is in the pane, the pane keeps it once docked and shown.

Implementation: `src/components/dock-panel/dock-panel.tsx`, `src/components/dock-panel/dock-panel-parts.tsx`, `src/components/dock-panel/dock-panel-launchers.tsx`, `labs/reference/dock-panel.css`
Verification: `src/components/dock-panel/dock-panel.test.tsx`, `e2e/dock-panel.spec.ts`

## Hooks

| Hook                         | Kind      | Values                   | Description                                                                        |
| ---------------------------- | --------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `ui-dock-panel`              | root      |                          | The panel's `<section>`.                                                           |
| `ui-dock-panel__launchers`   | slot      |                          | The launcher toolbar, with the toggle last.                                        |
| `ui-dock-panel__launcher`    | slot      |                          | A launcher: its button (also `ui-button`) and its count.                           |
| `ui-dock-panel__count`       | slot      |                          | A launcher's count (also `ui-badge`).                                              |
| `ui-dock-panel__toggle`      | slot      |                          | The collapse and expand button (also `ui-button`).                                 |
| `ui-dock-panel__handle`      | slot      |                          | The separator (also `ui-resize-handle`).                                           |
| `ui-dock-panel__body`        | slot      |                          | The docked panel's body, which holds the panes element while no drawer does.       |
| `ui-dock-panel__panes`       | slot      |                          | The one element every pane renders into, in the body or in the drawer.             |
| `ui-dock-panel__drawer`      | slot      |                          | The overlay of the drawer that holds the panes while open (also `ui-drawer`).      |
| `ui-dock-panel__drawer-body` | slot      |                          | The element in the drawer's body that holds the panes element while it is open.    |
| `ui-dock-panel__pane`        | slot      |                          | A pane's `<section>`.                                                              |
| `ui-dock-panel__header`      | slot      |                          | A pane's header row (also `ui-action-row`).                                        |
| `ui-dock-panel__title`       | slot      |                          | A pane's heading.                                                                  |
| `ui-dock-panel__content`     | slot      |                          | A pane's content.                                                                  |
| `data-position`              | attribute | `start`, `end`, `bottom` | The frame edge the panel docks against.                                            |
| `data-orientation`           | attribute | `horizontal`, `vertical` | The launcher toolbar's direction.                                                  |
| `data-expanded`              | state     | `true`                   | The docked panel shows its selected pane.                                          |
| `data-overlay`               | state     | `true`                   | The parent is narrower than `overlayBelow`: the open pane shows in a drawer.       |
| `data-resizing`              | state     | `true`                   | A pointer drag on the separator is in progress.                                    |
| `data-selected`              | state     | `true`                   | On a launcher, its pane is the selected one, whether or not the panel is expanded. |
