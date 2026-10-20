---
'@flamboyantengineer/ui-components': patch
---

Consolidate the reference stylesheet onto one token set: type, radius, duration, tint, focus-ring, state-opacity, scrim, highlight, indent and category tokens in `labs/reference/base.css`; aliases instead of repeated colours; component-scoped tokens renamed `--ref-<partial>-…`; `--ref-accent-text` renamed `--ref-on-fill`. `npm run check:labs` now rejects literals a token covers.
