# Comment Thread

`CommentThread` is one discussion: the text or other anchor it is about, an opening comment and its replies, resolve and reopen, an error and a composer for the next reply. Each comment is a `CommentThreadReply`: its author with a live time and an edited marker, the body as caller content (plain text, Markdown or rich text rendered by the host), reactions, and a menu with the caller's actions plus Edit in place and Delete after confirmation. The composer is a slot: by default a [Comment Composer](COMMENT-COMPOSER.md), or the host's own. The host owns the comments, their order and persistence; the thread reports what the reader does. A thread with no comments is a new one, whose composer starts the discussion.

## UIC-COMMENT-THREAD-1 - Thread

### UIC-COMMENT-THREAD-1.1 - Comments and anchor

`CommentThread` shall render a `ui-comment-thread` element holding, in order: a `ui-comment-thread__header` when it has a quote, a resolved badge or a resolve button; the comments; the error; and the composer. `quote` renders in a `<blockquote>` in the `ui-comment-thread__quote` slot. The children, the opening comment first, render as an ordered list (`ui-comment-thread__comments`), each child in a `ui-comment-thread__item` list item; the children of a fragment, at any depth, count as children of their own, each keeping its identity, and a thread without children, or with only empty fragments, draws no list.

Implementation: `src/components/comment-thread/comment-thread.tsx`
Verification: `src/components/comment-thread/comment-thread.test.tsx`, `src/components/comment-thread/comment-thread-drafts.test.tsx`, `src/utils/flatten-children.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-1.2 - Default composer

With `onReply`, the thread shall end with a `CommentComposer` in the `ui-comment-thread__composer` slot whose submitted text goes to `onReply`, with the composer's pending and failure behaviour ([UIC-COMMENT-COMPOSER-1.3](COMMENT-COMPOSER.md#uic-comment-composer-13---pending-submits)). It is named and submits with the provider's `reply` string, or, in a thread without comments, is named by `addComment` and submits with `comment`. Without `onReply` or `composer` there is no composer slot.

Implementation: `src/components/comment-thread/comment-thread.tsx`, `src/core/strings/content.ts`
Verification: `src/components/comment-thread/comment-thread.test.tsx`, `src/components/comment-thread/comment-thread-drafts.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-1.3 - Caller composer

`composer` shall render in the composer slot in place of the default composer, so a host can reply with mentions, attachments or rich text. The [Rich Message Composer](MESSAGE-COMPOSER.md) fits there and in `renderEditor` (UIC-COMMENT-THREAD-2.3): `@` inserts a mention pill and its emoji button inserts at the caret. The thread and its comments carry plain text, so the host keeps each message's mentions beside its text, starts an edit from them, and draws them in the comment's children, for example through [Chat Parts](CHAT-PARTS.md).

Implementation: `src/components/comment-thread/comment-thread.tsx`
Verification: `src/components/comment-thread/comment-thread.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-1.4 - Resolve and reopen

The resolved state shall be controlled by `isResolved` or start at `defaultResolved`. While resolved, the root carries `data-resolved`, the header shows a success `Badge` in `ui-comment-thread__status` reading the provider's `resolved` string, and the composer is hidden: replying needs the thread reopened ([UIC-COMMENT-THREAD-1.9](#uic-comment-thread-19---replies-outlast-a-closed-thread)). With `onResolvedChange`, the header has a ghost `Button` in `ui-comment-thread__resolve`, reading `resolve` with the `check` glyph, or `reopen` with the `undo` glyph while resolved, that flips the state and reports it.

Implementation: `src/components/comment-thread/comment-thread.tsx`
Verification: `src/components/comment-thread/comment-thread.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-1.5 - Long threads

With `visibleReplies`, a thread with more replies than that shall show the opening comment, then a `ui-comment-thread__more` list item holding a ghost `Button` (`ui-comment-thread__show-more`) that reads the provider's `showMoreReplies` string with the number of hidden replies, then the latest `visibleReplies` replies. Pressing it shows every reply and moves focus to the first revealed reply's list item, which takes focus programmatically only.

Implementation: `src/components/comment-thread/comment-thread.tsx`
Verification: `src/components/comment-thread/comment-thread.test.tsx`, `src/components/comment-thread/comment-thread-drafts.test.tsx`, `src/utils/flatten-children.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-1.6 - Read-only and selected

With `isReadOnly`, the root shall carry `data-readonly` and the thread shall draw no composer, no resolve button and no comment menus; the comments stay readable. `isSelected`, for the thread whose anchor is current, publishes `data-selected`.

Implementation: `src/components/comment-thread/comment-thread.tsx`, `src/components/comment-thread/comment-thread-context.ts`
Verification: `src/components/comment-thread/comment-thread.test.tsx`, `src/components/comment-thread/comment-thread-reply.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-1.7 - Error

