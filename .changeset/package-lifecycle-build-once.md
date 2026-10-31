---
'@flamboyantengineer/ui-components': patch
---

Packaging builds once. `npm ci` in a checkout no longer builds the package: `prepare` builds only when npm prepares a git dependency or packs. `check:package`, `check:server-components` and `release` pack the tree as built with `--ignore-scripts`. Release tags now carry `dist/` and the reference stylesheet with a manifest that has no `prepare` script, so installing a tag builds nothing. `npm run release` refuses to run off `main` or when `main` differs from `origin/main`.
