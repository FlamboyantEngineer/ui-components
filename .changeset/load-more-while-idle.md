---
'@flamboyantengineer/ui-components': patch
---

`CardGrid` and `ListView` no longer call `onLoadMore` while `isLoading` is true. React Aria asks for more each time its collection changes with the end in view, so a page that re-rendered while a request was loading received repeated requests.
