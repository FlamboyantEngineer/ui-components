---
'@flamboyantengineer/ui-components': patch
---

Relative times reuse one `Intl.RelativeTimeFormat` per locale and unit style, and a chat message's accessible name formats its absolute time without working out the relative words. Message Composer Select and Toggle and Chat Model Picker draw their compact control through one shared button, and Text Diff, Merge View and Redline Compare their Previous and Next buttons through one shared navigation; their markup, names and hooks are unchanged.
