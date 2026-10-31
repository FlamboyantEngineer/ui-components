---
'@flamboyantengineer/ui-components': minor
---

Add a shared `PresenceStatus` type (`active`, `away`, `busy`, `idle`). StatusLight, Avatar, UserIdentity, UserCard and ChatList participants take it, and the status in words now defaults to the provider's `presenceStatus` string, with `statusLabel` (or `presenceLabel`) as an override. `StatusLightStatus` is removed in favour of `PresenceStatus`, and free-text status words are no longer accepted.
