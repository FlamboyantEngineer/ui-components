---
'@flamboyantengineer/ui-components': minor
---

Show what an assistant is thinking or doing inside its reply:

- **Thinking in the reply:** while a reply streams and the assistant thinks or acts (no parts yet, reasoning or a tool call last, or a `statusText`), `Chat` ends the reply with a `ChatStatusLine` (`ui-chat__status`) instead of a line below the transcript. It reads the reply's `statusText`, else the new `thinkingText` prop, else "Thinking…", and `thinkingIcon` replaces its busy indicator.
- **`ChatStatusLine`:** `text` is optional and defaults to the provider string `chatThinking` ("Thinking…"); `icon` shows in place of the busy indicator (`ui-chat-status-line__icon`). The reference stylesheet shimmers its text.
- **Typing indicator:** `ChatTypingIndicator` only says who is typing; its `variant` prop, `ChatTypingIndicatorVariant` and `data-variant` are removed, and `chatThinking` is now a plain string.
