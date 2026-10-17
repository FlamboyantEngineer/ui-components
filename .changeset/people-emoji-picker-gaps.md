---
'@flamboyantengineer/ui-components': minor
---

Close gaps in the avatar, user identity, presence, user card and emoji picker components.

- `Avatar`: `shape` (`circle`, `rounded`, `square`, published in `data-shape`), `imageProps` (`srcSet`, `sizes`, `crossOrigin`, `referrerPolicy`, `loading`) and `onLoadingStatusChange` (`idle`, `loading`, `loaded`, `error`) with `data-loading` while the picture loads. `shape` and `imageProps` are identity fields, so every component that draws an avatar passes them on. New types `AvatarShape`, `AvatarImageProps`, `AvatarLoadingStatus`.
- `UserIdentity`: `status` and `statusLabel` draw a status badge (`__indicator`, `data-status`) named by the label and read after the name.
- `UserCardTrigger`: `trigger="hover"` opens the card on hover, keyboard focus or long press after `delay`, without taking focus, and closes it after `closeDelay` (React Aria `PreviewTrigger`; the popover's `data-trigger` can be `PreviewTrigger`); `isOpen`, `defaultOpen` and `onOpenChange` control it in either mode. New type `UserCardTriggerType`.
- `UserCard`: `isLoading` shows a decorative skeleton (`__skeleton`) in place of the status, details and actions, with `data-loading` and `aria-busy`.
- `PresenceAvatar`: `nameTooltip` shows the name and status in a tooltip on hover and keyboard focus (a static avatar then becomes a focusable image), and `cardTrigger` opens its card on hover.
- `PresenceStrip`: `overflow="menu"` makes the `+N` count a button that opens a menu of the hidden people (`__menu`, `data-overflow`, and React Aria's button states on the count); `nameTooltip` and `cardTrigger` reach every person. New type `PresenceStripOverflow`.
- `EmojiPicker`: emoji names and search keywords in 27 more Emojibase locales, loaded on demand as separate chunks, following the React Aria locale by default (`loadEmojiData(locale)`); the emoji and country flags the platform cannot draw are left out unless `renderEmoji` draws them; `emojiVersion`, `categories` and `filterEmoji` choose what is offered; `NativeEmoji` gains `version`. Its parts `EmojiPickerSearch`, `EmojiPickerBody`, `EmojiPickerPreview` and `EmojiPickerSkinTones` can be laid out as the picker's `children`, and `useActiveEmoji()` reads the emoji last hovered or focused. Down in the search field now always moves to the first emoji.
