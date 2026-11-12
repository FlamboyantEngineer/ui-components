---
'@flamboyantengineer/ui-components': minor
---

The reference stylesheet's type is now Geist (`--ref-font`), with Geist Mono for code (`--ref-mono`), each ahead of the previous system stack. The stylesheet still loads nothing, so it does not bundle the fonts: a host that wants Geist serves it under the family names `Geist` and `Geist Mono`, and other hosts keep the system fonts. The labs serve their own copies of the Latin subsets.
