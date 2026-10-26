---
'@flamboyantengineer/ui-components': minor
---

Question cards accept answers asynchronously.

- `ChatQuestion`'s `onSubmit` and `onDismiss` may return a promise. While it is unsettled the card publishes `data-submitting`, the pressed button is pending and keeps focus, the answers are read-only and a second press sends nothing. A rejection or a throw keeps every chosen option, typed answer and the question shown, and announces why in `ui-chat-question__error` (the error's message, else the new `questionSubmitFailed` string, or the common `actionFailed` for a dismissal), so the reader can retry. The card keeps the answers until the host changes its `status`.
- Without `onSubmit` a pending card is read-only: no Submit, options and fields that take no changes (`data-readonly` on the options), and Next to step through its questions.
- A card's drafts, step and requests belong to its `id`: a card that changes `id` starts afresh, and a request settling after the card changed, settled or unmounted changes nothing.
- `ChatParts`' and `Chat`'s `onAnswerQuestion` and `onDismissQuestion` may return a promise the card awaits, and `Chat` starts every message's parts afresh when `conversationId` changes, so a question's drafts and pending request never carry over to another conversation.
