---
'@flamboyantengineer/ui-components': patch
---

`SignatureDialog` no longer signs with a reason or drawn signature that is no longer asked for, and gives each signing session its own entries: closing, reopening (even during the exit animation), another `userName` or other `credentials` start empty, and a signing that settles after its session ended neither closes nor fails the next one.
