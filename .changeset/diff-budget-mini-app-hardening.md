---
'@flamboyantengineer/ui-components': patch
---

The diff bounds its search: very large inputs that differ throughout diff as one deletion and one insertion instead of blocking the page, while inputs under ten thousand lines or words are unchanged. `MiniApp` removes a frame that navigated itself, drops a posted state that is not a JSON value with a `script` error to `onError`, and builds its session key only when its source changes.
