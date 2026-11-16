---
'@flamboyantengineer/ui-components': minor
---

Controls a document editor needs:

- Comment mentions take queries with spaces, so a full name narrows the list; a spaced query that finds nobody closes the list and ends the lookup (also for any host trigger with `allowsSpaces`). `createCommentMentions` takes `resolvePaste`, which turns pasted text into mentions, and `getListBoundary`, the element the list stays inside. `RichMessageComposer` and its field take `completionBoundary`, and `CompletionList` takes `boundaryElement`.
- A comment composer's submit button moves focus to the text box after a submit.
- `CommentThread`'s `onResolvedChange` may return a promise: Resolve and Reopen stay pending until it settles.
- `AnnotationMargin` takes `allowsOverflowAbove` (cards may start above the margin's top so the active card stays level with its anchor) and `clearsActiveOnBlur`; focus on a card's menu button no longer makes the card active.
- Math Preview shows the provider string `mathInvalid` for source that does not typeset, with the typesetter's reason in a new `ui-math-preview__detail` slot.
- A result in `AssetPicker` whose thumbnail fails to load shows `assetThumbnailUnavailable` in its place.
- `CharacterGrid` takes `fontWeight`, `fontStyle` and `color`, and each cell's tooltip shows its character and code (`Alt+0169`, or `U+20AC` above U+00FF).
