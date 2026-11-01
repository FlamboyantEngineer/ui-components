---
'@flamboyantengineer/ui-components': patch
---

CharacterGrid reads any stored recent list as offered characters, each once at its first place, at most 16, before it builds its sections, so a stored list with repeats or too many entries no longer crashes the grid or overfills the recent section.
