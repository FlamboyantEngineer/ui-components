---
'@flamboyantengineer/ui-components': minor
---

New `ShortcutScope` and `useShortcut`: register a chord or a key sequence (`['G', 'I']`) that answers in the innermost focused scope, then the scopes around it, then the document, one shortcut per press. Modal overlays hold their presses, sequences expire after `sequenceTimeout`, and fields, repeated keys and browser-reserved chords are left alone unless allowed. `useShortcut` returns the `aria-keyshortcuts` value. `CommandPalette` registers its chord through it.
