# Message

## UIC-MESSAGE-1 - Composition

### UIC-MESSAGE-1.1 - Message parts

`Message` renders a native article with a caller-supplied name and content. It accepts start and end alignment and marks the article busy while `isStreaming`. Place `MessageContent` and `MessageFooter` inside it to lay out the body and associated metadata or actions.

Implementation: `src/components/message/message.tsx`
Verification: `src/components/message/message.test.tsx`, `e2e/message.spec.ts`

## Hooks

| Hook                  | Kind      | Values         | Description          |
| --------------------- | --------- | -------------- | -------------------- |
| `ui-message`          | root      |                | One message article. |
| `ui-message__content` | slot      |                | The article's body.  |
| `ui-message__footer`  | slot      |                | Metadata or actions. |
| `data-align`          | attribute | `start`, `end` | Logical alignment.   |
| `data-streaming`      | state     | `true`         | The article is busy. |
