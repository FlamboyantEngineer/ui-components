---
'@flamboyantengineer/ui-components': minor
---

DateTimeField: a time field drops its clock button and time-column popover. Instead, the wheel over a time segment (hour, minute, second or AM/PM) steps it in every mode, and a time field shows small later and earlier buttons that step the part focused last. A date and time, or a range, keeps its time columns under the calendar in the same popover. The provider string `chooseTime` is replaced by `timeLater` and `timeEarlier`.
