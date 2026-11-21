# Message

## UIC-MESSAGE-1 - Composition

### UIC-MESSAGE-1.1 - Message parts

`Message` renders a native article with a caller-supplied name and content. It accepts start and end alignment and marks the article busy while `isStreaming`. Place `MessageContent` and `MessageFooter` inside it to lay out the body and associated metadata or actions.

Implementation: `src/components/message/message.tsx`
Verification: `src/components/message/message.test.tsx`, `e2e/message.spec.ts`

### UIC-MESSAGE-1.2 - Groups, avatars and headers

`MessageGroup` (`ui-message-group`) holds consecutive messages of one author, such as one turn of a conversation, in reading order. `MessageAvatar` (`ui-message__avatar`) holds the author's picture or initials, such as an [Avatar](AVATAR.md), as the message's first child; the reference stylesheet sets it beside the content, at the content's end edge, and on the end side of an end-aligned message. `MessageHeader` (`ui-message__header`) holds the author's name, the time or other metadata before the body, inside `MessageContent`. A message without an avatar gives its content the full width. Every part is a plain `<div>` that forwards its native attributes and keeps the caller's markup; none adds a role or a name, so the caller labels the article and its group.

Implementation: `src/components/message/message.tsx`, `labs/reference/message.css`
Verification: `src/components/message/message.test.tsx`, `e2e/message.spec.ts`

## Hooks

| Hook                  | Kind      | Values            | Description                         |
| --------------------- | --------- | ----------------- | ----------------------------------- |
| `ui-message`          | root      | `message`         | One message article.                |
| `ui-message__avatar`  | slot      | `message-avatar`  | The author's picture or initials.   |
| `ui-message__header`  | slot      | `message-header`  | The author, time or other metadata. |
| `ui-message__content` | slot      | `message-content` | The article's body.                 |
| `ui-message__footer`  | slot      | `message-footer`  | Metadata or actions.                |
| `data-align`          | attribute | `start`, `end`    | Logical alignment.                  |
| `data-streaming`      | state     | `true`            | The article is busy.                |
| `ui-message-group`    | root      | `message-group`   | Consecutive messages of one author. |