A non-empty `error` shall render as an `InlineError` alert in the `ui-comment-thread__error` slot, after the comments and before the composer.

Implementation: `src/components/comment-thread/comment-thread.tsx`
Verification: `src/components/comment-thread/comment-thread.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-1.8 - Accessibility, hooks and caller attributes

The root shall be a `role="group"` named by `aria-label` or `aria-labelledby`, else by the provider's `commentThread` string. It shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id`.

Implementation: `src/components/comment-thread/comment-thread.tsx`
Verification: `src/components/comment-thread/comment-thread.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-1.9 - Replies outlast a closed thread

Once the thread has drawn its composer, the composer shall stay mounted while the thread is resolved or read-only, its slot carrying `hidden`, so an unsent reply in the default composer, the state of a caller's composer and a pending reply all return when replying is possible again. A resolve or a read-only spell neither submits, clears nor cancels the draft, and a reply sent before it settles as before: once accepted it clears the draft only while the draft is still the text it sent ([UIC-COMMENT-COMPOSER-1.3](COMMENT-COMPOSER.md#uic-comment-composer-13---pending-submits)). Each thread keeps its own draft. A thread that is resolved or read-only from the start draws no composer until replying is possible.

Implementation: `src/components/comment-thread/comment-thread.tsx`
Verification: `src/components/comment-thread/comment-thread-drafts.test.tsx`, `e2e/comment-thread.spec.ts`

## UIC-COMMENT-THREAD-2 - Comments

### UIC-COMMENT-THREAD-2.1 - Author, time and body

`CommentThreadReply` shall render a `ui-comment-thread-reply` `<article>` whose `ui-comment-thread-reply__header` holds a small `UserIdentity` of `author` (`ui-comment-thread-reply__author`) with, on its description line, an [Attribution](ATTRIBUTION.md) of `time` alone (`ui-comment-thread-reply__time`) read against `getNow` with `fallbackAfterDays` and `timeZone`, the provider's `unknownTime` string when it is missing, and, with `isEdited`, the provider's `edited` string in `ui-comment-thread-reply__edited` and `data-edited` on the root. The body follows in `ui-comment-thread-reply__body`: the children as the caller renders them, else `text`. `reactions`, such as a [Reaction Bar](REACTION-BAR.md), render after it in `ui-comment-thread-reply__reactions`. The article is named by the author's display name. The reference stylesheet indents the body, the reactions, an editor and its error past the small avatar, so their text lines up under the author's name, trims the outer margins of a body the host renders in blocks, and lets the composer fill the thread's width.

Implementation: `src/components/comment-thread/comment-thread-reply.tsx`
Verification: `src/components/comment-thread/comment-thread-reply.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-2.2 - Comment menu

When the comment has `actions`, `onEdit` or `onDelete`, its header shall end with an icon-only `DropdownMenu` (`ui-comment-thread-reply__actions`) named by the provider's `commentActions` string, listing `actions`, then Edit (`edit` glyph) with `onEdit`, then Delete (`delete` glyph, `danger` tone) with `onDelete`. Choosing a caller action calls `onAction` with its `id`; the built-in actions use the ids `edit` and `delete`.

Implementation: `src/components/comment-thread/comment-thread-reply.tsx`
Verification: `src/components/comment-thread/comment-thread-reply.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-2.3 - Editing in place

Edit shall replace the body and the reactions with an editor in `ui-comment-thread-reply__editor`, the root carrying `data-editing`: by default a focused `CommentComposer` holding `text`, named by the provider's `editComment` string and submitting with `save`; or what `renderEditor` returns, given `defaultValue`, `onSubmit` and `onCancel`. Submitting calls `onEdit` with the text and closes the editor once it succeeds: at once when `onEdit` returns, or once its promise resolves, the editor staying open meanwhile (the default editor pending and refusing a second save). When `onEdit` throws or its promise rejects, the editor stays open with the edited text and shows the error's message, or the provider's `actionFailed` string, as an `InlineError` alert in `ui-comment-thread-reply__error` until the next save; `onSubmit` then throws or rejects, so the editor keeps its text, and a caller editor handles that rejection as `CommentComposer` does. A save settles only the editor it came from: one that has closed, or ended and opened again, is not reopened or closed by it. Cancelling (Cancel or Escape) closes the editor unchanged. When the closing editor takes the focus with it, the focus returns to the comment menu button.

Implementation: `src/components/comment-thread/comment-thread-reply.tsx`
Verification: `src/components/comment-thread/comment-thread-reply.test.tsx`, `src/components/comment-thread/comment-thread-reply-mutations.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-2.4 - Deleting

