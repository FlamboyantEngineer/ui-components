---
'@flamboyantengineer/ui-components': minor
---

Add `Image`, a general-purpose image that owns its request. It forwards `src`, `srcSet`, `sizes`, `loading`, `decoding`, `crossOrigin`, `referrerPolicy`, `width` and `height` to its `<img>`, requires `alt` (empty for a decorative image), and publishes `data-status` (`loading`, `loaded`, `error`) with `onLoadingStatusChange`. It shows `placeholder` content while loading, tries `fallbackSrc` once when `src` fails, then draws `fallback` content named by `alt`, and `showRetry` offers a Reload image button (the new `imageRetry` string). An image settled before hydration or from the cache counts as settled, a new source never inherits an old failure, and `--ui-image-width` and `--ui-image-height` let the stylesheet reserve the same box for the placeholder and fallback. Avatar's picture tracking is now shared with it.
