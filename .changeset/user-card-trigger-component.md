---
'@flamboyantengineer/ui-components': minor
---

`UserCardTrigger` is now its own component, exported from the package root and `@flamboyantengineer/ui-components/user-card-trigger` instead of `user-card`. It no longer imports `UserCard` or `UserIdentity`, so `Avatar` and `Attribution` no longer load the card code and the avatar, user card and user identity modules no longer import each other in a cycle. Its hooks are renamed: `ui-user-card__trigger` is now the root `ui-user-card-trigger`, and `ui-user-card__popover` is now `ui-user-card-trigger__popover`. `check:structure` now rejects import cycles between components (S8), and the record label's chip parts no longer import its main module.
