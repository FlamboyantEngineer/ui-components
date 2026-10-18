---
'@flamboyantengineer/ui-components': minor
---

Make the public API of the overlays and menus library-owned: every props interface, state, value and trigger of `Menu`, `Menubar`, `ContextMenu`, `DropdownMenu`, `CommandPalette`, `Modal`, `Popover`, `Drawer`, `HoverCard`, `Tooltip`, `Toast`, `UserCard` and `PresenceAvatar` is declared by the library, so no public declaration of theirs exposes React Aria. New shared prop groups `OverlayPositionProps` (`placement`, `offset`, `crossOffset`, `shouldFlip`, `containerPadding`) and `OverlayDismissProps` (`isDismissable`, `isKeyboardDismissDisabled`, `shouldCloseOnInteractOutside`). `specs/COLLECTIONS.md` is now the contract every collection component follows: virtualized rendering and incremental loading are component props, and callers never assemble building-block collections.

Breaking:

- `Menu`: virtualize with `virtualized` (and `rowHeight`, 24, 28 or 32 pixels by `size` by default) instead of wrapping it in React Aria's `Virtualizer`; load more with `onLoadMore` and `isLoading` instead of a `MenuLoadMoreItem` child. A virtualized menu publishes `data-virtualized`. Props are declared: React Aria pass-through props (`onClose`, `autoFocus`, `escapeKeyBehavior`, `onScroll`, …) are gone, and `onAction` receives only the key.
- `MenuTrigger` and `SubmenuTrigger` are library components (`MenuTriggerProps`: `isOpen`, `defaultOpen`, `onOpenChange`, `children`; `SubmenuTriggerProps`: `children`); React Aria's `trigger` and `delay` options are gone.
- `MenuItemRenderProps` is replaced by `MenuItemRenderState` (`isHovered`, `isFocused`, `isFocusVisible`, `isPressed`, `isSelected`, `isDisabled`, `selectionMode`, `hasSubmenu`, `isOpen`). `MenuItemProps` and `MenuSectionProps` declare their props (items keep `href` and the press handlers, and lose React Aria's hover, focus and other pass-through props); `MenuPopoverProps` takes `layer`, `ref` and the overlay position props only.
- `Toast` is no longer exported: toasts are drawn by `ToastRegion` and `ToastList`. `ToastQueue` no longer exposes `ariaQueue`, and a region or list given a queue `createToastQueue` did not make throws. `ToastAddOptions` declares `onClose` and `timeout` itself.
- `Modal`: open it from the new `ModalTrigger` instead of React Aria's `DialogTrigger`; `role` takes `ModalRole` (`dialog` or `alertdialog`).
- `Drawer`: `preventDismissal` is renamed `isDismissDisabled`, as on `Modal`; `swipeDirection` takes `DrawerSwipeDirection`; other React Aria sheet props are gone. `DrawerTriggerProps`, `PopoverTriggerProps` and `HoverCardTriggerProps` are library interfaces (open state, `children`, and for the hover card `delay`, `closeDelay`, `isDisabled`).
- `Popover`, `HoverCard`: props are declared (overlay position, dismissal, `triggerRef`, `isNonModal`, labelling); undocumented React Aria popover props are gone.
- `Tooltip`: props are declared (`delay`, `closeDelay`, `trigger` as `TooltipTriggerType`, `isDisabled`, `shouldCloseOnPress`, open state); `TooltipPlacement` is the library `Placement`.
- `CommandPalette`: `filter` is a `CommandPaletteFilter`, `(textValue, inputValue) => boolean`.
- `UserCard` takes `aria-label` but no other React Aria dialog props; `UserCardTrigger` takes the press handlers and `isDisabled` instead of every React Aria button prop.
- `DropdownMenu`, `ContextMenu`: `placement` is the library `Placement`.
