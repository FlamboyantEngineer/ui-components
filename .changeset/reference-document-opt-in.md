---
'@flamboyantengineer/ui-components': minor
---

The shipped reference stylesheet no longer styles the host page: its document base (font, text colour, page background and `color-scheme`) applies only under `data-reference-document` on the root element, and the labs' own page rules (page padding, state matrix grid, `body` margin and the size-sample adjustment) moved out of it into the lab chrome. `check:package` rejects `#lab-*` and `[data-lab-*]` selectors in the shipped file.
