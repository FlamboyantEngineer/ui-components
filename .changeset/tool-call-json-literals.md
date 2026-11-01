---
'@flamboyantengineer/ui-components': patch
---

ChatToolCall re-indents JSON text arguments and results from their own tokens instead of parsing them, so large integers, `1.0`, `-0`, exponents and repeated keys show as the tool sent them.
