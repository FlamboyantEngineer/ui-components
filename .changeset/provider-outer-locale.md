---
'@flamboyantengineer/ui-components': patch
---

A `UiProvider` without `locale` now formats its text and `useFormatMessage` in the locale React Aria uses below it: a parent provider's, a host `I18nProvider`'s, or the browser's. Before, it fell back to `en-US`. One internal default locale replaces the three hard-coded `en-US` literals.
