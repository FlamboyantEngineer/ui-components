---
'@flamboyantengineer/ui-components': minor
---

Share the development tooling with the libraries built on this one. The package ships a `tooling/` folder with the `ui-components-tooling` command (`check-references`, `check-specs` and `check-structure`, configured by each repository's `tooling.config.mjs`), one merged reference denylist, the shared ESLint configuration (`./tooling/eslint`, `createBaseConfig`) and the shared Prettier options (`./tooling/prettier`). ESLint, its plugins, Prettier and TypeScript are optional peer dependencies; no component or entry point imports the tooling.
