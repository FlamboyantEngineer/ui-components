# Agent Instructions

This repository is a standalone React component library. Read [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/CODING-GUIDELINES.md](docs/CODING-GUIDELINES.md) before changing it. The guidelines are strict: follow every naming, structure, composition and simplicity rule.

## Gates

Run these before every commit; all must pass:

```sh
npm run check       # lint, format, typecheck, no-reference, specs, labs, unit tests, build, labs build, package
npm run test:labs   # Playwright against the built labs (needs `npm run build:labs` first)
```

Run `npm run format` to fix formatting. Never weaken a lint rule, the denylist or a check to get green.

## Rules

- Follow [docs/CODING-GUIDELINES.md](docs/CODING-GUIDELINES.md). `npm run check` enforces the rules it can (lint and `check:structure`); review enforces the rest.
- Write tests by [docs/TESTING-GUIDELINES.md](docs/TESTING-GUIDELINES.md): TypeScript tests beside the source that name their `UIC-` IDs, role and label queries through `screen`, `userEvent.setup()`, and no test ids.
- Components emit hooks only (`specs/HOOK-CONTRACT.md`): hook classes, data attributes and documented `--ui-*` measured properties. No CSS, no visual inline styles, no styling dependency.
- Build on React Aria Components wherever it has a matching behaviour, imported only through `src/primitives/` (`specs/PRIMITIVES.md`).
- Never name a host application or its domain terms anywhere in the repository, including commit messages and pull request text. Use neutral sample data in labs and tests.
- Every behaviour change updates the component's spec (`specs/`), its tests (which name the `UIC-` IDs) and its lab.
- APIs and styling hooks are experimental until `1.0.0`: use minor changesets for API additions, removals and reorganizations, and patches for fixes that preserve the API. Remove obsolete APIs and migrate repository usage without deprecation periods, compatibility shims or migration notices. Starting at `1.0.0`, incompatible API or hook changes require a major bump. Add a changeset to every pull request that changes the package.
- Persisted state goes through the provider storage adapter; never touch `localStorage` from library source.
