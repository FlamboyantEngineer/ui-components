---
'@flamboyantengineer/ui-components': minor
---

A `BooleanField` checkbox, switch or toggle button without `allowsUnset` now starts `false`, not unset, so an ordinary checkbox never starts mixed, and `isRequired` asks it for `true` (consent). The segmented and dropdown variants, and any variant with `allowsUnset`, still start unset and, when required, accept either answer.
