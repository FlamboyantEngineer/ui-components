---
'@flamboyantengineer/ui-components': patch
---

`Avatar` settles a picture that failed before hydration as `error` and shows the initials, and restarts loading when `imageProps` change the request (`srcSet`, `sizes`, `crossOrigin`, `referrerPolicy`), so a working responsive candidate offered after a failure loads. Each request gets its own image element, so events from a departed request are ignored.
