---
'@flamboyantengineer/ui-components': minor
---

`ChatList` draws its loading placeholders like the rows they stand for, shaped by the new `loadingRows` prop (`titles`, `icons` or `avatars`), and adds `isLoadingMore`: while the next conversations load, given by the prop or by a promise `onLoadMore` returns, placeholder rows follow the rows and the Load more row reads Loading with a spinner.
