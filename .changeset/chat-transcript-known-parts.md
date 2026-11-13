---
'@flamboyantengineer/ui-components': patch
---

`ChatTranscript` knows `ChatDateSeparator`, `ChatUnreadDivider` and `ChatTypingIndicator` children as parts before they mount, so a virtualized transcript no longer counts unmounted separators as messages (the unread count, `aria-posinset` and `aria-setsize`), Home reaches the first message with its separator in view, older history loaded under a day's separator is no longer announced as new messages, and a conversation that shares only a separator with the last one starts over. A scroll of one pixel at a time, as a precision touchpad makes, now moves the view where the transcript used to undo it.
