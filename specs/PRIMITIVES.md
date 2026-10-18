# Primitives

The library's accessible behaviour comes from React Aria Components and its companion packages (`react-aria`, `@internationalized/date`). Those packages load in one place, `src/primitives/`, so the rest of the library depends on the building blocks it needs rather than on a vendor, and replacing the underlying library changes one directory.

## UIC-PRIMITIVES-1 - One boundary

### UIC-PRIMITIVES-1.1 - Imports go through the primitives

Library source, its unit tests and the test helpers shall import React Aria building blocks only from `src/primitives/` (`src/primitives/index.js`); the labs use none of them (UIC-PRIMITIVES-1.4). Only modules inside `src/primitives/` shall import `react-aria-components`, `react-aria`, `react-stately`, the scoped `@react-aria/*`, `@react-stately/*` and `@react-types/*` packages, or `@internationalized/*`. Lint rejects any other import of them.

Implementation: `eslint.config.js`, `src/primitives/index.ts`
Verification: `test/primitives.test.ts`

### UIC-PRIMITIVES-1.2 - An explicit inventory by area

`src/primitives/` shall re-export by name exactly the building blocks the library uses, grouped in one module per area (`core`, `i18n`, `focus`, `actions`, `content`, `navigation`, `overlays`, `menus`, `collections`, `drag-and-drop`, `fields`, `dates`, `colors`), with `index.ts` re-exporting every area. A building block is added to its area when a component first needs it and removed when nothing uses it, so the inventory is the list of what a replacement must provide. An area may also re-export value adapters from a sibling module, such as `date-values.ts`, which reads the library's plain values (ISO 8601 date and time texts) as the building blocks' value objects and writes them back, so components convert values without exposing those objects.

Implementation: `src/primitives/index.ts`
Verification: `test/primitives.test.ts`

### UIC-PRIMITIVES-1.3 - Names stay stable across a replacement

A primitive keeps its name and props when the library behind it changes: a replacement provides a module with the same exports, adapting the new library's props, states and data attributes to the ones the specs document. Component code, public props types and hooks do not change when a primitive's implementation does.

Implementation: `src/primitives/index.ts`
Verification: `test/primitives.test.ts`

### UIC-PRIMITIVES-1.4 - Labs use the public API

The labs show hosts how to use the library, so they shall import only its public API, from the component and core modules that `src/index.ts` exports, and never `src/primitives/`. Lint rejects a lab import of any module under `src/primitives/`, as it rejects a lab import of React Aria and its companion packages.

Implementation: `eslint.config.js`
Verification: `test/primitives.test.ts`

## UIC-PRIMITIVES-2 - A library-owned public API

### UIC-PRIMITIVES-2.1 - Public declarations expose no building block

No public type declaration shall import from `src/primitives/` or from React Aria and its companion packages: component props, values, events, render states and helpers are declared by the library. `npm run check:public-types` scans the built declarations (every `.d.ts` under `dist/` except `dist/primitives/`) and fails on any such import, so a caller can never depend on the implementation behind a component.

Implementation: `scripts/check-public-types.mjs`, `package.json`
Verification: `test/public-types.test.ts`

### UIC-PRIMITIVES-2.2 - A shared vocabulary the primitives satisfy

The library shall declare the vocabulary its components share in `src/core/`: collection keys and selections (`Key`, `Selection`, `SelectionMode`), overlay `Placement`, sorting (`SortDescriptor`, `SortDirection`), interaction events (`PressEvent`, `HoverEvent`, `PointerType`) and the prop groups built from them (`PressEventProps`, `HoverEventProps`, `FocusEventProps`, `KeyboardEventProps`, `AriaLabellingProps`, `OpenStateProps`, `SelectionProps`, `CollectionSelectionProps`, `ExpansionProps`, `OverlayPositionProps`, `OverlayDismissProps`), plus `ElementRender` for swapping elements. Each is shaped so that today's building blocks accept and produce it unchanged, which the tests check at compile time; a replacement adapts to the same shapes.

Implementation: `src/core/props.ts`, `src/core/events.ts`, `src/utils/render-element.ts`
Verification: `test/public-types.test.ts`
