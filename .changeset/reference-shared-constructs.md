---
'@flamboyantengineer/ui-components': patch
---

The reference stylesheet writes its repeated constructs once in the base: every spinner shares one ring (`--ref-spinner-size`, sized from the new `--ref-icon-size-sm|md|lg|xl` tokens), visually hidden text and hidden scrollbars are shared selector lists (dock panel launchers and tab lists now hide their scrollbar in WebKit too), and glyphs pinned to a size use the icon size tokens, which the token check enforces.

Dock Panel keeps focus in a pane that docks when the drawer closes even when its body is still hidden while the change commits.
