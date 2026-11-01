---
'@flamboyantengineer/ui-components': patch
---

ChatQuestion reads each draft against the question's current options, selection mode and `allowsOther`, so a withdrawn option no longer counts as an answer or reaches `onSubmit`.
