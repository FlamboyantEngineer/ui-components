# Primitives

The library's accessible behaviour comes from React Aria Components and its companion packages (`react-aria`, `@internationalized/date`). Those packages load in one place, `src/primitives/`, so the rest of the library depends on the building blocks it needs rather than on a vendor, and replacing the underlying library changes one directory.

## UIC-PRIMITIVES-1 - One boundary

### UIC-PRIMITIVES-1.1 - Imports go through the primitives

Library source, its unit tests and the test helpers shall import React Aria building blocks only from `src/primitives/` (`src/primitives/index.js`); the labs use none of them (UIC-PRIMITIVES-1.4). Only modules inside `src/primitives/` shall import `react-aria-components`, `react-aria`, `react-stately`, the scoped `@react-aria/*`, `@react-stately/*` and `@react-types/*` packages, or `@internationalized/*`. Lint rejects any other import of them.

Implementation: `eslint.config.js`, `src/primitives/index.ts`
Verification: `test/primitives.test.ts`

### UIC-PRIMITIVES-1.2 - An explicit inventory by area

`src/primitives/` shall re-export by name exactly the building blocks the library uses, grouped in one module per area (`core`, `i18n`, `focus`, `actions`, `content`, `navigation`, `overlays`, `menus`, `collections`, `drag-and-drop`, `fields`, `dates`, `colors`), with `index.ts` re-exporting every area by name rather than with `export *`, since the areas are client modules (UIC-SERVER-COMPONENTS-1.1). A building block is added to its area when a component first needs it and removed when nothing uses it, so the inventory is the list of what a replacement must provide. Each area imports React Aria in one form, from the package entry (`react-aria`, `react-aria-components`), never from a module path such as `react-aria/useHover`; the one exception is a building block the entry does not export, imported from `react-aria/private/`. The values the building blocks edit live in server-safe sibling modules, so server-safe utilities use them on the server: `date-values.ts` re-exports the date functions and reads the library's plain values (ISO 8601 date and time texts) as the building blocks' date objects and writes them back, so components convert values without exposing those objects, and `color-values.ts` re-exports colour parsing.

Implementation: `src/primitives/index.ts`, `src/primitives/date-values.ts`, `src/primitives/color-values.ts`
Verification: `test/primitives.test.ts`

### UIC-PRIMITIVES-1.3 - Names stay stable across a replacement

A primitive keeps its name and props when the library behind it changes: a replacement provides a module with the same exports, adapting the new library's props, states and data attributes to the ones the specs document. Component code, public props types and hooks do not change when a primitive's implementation does.

Implementation: `src/primitives/index.ts`
Verification: `test/primitives.test.ts`

### UIC-PRIMITIVES-1.4 - Labs use the public API

The labs show hosts how to use the library, so they shall import only its public API, from the component and core modules that `src/index.ts` exports, and never `src/primitives/`. Lint rejects a lab import of any module under `src/primitives/`, as it rejects a lab import of React Aria and its companion packages. A lab imports a component through its entry point (`src/components/<name>/index.js`) or its main module (`<name>.js`), never through one of its helper modules, so every symbol a lab uses is one a host can import. A lab imports from a `src/utils` or `src/core` module only the names that folder's index (`src/utils/index.ts`, `src/core/index.ts`) re-exports from it, and an index module itself; helpers only the labs need, such as `requireDefined`, live beside the labs. Lint (`ui/component-imports`) rejects the rest.

Implementation: `eslint.config.js`, `eslint-rules/index.js`
Verification: `test/primitives.test.ts`, `test/lint-rules.test.ts`

## UIC-PRIMITIVES-2 - A library-owned public API

### UIC-PRIMITIVES-2.1 - Public declarations expose no building block

No public type declaration shall import from `src/primitives/` or from React Aria and its companion packages: component props, values, events, render states and helpers are declared by the library. `npm run check:public-types` scans the built declarations (every `.d.ts` under `dist/` except `dist/primitives/`) and fails on any such import, so a caller can never depend on the implementation behind a component. `npm run check` runs it after the build, and hosted CI runs `npm run check` itself, so both use one gate list.

Implementation: `scripts/check-public-types.mjs`, `scripts/check.mjs`, `.github/workflows/ci.yml`, `package.json`
Verification: `test/public-types.test.ts`, `test/package.test.ts`

### UIC-PRIMITIVES-2.2 - A shared vocabulary the primitives satisfy

The library shall declare the vocabulary its components share in `src/core/`: collection keys and selections (`Key`, `Selection`, `SelectionMode`), overlay `Placement`, sorting (`SortDescriptor`, `SortDirection`), interaction events (`PressEvent`, `HoverEvent`, `PointerType`) and the prop groups built from them (`PressEventProps`, `HoverEventProps`, `FocusEventProps`, `KeyboardEventProps`, `AriaLabellingProps`, `OpenStateProps`, `SelectionProps`, `CollectionSelectionProps`, `ExpansionProps`, `OverlayPositionProps`, `OverlayDismissProps`), plus `ElementRender` for swapping elements. Each is shaped so that today's building blocks accept and produce it unchanged, which the tests check at compile time; a replacement adapts to the same shapes.

Implementation: `src/core/props.ts`, `src/core/events.ts`, `src/utils/render-element.ts`
Verification: `test/public-types.test.ts`

### UIC-PRIMITIVES-2.3 - Every type a public prop uses is exported

Every library type that an exported type names for a member, a parameter or a return type (an option union, a handler, a render state, a page of results) shall itself be exported from an entry point, so a host can name the type of any value it passes or receives. `npm run check:public-types` loads the built entry points (the root, `core`, `testing` and every component `index.d.ts`) and fails on each exported type that names an unexported library type there, including through the members it inherits from an unexported base. A type that only shapes another, such as an unexported base interface or the generic an exported alias instantiates (`ComboboxLoader = RemoteLoader<ComboboxItem>`), need not be exported itself.

Implementation: `scripts/check-public-types.mjs`, `scripts/lib/unexported-types.mjs`
Verification: `test/public-types.test.ts`
