---
'@flamboyantengineer/ui-components': patch
---

Shortcut matching (CommandPalette, MessageComposer, `matchesChord`) accepts a chord that names a non-Latin letter, still matches the key in its place on a US layout, and no longer reads AltGr typing a character (such as `@` on a German keyboard) as a Control+Alt chord.