Delete shall open a danger `Modal` titled by the provider's `deleteComment` string with the `deleteCommentMessage` message and a `delete` confirm action; confirming calls `onDelete`, and cancelling changes nothing. A promise `onDelete` returns keeps the confirm action pending until it settles; the dialog closes once it resolves and stays open with the failure when it rejects ([UIC-MODAL-5.3](MODAL.md#uic-modal-53---failed-actions)).

Implementation: `src/components/comment-thread/comment-thread-reply.tsx`
Verification: `src/components/comment-thread/comment-thread-reply.test.tsx`, `src/components/comment-thread/comment-thread-reply-mutations.test.tsx`, `e2e/comment-thread.spec.ts`

### UIC-COMMENT-THREAD-2.5 - Inside a read-only thread

Inside a read-only `CommentThread`, a comment shall draw no menu and never edit. Its reactions are the caller's content: a `ReactionBar` without `onToggle` is read-only too.

Implementation: `src/components/comment-thread/comment-thread-reply.tsx`, `src/components/comment-thread/comment-thread-context.ts`
Verification: `src/components/comment-thread/comment-thread-reply.test.tsx`

### UIC-COMMENT-THREAD-2.6 - Hooks and caller attributes

`CommentThreadReply` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root.

Implementation: `src/components/comment-thread/comment-thread-reply.tsx`
Verification: `src/components/comment-thread/comment-thread-reply.test.tsx`

### UIC-COMMENT-THREAD-2.7 - Withdrawn actions

When a comment loses `onEdit`, or its thread turns read-only, while its editor is open, the editor shall end with its draft, without calling `onEdit`, and the body returns; the editor does not come back when the permission does. When a comment loses `onDelete` while its confirmation is open, the confirmation shall close without calling `onDelete`, and does not come back when `onDelete` does. Focus the ended editor held returns to the comment menu button when there is one; focus elsewhere stays where it is.

Implementation: `src/components/comment-thread/comment-thread-reply.tsx`
Verification: `src/components/comment-thread/comment-thread-reply-mutations.test.tsx`, `e2e/comment-thread.spec.ts`

## Hooks

| Hook                                 | Kind  | Values | Description                                                      |
| ------------------------------------ | ----- | ------ | ---------------------------------------------------------------- |
| `ui-comment-thread`                  | root  |        | The `role="group"` thread.                                       |
| `ui-comment-thread__header`          | slot  |        | The quote, the resolved badge and the resolve button.            |
| `ui-comment-thread__quote`           | slot  |        | The quoted anchor (`<blockquote>`).                              |
| `ui-comment-thread__status`          | slot  |        | The resolved badge (also `ui-badge`).                            |
| `ui-comment-thread__resolve`         | slot  |        | The resolve or reopen button (also `ui-button`).                 |
| `ui-comment-thread__comments`        | slot  |        | The ordered list of comments.                                    |
| `ui-comment-thread__item`            | slot  |        | One comment's list item.                                         |
| `ui-comment-thread__more`            | slot  |        | The list item holding the button that reveals hidden replies.    |
| `ui-comment-thread__show-more`       | slot  |        | That button (also `ui-button`).                                  |
| `ui-comment-thread__error`           | slot  |        | The error (also `ui-inline-error`).                              |
| `ui-comment-thread__composer`        | slot  |        | The composer: the default `CommentComposer` or the caller's.     |
| `data-resolved`                      | state | `true` | The discussion is closed.                                        |
| `data-readonly`                      | state | `true` | The thread refuses changes.                                      |
| `data-selected`                      | state | `true` | The thread is the current one.                                   |
| `ui-comment-thread-reply`            | root  |        | One comment (`<article>`).                                       |
| `ui-comment-thread-reply__header`    | slot  |        | The author and the menu.                                         |
| `ui-comment-thread-reply__author`    | slot  |        | The author (also `ui-user-identity`).                            |
| `ui-comment-thread-reply__time`      | slot  |        | When it was posted (also `ui-attribution`).                      |
| `ui-comment-thread-reply__edited`    | slot  |        | The edited marker.                                               |
| `ui-comment-thread-reply__actions`   | slot  |        | The comment menu button (also `ui-dropdown-menu`).               |
| `ui-comment-thread-reply__error`     | slot  |        | Why the last save of the editor failed (also `ui-inline-error`). |
| `ui-comment-thread-reply__body`      | slot  |        | The body.                                                        |
| `ui-comment-thread-reply__editor`    | slot  |        | The editor that replaces the body while editing.                 |
| `ui-comment-thread-reply__reactions` | slot  |        | The reactions under the body.                                    |
| `data-edited`                        | state | `true` | The comment changed after it was posted (on the reply).          |
| `data-editing`                       | state | `true` | The reader is editing the comment (on the reply).                |
