---
'@flamboyantengineer/ui-components': minor
---

Show what an assistant is thinking or doing inside its reply, in the styles common assistant chats use:

- **Thinking in the reply:** while a reply streams and the assistant thinks or acts, `Chat` ends the reply with a `ChatStatusLine` (`ui-chat__status`) instead of a line below the transcript. It reads the reply's `statusText`, else the new `thinkingText` prop, else "Thinking…", and `thinkingIcon` replaces its busy indicator.
- **How long it shows:** `thinkingUntil` keeps the line until the reply's first `content`, until its `text` (the default: through reasoning and tool calls), or until its `end`, showing the indicator or icon alone while the text streams in.
- **`ChatStatusLine`:** `text` is optional and defaults to the provider string `chatThinking` ("Thinking…"); `icon` shows in place of the busy indicator (`ui-chat-status-line__icon`); `activity` `writing` shows the indicator alone and publishes `data-activity`.
- **Reasoning summaries:** a reasoning part's `title` labels it while it streams, and labels its running group of steps. `ChatReasoning` and `ChatSteps` take `title` and `expandsAutomatically`; `ChatParts` and `Chat` take `expandsActivity`, which keeps reasoning and steps closed while they run.
- **Reference stylesheet:** the status line's text and the labels of streaming reasoning and running steps shimmer; the status line's icon pulses. Both hold still under reduced motion.
- **Typing indicator:** `ChatTypingIndicator` only says who is typing; its `variant` prop, `ChatTypingIndicatorVariant` and `data-variant` are removed, and `chatThinking` is now a plain string.
