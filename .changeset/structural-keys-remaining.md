---
'@flamboyantengineer/ui-components': patch
---

Field form binding, `useWidestTextWidth`, `useScrollSpy`, `Wizard`, `SplitView`, `Avatar` and `ProjectionProvider` compare their lists structurally instead of building JSON or joined-string keys on every render. Behaviour is unchanged, except that equal values from new objects never count as a change.
