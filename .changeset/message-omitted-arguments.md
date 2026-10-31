---
'@flamboyantengineer/ui-components': patch
---

Documents the `formatMessage` argument contract: an argument passed as `undefined` or `null` reads as empty text, picks a `select`'s `other` branch and counts as zero in a plural, while an argument the message names but `values` leaves out throws. The behaviour is unchanged; the `MessageValue` docs no longer promise that omitted arguments read as empty text.
