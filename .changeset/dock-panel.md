---
'@flamboyantengineer/ui-components': minor
---

Add `DockPanel` and `DockPanelPane`.

- `DockPanel` (new): a panel docked against the `start`, `end` or `bottom` edge of an application frame. A toolbar of pane launchers (icon buttons named and tooltipped by each pane's label, with counts) stays visible while the panel is collapsed; one pane is open at a time; a launcher opens its pane and moves focus into it, and pressing the open pane's launcher (or the toggle) collapses the panel. `selectedKey`, `isExpanded` and `size` are controlled or uncontrolled (`defaultSelectedKey`, `defaultExpanded`, `defaultSize`, `onSelectionChange`, `onExpandedChange`, `onSizeChange`); `minSize`, `maxSize` and `minMainSize` bound the size; a `ResizeHandle` resizes it by pointer and keyboard; `persistKey` saves the uncontrolled values through the provider storage; below `overlayBelow` the open pane shows in a `Drawer`. Hooks: `ui-dock-panel`, `__launchers`, `__launcher`, `__count`, `__toggle`, `__handle`, `__body`, `__drawer`, `__pane`, `__header`, `__title`, `__content`, `data-position`, `data-orientation`, `data-expanded`, `data-overlay`, `data-resizing`, `data-selected`.
- `DockPanelPane` (new): a pane's `id`, `label`, `icon`, `count` and `isDisabled` for its launcher, and a header row with `title` and `ActionRow` `actions` above its content. Panes stay mounted, hidden and inert while another is open.
- Provider strings: `panelPanes`, `collapsePanel`, `expandPanel` and `resizePanel`.
