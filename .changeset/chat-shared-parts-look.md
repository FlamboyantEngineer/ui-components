---
'@flamboyantengineer/ui-components': minor
---

Chat renders through the shared parts: messages through `Message` and `Bubble` (the reader's on a `secondary` bubble at the end, others' on `muted`, plain replies and notices on `ghost`), reasoning, steps and tool-call titles through the `Trace` parts, and the date and unread dividers through `Marker`. The `ui-chat-reasoning__indicator` and `ui-chat-steps__indicator` hooks are removed; the trace's own `ui-trace__collapsible-indicator` takes their place. Jump to latest is an icon-only button while nothing new is unseen. The reference and shadcn stylesheets restyle Chat after the assistant look: trace lines with a ruled panel, rounded code and output cards, a round jump button, the composer as one rounded box with round buttons, and the queue as a box on the composer's top edge, a little narrower, with only its top corners rounded.
