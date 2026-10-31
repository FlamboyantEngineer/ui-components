---
'@flamboyantengineer/ui-components': minor
---

Field controls submit their form values through one shared hidden-input part. Every BooleanField variant now submits `true` or `false` (nothing while unset or disabled): a named checkbox or switch that is off submits `false` instead of nothing, and its native input no longer carries the `name`.
