# Agent Instructions

This repository is a standalone React component library. Read [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/CODING-GUIDELINES.md](docs/CODING-GUIDELINES.md) before changing it. The guidelines are strict: follow every naming, structure, composition and simplicity rule.

## Gates

Before every commit, run the checks that cover your change, not the full suites. All of them must pass:

```sh
npm run lint && npm run format:check && npm run typecheck
npm run check:references && npm run check:specs && npm run check:labs && npm run check:structure
npm run check:client-boundaries   # `--fix` adds the 'use client' directives
npm run test:changed   # unit tests related to your changes since origin/dev
```

- `npm run test:changed` runs `vitest --changed` against `origin/dev`. It covers uncommitted changes and every test that reaches a changed module through its imports. A change to a shared module, such as `src/core`, `src/primitives` or a widely used util, therefore selects many tests; that is expected. A change to `package.json` or the Vitest config reruns everything, so for those changes run the tests of what you touched by path instead (`npx vitest run test/package.test.ts`). Compare with another base with `npx vitest run --changed <ref>`.
- Browser tests: run `npm run build:labs`. Then, for each component, lab (`labs/src/<name>*.tsx`), reference partial (`labs/reference/<name>.css`) or browser test you changed, run its specs and that lab's cross-lab checks:

  ```sh
  npx playwright test e2e/<name>.spec.ts e2e/<name>-*.spec.ts
  npx playwright test e2e/accessibility.spec.ts -g " <name> (renders|passes)"
  ```

  A change to the lab harness (`labs/src/chrome/`, `scripts/*lab*`, `e2e/fixtures.ts`, `playwright.config.ts`) also runs `e2e/lab-harness.spec.ts` and the whole `e2e/accessibility.spec.ts`.

  Local runs record no traces; to debug a failure, rerun that test with `--trace=on`. A failing CI browser job uploads its traces as an artifact.

- Changes to exports, public types, entry points or package contents also run `npm run build:package && npm run check:public-types && npm run check:package`. Changes to client boundaries, the build or entry points also run `npm run check:server-components` (it needs the npm registry; set `CHROMIUM_PATH` when Playwright's own browser is not installed).
- Do not run `npm test`, `npm run check` or `npm run test:labs` routinely. CI runs the full suites on every pull request. Run them locally only for a release pull request (`dev` to `main`), when a change reaches across most of the library and the targeted runs cannot show it is safe, or when asked.

`npm run lint` runs type-aware rules and gives ESLint a 6 GB heap; give it a few minutes. Run `npm run format` to fix formatting. Never weaken a lint rule, the denylist or a check to get green.

## Rules

- Follow [docs/CODING-GUIDELINES.md](docs/CODING-GUIDELINES.md). `npm run check` enforces the rules it can (lint and `check:structure`); review enforces the rest.
- The TypeScript, Node scripts, security and design rules (`TS`, `R`, `SEC`, `D`) and testing rules `T21` to `T26` are adapted from MIT-licensed rule sets recorded in [docs/coding-rules/README.md](docs/coding-rules/README.md). Read the vendored [design guidance](docs/coding-rules/a-philosophy-of-software-design.mini.md) before designing a module or API.
- Write tests by [docs/TESTING-GUIDELINES.md](docs/TESTING-GUIDELINES.md): TypeScript tests beside the source that name their `UIC-` IDs, role and label queries through `screen`, `userEvent.setup()`, and no test ids.
- Components emit hooks only (`specs/HOOK-CONTRACT.md`): hook classes, data attributes and documented `--ui-*` measured properties. No CSS, no visual inline styles, no styling dependency.
- Build on React Aria Components wherever it has a matching behaviour, imported only through `src/primitives/` (`specs/PRIMITIVES.md`).
- Never name a host application or its domain terms anywhere in the repository, including commit messages and pull request text. Use neutral sample data in labs and tests.
- Every behaviour change updates the component's spec (`specs/`), its tests (which name the `UIC-` IDs) and its lab.
- APIs and styling hooks are experimental until `1.0.0`: use minor changesets for API additions, removals and reorganizations, and patches for fixes that preserve the API. Remove obsolete APIs and migrate repository usage without deprecation periods, compatibility shims or migration notices. Starting at `1.0.0`, incompatible API or hook changes require a major bump. Add a changeset to every pull request that changes the package.
- Persisted state goes through the provider storage adapter; never touch `localStorage` from library source.
