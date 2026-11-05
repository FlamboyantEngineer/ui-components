---
'@flamboyantengineer/ui-components': minor
---

`Link`'s `ref` is typed `Ref<HTMLAnchorElement | HTMLSpanElement>` and `Button`'s `Ref<HTMLButtonElement | HTMLAnchorElement | HTMLSpanElement>`, matching the `<span>` a disabled link, or a `Link` without `href`, hands its ref, so a ref callback no longer type-checks anchor-only access that fails at runtime.
