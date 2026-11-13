---
'@flamboyantengineer/ui-components': minor
---

`ChatTranscript` now announces a message's failure itself, through its live region: when a message fails while it is mounted (a streaming reply out of view included) and when a message arrives already failed. Inside a transcript the `error` text of a `ChatMessage` therefore has no `role="alert"` any more, where it was read again each time a virtualized transcript mounted the message and never for a reply that failed out of view; outside a transcript it stays an alert. The announcer also keeps announcing after an `Activity` hid the transcript with an announcement pending.
