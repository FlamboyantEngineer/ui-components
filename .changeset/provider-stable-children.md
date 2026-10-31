---
'@flamboyantengineer/ui-components': patch
---

`UiProvider` keeps its children mounted when `locale` or `navigate` is given or removed: it always renders React Aria's locale and router providers, passing on the outer locale and navigation while its own option is absent.
