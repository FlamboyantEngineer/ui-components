---
'@flamboyantengineer/ui-components': minor
---

The streaming caret is now opt-in. `ChatMessage` gains `streamingCaret`, which publishes `data-streaming-caret` on a received message that streams, and the reference stylesheet draws `▍` only on that attribute, never for `data-status="streaming"` alone. `Chat` gains a `streamingCaret` display option that shows the caret only while a reply's text streams in, not while it thinks, runs tools, or after it completes or is cancelled. Streaming messages stay busy either way.
