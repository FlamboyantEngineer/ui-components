# Tooling

The development checks and configuration that this repository shares with the libraries built on it. They ship in the package's `tooling/` folder, so a repository that pins this package by commit runs the same checks at the same commit. Tooling is development-time only: no component, entry point or host bundle reaches it.

## UIC-TOOLING-1 - Publishing

### UIC-TOOLING-1.1 - A folder in the package

The package shall ship `tooling/` as plain ES modules with JSDoc types, which need no build, and export its configuration as `./tooling/eslint` (`tooling/eslint.mjs`) and `./tooling/prettier` (`tooling/prettier.json`). No module in `src/` shall import `tooling/`, and no module in `tooling/` shall import React or library source, so installing the package for its components adds nothing to a host's bundle. `npm run check:structure` enforces both directions.

Implementation: `package.json`, `scripts/structure-rules.mjs`
Verification: `test/tooling.test.ts`

### UIC-TOOLING-1.2 - Repository configuration

Each repository that runs the shared checks shall hold its own settings in a `tooling.config.mjs` at its root, whose default export names the requirement ID prefix and hook prefix of its specs (`specs`), the directories whose names are kebab-case, the directory whose cycles count and the layers of `src/` with the layers each may import (`structure`), its own structure rules as a function that returns problems (`structure.rules`), and vendored files the reference check compares with the installed package file they copy instead of scanning (`references.verbatim`). A check that needs the file and finds none shall fail and name it.

Implementation: `tooling/config.mjs`, `tooling.config.mjs`
Verification: `test/tooling.test.ts`

### UIC-TOOLING-1.3 - One command

The package shall install the bin command `ui-components-tooling <command> [options]`, with the commands `check-exports`, `check-references`, `check-specs` and `check-structure`. A command runs against the working directory, which npm sets to the package root for its scripts; an unknown or missing command prints the usage and exits with status 2. The tools the shared configuration and checks load (ESLint, `@eslint/js`, `typescript-eslint`, `eslint-plugin-simple-import-sort`, `globals`, Prettier and TypeScript) shall be optional peer dependencies, which a host that only renders components never installs.

Implementation: `tooling/bin.mjs`, `tooling/lib/script.mjs`, `package.json`
Verification: `test/tooling.test.ts`

### UIC-TOOLING-1.4 - Script library

The package shall export the helpers its scripts share as `./tooling/lib/<name>.mjs`, so a repository's own scripts use the same ones: `script.mjs` (the root, file listing, options and problem report), `npm.mjs` (npm run through one helper on every platform), `tar.mjs` (gzipped tar archives written and read in Node, refusing entries that leave the target directory), `unexported-types.mjs` (public declarations that name a type the package does not export), `imports.mjs` (the import graph and its cycles) and `markdown-links.mjs` (relative links between Markdown files).

Implementation: `package.json`, `tooling/lib/npm.mjs`, `tooling/lib/tar.mjs`, `tooling/lib/unexported-types.mjs`
Verification: `test/tooling.test.ts`, `test/script-lib.test.ts`

## UIC-TOOLING-2 - Checks

### UIC-TOOLING-2.1 - No host references

`check-references` shall scan every tracked and untracked, non-ignored file and file path (or every file under `--dir <path>`) against one shared, base64-encoded denylist (`tooling/reference-denylist.json`), and fail naming each file, line and denylist entry it matches. `--encode <regex> [flags]` prints a new entry, and `--denylist <path>` reads another list of the same shape. A file listed in `references.verbatim` passes only when it is byte for byte the installed package file it copies.

Implementation: `tooling/check-references.mjs`, `tooling/reference-denylist.json`
Verification: `test/check-references.test.ts`

### UIC-TOOLING-2.2 - Specs

`check-specs` shall validate `specs/` against the format in [README.md](README.md), with the repository's requirement ID prefix: unique IDs with `Implementation:` and `Verification:` lines, numbering, existing paths, a listed test that names the ID itself (not a longer ID it starts), `## Hooks` tables in the repository's hook prefix, component directories and exported utils that some requirement implements, reference partials that style each class hook and read each measured property, and relative links in `specs/` and `docs/`. With `everyModuleImplemented`, every library module in `src/` (tests and `index.ts` files aside) shall be the `Implementation:` of some requirement.

Implementation: `tooling/check-specs.mjs`, `tooling/lib/markdown-links.mjs`
Verification: `test/check-specs.test.ts`

### UIC-TOOLING-2.3 - Structure

`check-structure` shall fail on a file or directory name that is not kebab-case under `structure.names`, an `index.ts` in `src/` that does anything but re-export, a relative import from library source that leaves `src/`, an import from one layer of `src/` to a layer it does not list, a Node module imported by a browser layer, and a cycle of library modules (with `cyclesAcross`, only a cycle that spans two of its directories; type-only imports count only with `typeImportCycles`). It then adds the problems of `structure.rules`.

Implementation: `tooling/check-structure.mjs`, `tooling/lib/imports.mjs`
Verification: `test/tooling.test.ts`

### UIC-TOOLING-2.4 - Needless exports

`check-exports` shall fail on a declaration that a library module in `src/` exports when no entry point reaches it and no other library module, test or file under `labs/`, `e2e/`, `examples/`, `test/` or `scripts/` references its symbol. Entry points are the `./dist/` targets of the package's `exports` map, read as `src/` modules, and `exports.entries`. An export wildcard shall match nested paths. A type another module's declarations infer, a re-export, or a module namespace reference counts as a use. It shall resolve references with the repository's own TypeScript. `--fix` drops the `export` keyword of each flagged declaration its own file still uses. One used nowhere is reported for deletion.

Implementation: `tooling/check-exports.mjs`, `tooling/package-entries.mjs`
Verification: `test/tooling.test.ts`

## UIC-TOOLING-3 - Shared configuration

### UIC-TOOLING-3.1 - ESLint

`createBaseConfig` shall return the ESLint configuration every repository starts from: sorted, single, inline-type imports and unused-variable rules everywhere; the type-aware TypeScript rules and no `enum` (`ENUM_SYNTAX`, exported for repositories that add their own restricted syntax) in the typed files; no default exports outside the listed loaders; the size limits and naming convention in library source, with PascalCase functions and parameters when `components` is set; and Node globals in the Node files. A repository adds its own rules after it.

Implementation: `tooling/eslint.mjs`, `eslint.config.js`
Verification: `test/tooling.test.ts`

### UIC-TOOLING-3.2 - Prettier

`tooling/prettier.json` shall hold the shared Prettier options, which a repository's `.prettierrc.json` names as the string `"@flamboyantengineer/ui-components/tooling/prettier"` (this repository: `"./tooling/prettier.json"`).

Implementation: `tooling/prettier.json`, `.prettierrc.json`
Verification: `test/tooling.test.ts`
