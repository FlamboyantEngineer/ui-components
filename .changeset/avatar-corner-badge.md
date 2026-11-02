---
'@flamboyantengineer/ui-components': minor
---

`Avatar` takes a corner badge: `badge` draws caller content, such as a country flag, on a corner outside the clipped picture, `badgePlacement` picks the corner (the status indicator keeps the bottom end), and `badgeLabel` adds the badge's words to the avatar's name. The badge is hidden and inert, so it adds no focus target. `UserIdentity` and `UserCard` pass the badge on, and the identity row reads its words after the name and status.
