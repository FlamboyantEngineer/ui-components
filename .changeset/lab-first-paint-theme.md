---
'@flamboyantengineer/ui-components': patch
---

Labs: every page applies its stylesheet and theme from the head before the body is parsed, so no lab paints unstyled before its stylesheet loads. The toolbar's theme is now a picker (System, Light, Dark, Custom); System, the default, follows the reader's colour scheme, and the toolbar follows the chosen scheme.
