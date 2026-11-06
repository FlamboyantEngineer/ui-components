---
'@flamboyantengineer/ui-components': minor
---

`FourSidePropertyStrip` takes `errors`, a message for each wrong side, and shows them on one line across all four controls instead of under one narrow control. Wrong cells publish `data-invalid`, and `renderSide` receives `isInvalid` and `errorId` for the control's `aria-invalid` and `aria-describedby`.
