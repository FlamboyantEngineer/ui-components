---
'@flamboyantengineer/ui-components': patch
---

`ChatTranscript` runs its commit pass (arrivals, positions, scroll keeping, unread state) only when the children's keys, the virtualized window or the scrolling settings change. A render that only streams a token into a reply reads no layout; the reply's resize keeps the bottom in view once. The keys are diffed once per change and the unread count reads only from the first unread message on.
