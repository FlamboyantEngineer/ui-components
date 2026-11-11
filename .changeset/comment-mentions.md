---
'@flamboyantengineer/ui-components': minor
---

`CommentComposer`, `CommentThread` and `CommentThreadReply` take `mentions`, made by `createCommentMentions({ search, serialize?, parse? })` from the new `comment-composer/rich` entry point: `@` opens a combobox list of the people `search` finds, a chosen person goes in as one chip that deletes whole, and the text holds each mention as a token, `@[Name](id)` by default. The thread passes them to its default composer and to each comment's default editor, so an edit keeps its mentions. `CommentText` draws stored text with its mentions as chips that open the person's card through `renderCard`, and `serializeMention` and `parseMentions` write and read the default token.
