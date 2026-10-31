---
'@flamboyantengineer/ui-components': patch
---

Chat keeps unchanged messages from rendering again however its options are written: the part callbacks (`onApprove`, `onDeny`, `onAlwaysAllow`, `onAnswerQuestion`, `onDismissQuestion`, `onApplyCode`, `renderPart`, `getReference`), the tool renderers and `getNow` call the latest render's, and `thinkingIcon` and `feedbackReasons` are compared by what they hold.
