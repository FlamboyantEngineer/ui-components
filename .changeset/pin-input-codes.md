---
'@flamboyantengineer/ui-components': patch
---

PinInput checks a supplied code as it is: a character its cells do not take, or more or fewer characters than its length, makes it invalid (also after `length` or `type` changes), and `data-complete` and `onComplete` mean a full code of valid characters. Completion and its commit follow the code the caller renders, so an edit the caller cuts short no longer commits. Autofill into a filled cell counts whole, told apart from typing by the input event.
