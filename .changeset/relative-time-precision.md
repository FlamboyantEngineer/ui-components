---
'@flamboyantengineer/ui-components': minor
---

Relative times read `Now` for their first minute and then count whole elapsed minutes by default, everywhere the shared formatter is used (Relative Time, chat message times, Chat List and Relative Date Field). `precision="second"` on `RelativeTime` brings back the live seconds count (`5 seconds ago`). The new `unitStyle` prop (`long` by default, `short`, `narrow`) chooses how the words spell their units (`5 minutes ago`, `5 min. ago`, `5m ago`). Adds the `RelativeTimePrecision` and `RelativeTimeUnitStyle` types.
