---
'@flamboyantengineer/ui-components': minor
---

The shipped reference stylesheet states its browser floor (Chrome and Edge 117, Firefox 121, Safari 17), which the package's new `browserslist` records and its build targets, so esbuild lowers or prefixes what those browsers lack. Every rule now sits in the `ui-reference` cascade layer, so a host's own unlayered rules win over it without a specificity fight.
