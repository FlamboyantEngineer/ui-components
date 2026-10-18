# Primitives

The library's accessible behaviour comes from React Aria Components and its companion packages (`react-aria`, `@internationalized/date`). Those packages load in one place, `src/primitives/`, so the rest of the library depends on the building blocks it needs rather than on a vendor, and replacing the underlying library changes one directory.

## UIC-PRIMITIVES-1 - One boundary

### UIC-PRIMITIVES-1.1 - Imports go through the primitives

Library source, its unit tests, the labs and the test helpers shall import React Aria building blocks only from `src/primitives/` (`src/primitives/index.js`). Only modules inside `src/primitives/` shall import `react-aria-components`, `react-aria`, `react-stately`, the scoped `@react-aria/*`, `@react-stately/*` and `@react-types/*` packages, or `@internationalized/*`. Lint rejects any other import of them.

Implementation: `eslint.config.js`, `src/primitives/index.ts`
Verification: `test/primitives.test.ts`

### UIC-PRIMITIVES-1.2 - An explicit inventory by area

`src/primitives/` shall re-export by name exactly the building blocks the library uses, grouped in one module per area (`core`, `i18n`, `focus`, `actions`, `content`, `navigation`, `overlays`, `menus`, `collections`, `drag-and-drop`, `fields`, `dates`, `colors`), with `index.ts` re-exporting every area. A building block is added to its area when a component first needs it and removed when nothing uses it, so the inventory is the list of what a replacement must provide.

Implementation: `src/primitives/index.ts`
Verification: `test/primitives.test.ts`

### UIC-PRIMITIVES-1.3 - Names stay stable across a replacement

A primitive keeps its name and props when the library behind it changes: a replacement provides a module with the same exports, adapting the new library's props, states and data attributes to the ones the specs document. Component code, public props types and hooks do not change when a primitive's implementation does.

Implementation: `src/primitives/index.ts`
Verification: `test/primitives.test.ts`
