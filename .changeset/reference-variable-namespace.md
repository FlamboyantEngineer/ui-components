---
'@flamboyantengineer/ui-components': minor
---

Every custom property in the reference stylesheet now lives in one namespace: partial variables are renamed to `--ref-<partial>-…` (`--ref-split-view-handle-*`, `--ref-zoom-control-slider-*`, `--ref-separator-wave*`, `--ref-separator-label-align`, `--ref-toast-tone`, `--ref-tree-compare-tone`, `--ref-problem-list-tone` and `--ref-condition-builder-group-tone`), and the token check rejects any other name except measured `--ui-*` properties a spec declares and listed third-party interop variables.
