---
'@flamboyantengineer/ui-components': minor
---

Make the public API of the action, navigation and foundation components library-owned: their props, values, render states and helpers are declared by the library, so no public declaration exposes a building block.

New exports: `ButtonRenderState`, `ButtonGroupRenderState`, `LinkRenderState`, `SegmentedChoiceRenderState`, `TabsRenderState`, `TabListRenderState`, `TabRenderState`, `TabPanelRenderState`, `TabsKeyboardActivation`, `SeparatorRenderState`, `SeparatorElement`, `VisuallyHiddenElement`, `FocusableElement`, `DisclosureRenderState`, `DisclosureGroupRenderState`, `DisclosurePanelRenderState`, `DisclosurePanelRole`, `MeterRenderState` and `ProgressRangeProps`. `FocusManager` and `FocusManagerOptions` are now library interfaces and `useFocusManager` a library hook.

Breaking:

- Props interfaces no longer extend React Aria props; undocumented pass-through props are gone. Collection keys are the library `Key`, events the library `PressEvent` and `HoverEvent`.
- `Button` (and so `IconButton`, `ActionButton`): declares press, hover, focus and keyboard handlers, `isDisabled`, `isPending`, `type`, `autoFocus`, `excludeFromTabOrder`, `preventFocusOnPress`, `hidden`, `slot`, link mode and toggle mode; `render` receives a `ButtonRenderState`. Form props (`form`, `name`, `value`, `formAction`…) are no longer accepted.
- `ButtonGroup`: `render` receives a `ButtonGroupRenderState`; DOM event handlers and React Aria's group props are no longer accepted.
- `Link`: `children` is a node, not a render function; `render` receives the anchor's props and a `LinkRenderState`; `ping`, `referrerPolicy`, `hrefLang` and other pass-throughs are no longer accepted; `routerOptions` is `unknown`.
- `SegmentedChoice`: declares `isDisabled` and `orientation`; `render` receives a `SegmentedChoiceRenderState`.
- `Tabs`: `selectedKey` is a `Key` (no `null`); `TabListProps` is no longer generic and takes no `items` or `dependencies`; `Tab` forwards only `onContextMenu` among DOM handlers; each part's `render` receives a library state.
- `Breadcrumb`: `onAction` receives a library `Key`.
- `Separator`: `elementType` is `'hr' | 'div' | 'li'`; `render` receives a `SeparatorRenderState` instead of `undefined`.
- `ToolbarRowGroup` takes `children` and ARIA labelling props only; `ToolbarRowSeparator` takes `BaseProps`. The `data-disabled` hook of `ui-toolbar-row__group` is removed.
- `VisuallyHidden`: `elementType` is `'div' | 'span'`; besides `role`, `onFocus` and `onBlur`, DOM props are no longer accepted.
- `FocusScope`: `useFocusManager` returns the library `FocusManager`.
- `Disclosure`, `DisclosureGroup`, `DisclosurePanel`: declared state props (`isExpanded`, `defaultExpanded`, `onExpandedChange`, `expandedKeys`, `defaultExpandedKeys`, `allowsMultipleExpanded`, `isDisabled`, `role`); `render` receives a library state.
- `DragHandle`: takes `isDisabled`, `excludeFromTabOrder` and ARIA labelling props only.
- `ProgressBar` and `Meter`: declared range props (`value`, `minValue`, `maxValue`, `valueLabel`, `formatOptions`); `Meter`'s `render` receives a `MeterRenderState`.
