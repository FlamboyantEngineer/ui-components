---
'@flamboyantengineer/ui-components': patch
---

Entry points now export server-safe helpers and constants from server modules instead of through client modules, so a server component can call them: the rich text serializers and schema, the chat stream reducer, PDF hit testing, avatar colours, check state, slider and zoom steps, resize keys, scrollbar defaults and the other pure helpers. `check:client-boundaries` now fails when an entry point exports a non-component helper through a client module.
