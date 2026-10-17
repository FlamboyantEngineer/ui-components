# Contributing

## Branches and pull requests

- `main` is always releasable. Work happens on short-lived branches cut from `main` and merged back by pull request.
- CI must be green before merge: lint, format, typecheck, the no-reference check, specs, labs, unit tests, build, labs build, package contents and Playwright.
- Every pull request that changes the published package adds a changeset (`npx changeset`).

## Versioning

Releases follow semver. The styling hooks are public API, the same as props and exports.

| Bump  | When                                                                                                                                                                                                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| major | Removing or renaming a component, export, prop, provider option, glyph or string key. Removing or renaming a hook class, data attribute, data-attribute value or documented custom property. Changing which element carries a hook, a default behaviour or an accessible role in a way that breaks hosts. Raising a peer dependency minimum. |
| minor | Adding a component, export, prop, hook, data-attribute value, glyph or string key, without changing existing ones.                                                                                                                                                                                                                           |
| patch | Fixes that keep every API and hook unchanged.                                                                                                                                                                                                                                                                                                |

Before `1.0.0`, minors may break; the changeset says what moved.

## Releasing

The release workflow runs on `main`. Pending changesets open a **Version packages** pull request; merging it publishes the new version to GitHub Packages and tags it. The repository setting **Actions → General → Allow GitHub Actions to create and approve pull requests** must be on for the workflow to open that pull request.

## Source rules

Code follows [docs/CODING-GUIDELINES.md](docs/CODING-GUIDELINES.md): naming, structure, composition and simplicity rules, most of them enforced by lint and `npm run check:structure`. In addition, these are enforced by lint and CI:

- **No styles in source.** No stylesheet imports and no styling dependency (CSS-in-JS, utility frameworks, component kits). Literal class names are hook classes only.
- **Functional inline styles only:** positions, measured sizes, layout tracks, layering and interaction locks, plus documented `--ui-*` custom properties for measured values. Colours, spacing, borders, fonts and other visual properties belong in the host stylesheet.
- **No direct browser storage.** Persisted state goes through the `UiProvider` storage adapter.
- **Neutral wording.** Code, comments, docs, specs, labs, fixtures, tests and package metadata never name a host application or its domain vocabulary. `npm run check:references` scans every authored file and path against an encoded denylist in `scripts/reference-denylist.json`. To add a term, append the output of `node scripts/check-references.mjs --encode '<regex>'`.

## Specs, tests and labs

- Each component has a spec in `specs/` in the format of [specs/README.md](specs/README.md): `UIC-` requirement IDs, `Implementation:` and `Verification:` lines, and the component's hook table. `npm run check:specs` validates them.
- Unit tests (Vitest, jsdom, Testing Library) sit next to the source as `*.test.ts(x)` and name the requirement IDs they verify.
- The reference stylesheet is split into partials: `labs/reference/base.css` for the theme and document, and `labs/reference/<spec>.css` for the hooks each spec declares. `labs/reference.css` only imports them; `npm run new:lab -- --sync` regenerates it.
- Each component has a lab that renders its full variant, size and state matrix with `StateMatrix`, and Playwright coverage in `e2e/` through the `lab` fixture (`e2e/fixtures.ts`), including an axe check. Create one with `npm run new:lab -- <name> --title <Title> --group <Group> --description <text>`; it writes `labs/<name>.html`, `labs/src/<name>.lab.tsx` and regenerates `labs/index.html`. Lab pages are generated: change their metadata and run `npm run new:lab -- --sync` rather than editing the markup.
