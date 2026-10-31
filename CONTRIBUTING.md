# Contributing

## Branches and pull requests

- `dev` is the integration branch. Work happens on short-lived branches cut from `dev` and merged back into `dev` by pull request.
- `main` is always releasable. It is updated only from `dev`, through a reviewed release pull request once the full checks pass on `dev`.
- Before a pull request merges, both check runs must pass (hosted CI runs `npm run check` itself, so the gate list lives only in `scripts/check.mjs`):
  - `npm run check`: lint, format, typecheck, the no-reference check, specs, labs, structure, client boundaries, build, labs build, unit tests, public types, package contents and the standalone lab archive. `scripts/check.mjs` runs them side by side in two stages and prints each one's output when it fails; Prettier and the typecheck keep caches in `node_modules/.cache/`.
  - `npm run test:labs`: Playwright against the built labs (run `npm run build:labs` first).
- Locally, run the checks that cover your change ([AGENTS.md](AGENTS.md#gates) lists them): `npm run test:changed` runs only the unit tests related to your changes since `origin/dev`, and each changed component's browser tests run by name.
- Every pull request that changes the published package adds a changeset (`npx changeset`).

## Versioning

The library is in `0.x` development; `v0.1.0` is its first release. APIs and styling hooks are experimental until `1.0.0`. During `0.x` development:

- Use **minor** changesets for API additions, removals and reorganizations, including styling hooks and peer dependency requirements.
- Use **patch** changesets for fixes that preserve the API.
- Remove obsolete APIs and migrate repository usage directly, without deprecation periods, compatibility shims or migration notices. Describe the current capabilities in changesets.
- `npx changeset version` turns the pending changesets into the next version and its changelog entry ([Releasing](#releasing)).

Starting at `1.0.0`, releases follow the compatibility rules below. Styling hooks are public API, the same as props and exports.

| Bump  | When                                                                                                                                                                                                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| major | Removing or renaming a component, export, prop, provider option, glyph or string key. Removing or renaming a hook class, data attribute, data-attribute value or documented custom property. Changing which element carries a hook, a default behaviour or an accessible role in a way that breaks hosts. Raising a peer dependency minimum. |
| minor | Adding a component, export, prop, hook, data-attribute value, glyph or string key, without changing existing ones.                                                                                                                                                                                                                           |
| patch | Fixes that keep every API and hook unchanged.                                                                                                                                                                                                                                                                                                |

The `1.0.0` release establishes the stable API and styling contract.

## Releasing

Releases are git tags in this repository; nothing is published to a registry.

1. On a branch from `dev`, run `npx changeset version`. It sets the version in `package.json`, writes `CHANGELOG.md` and removes the consumed changesets. Merge it into `dev`, then merge `dev` into `main` through the release pull request.
2. On `main`, matching `origin/main`, with a clean tree, run `npm run release` (it refuses otherwise). It builds the library and the labs once, checks the package, tags `v<version>` on a release commit that adds the built `dist/` and `labs/build/reference.css` to `main`'s commit with a manifest that has no `prepare` script, and packs the library tarball from that tree and the standalone labs archive.
3. Push the tag (`git push origin v<version>`). The release workflow (`.github/workflows/release.yml`) packs the library tarball from the tag, builds and packs the labs, creates the tag's GitHub Release from the changelog entry and attaches both archives. Where Actions does not run, create the release by hand and attach the two archives `npm run release` packed.

CI runs on pushes to `dev` and `main` and on every pull request. Workflow actions are pinned to commit SHAs with their version in a comment, and Dependabot (`.github/dependabot.yml`) opens weekly update pull requests against `dev` for the npm packages and the actions.

Hosts can also install a branch or commit before it is released: npm runs `prepare` (`scripts/prepare.mjs`), which runs `npm run build:package` to build `dist/` and the reference stylesheet without building the labs. In a checkout, `npm ci` builds nothing: the script builds only when npm prepares or packs the package, and the checks pack with `--ignore-scripts` after building once (`npm run build:package` before `npm run check:package`). A change to the build or the package contents runs `npm run check:git-install`, which installs the committed `HEAD` into a clean consumer through `npm install` and then `npm ci`, and checks its imports and declarations with the minimum `react` and `react-dom` the peer ranges admit, and verifies that labs and the optional rich-text peers are excluded. It then adds the rich-text peers at their minimum versions, with npm's strict peer resolution, and renders the rich text editor; pass a dependency such as `"git+https://github.com/FlamboyantEngineer/ui-components.git#dev"` to check a pushed branch.

## Source rules

Code follows [docs/CODING-GUIDELINES.md](docs/CODING-GUIDELINES.md): naming, structure, composition and simplicity rules, most of them enforced by lint and `npm run check:structure`. In addition, these are enforced by lint and CI:

- **No styles in source.** No stylesheet imports and no styling dependency (CSS-in-JS, utility frameworks, component kits). Literal class names are hook classes only.
- **Functional inline styles only:** positions, measured sizes, layout tracks, layering and interaction locks, plus documented `--ui-*` custom properties for measured values. Colours, spacing, borders, fonts and other visual properties belong in the host stylesheet.
- **Client boundaries.** A module that needs the browser runtime of React starts with `'use client'`, and every other module, entry points included, has no directive ([specs/SERVER-COMPONENTS.md](specs/SERVER-COMPONENTS.md)). `npm run check:client-boundaries` enforces it, and `--fix` adds the directives. `npm run check:server-components` builds, serves and hydrates the packed library in a Next.js consumer.
- **No direct browser storage.** Persisted state goes through the `UiProvider` storage adapter.
- **Neutral wording.** Code, comments, docs, specs, labs, fixtures, tests and package metadata never name a host application or its domain vocabulary. `npm run check:references` scans every authored file and path against an encoded denylist in `scripts/reference-denylist.json`. To add a term, append the output of `node scripts/check-references.mjs --encode '<regex>'`.

The PDF lab's third-party engine and worker are verified byte for byte against the installed dependency when checking the package. Their upstream PDF vocabulary is not authored library content; a modified runtime fails verification.

## Specs, tests and labs

- Each component has a spec in `specs/` in the format of [specs/README.md](specs/README.md): `UIC-` requirement IDs, `Implementation:` and `Verification:` lines, and the component's hook table. `npm run check:specs` validates them.
- Unit tests (Vitest, jsdom, Testing Library) sit next to the source as `*.test.ts(x)` and name the requirement IDs they verify. [docs/TESTING-GUIDELINES.md](docs/TESTING-GUIDELINES.md) has the rules for unit and browser tests: queries, interaction, timers, async React Aria behaviour, parallel safety and the `lab` fixture.
- The reference stylesheet is split into partials: `labs/reference/base.css` for the theme and document, and `labs/reference/<spec>.css` for the hooks each spec declares. `labs/reference.css` only imports them; `npm run new:lab -- --sync` regenerates it.
- Each component has a lab that renders its full variant, size and state matrix with `StateMatrix`, and Playwright coverage in `e2e/` through the `lab` fixture (`e2e/fixtures.ts`), including an axe check; `e2e/accessibility.spec.ts` also runs axe on every lab in the light and dark reference themes. Create one with `npm run new:lab -- <name> --title <Title> --tier <Tier> --group <Group> --description <text>`, choosing the tier and group from `LAB_TIERS` in `scripts/lib/labs.mjs` (Foundations, Primitives, Fields, Assemblies, Widgets); it writes `labs/<name>.html`, `labs/src/<name>.lab.tsx` and regenerates `labs/index.html`. Lab pages are generated: change their metadata and run `npm run new:lab -- --sync` rather than editing the markup.
