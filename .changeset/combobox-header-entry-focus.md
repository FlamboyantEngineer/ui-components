---
'@flamboyantengineer/ui-components': patch
---

Text fields, selects, sliders and other controls that take typed input in a `Combobox` `listHeader` keep the focus a click gives them instead of handing it straight back to the combobox input, so a header filter can be typed into. Pressable controls still return focus to the input, and Escape left unhandled in the header closes the list and returns focus to the input.
