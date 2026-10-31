---
'@flamboyantengineer/ui-components': patch
---

The repository scripts run on Windows: they start npm through one helper, write and read tar archives in Node, stop the Next.js server they start without a process group, build the Git dependency URL from a file URL, and compare paths by segment, as the component import lint rule now does too.
