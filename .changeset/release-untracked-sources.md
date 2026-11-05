---
'@flamboyantengineer/ui-components': patch
---

`npm run release` refuses to run with untracked files, which the build would compile into the tag without their source, and runs the package check on the release tree itself before tagging, so the tagged package's source maps always resolve. `npm run check:package -- --dir <path>` checks another package directory than the checkout.
