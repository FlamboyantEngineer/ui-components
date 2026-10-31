# Hook Contract

The library ships behaviour and markup, never appearance. Every component exposes **hooks**: documented class names and data attributes that a host stylesheet selects. Hooks are public API and experimental until `1.0.0`; API changes use minor changesets during `0.x` development. Starting at `1.0.0`, renaming or removing a hook, an attribute value or a documented custom property requires a major version change ([CONTRIBUTING.md](../CONTRIBUTING.md#versioning)).

## UIC-HOOKS-1 - Classes

### UIC-HOOKS-1.1 - Root class

Every component shall put the class `ui-<component>` on its root element, where `<component>` is the component's name in kebab case (`ui-button`, `ui-modal`). The root class is always present, whatever props the caller passes.

Implementation: `src/core/hooks.ts`
Verification: `src/core/hooks.test.ts`

### UIC-HOOKS-1.2 - Slot classes

A component shall mark each named part a stylesheet may need with the class `ui-<component>__<slot>` (`ui-button__icon`, `ui-modal__footer`). A slot class is present whenever that part renders. Components declare their slots up front, so an undeclared slot name is a type error.

Implementation: `src/core/hooks.ts`
Verification: `src/core/hooks.test.ts`

### UIC-HOOKS-1.3 - Caller class names

Every component shall accept `className` and append it after its root class. A caller class never replaces or removes a hook class.

Implementation: `src/core/hooks.ts`
Verification: `src/core/hooks.test.ts`

### UIC-HOOKS-1.4 - Swapped elements

When a caller swaps the element a component renders through a `render` prop ([COMPOSITION.md](COMPOSITION.md)), the props the component hands to `render` shall carry that element's hook classes and data attributes, so the caller's element keeps every hook once it spreads them.

Implementation: `src/utils/render-element.ts`
Verification: `src/utils/render-element.test.tsx`

## UIC-HOOKS-2 - Data attributes

### UIC-HOOKS-2.1 - Options

A component shall publish each visual option the caller chooses as a data attribute on its root: `data-variant`, `data-size`, and component-specific options such as `data-orientation` or `data-tone`. Values are the kebab-case words the component's spec lists. An option left at its default still publishes the default value, so the stylesheet never relies on an attribute being absent.

Implementation: `src/core/hooks.ts`
Verification: `src/core/hooks.test.ts`

### UIC-HOOKS-2.2 - States

A component shall publish each state as a data attribute that is present with the value `true` while the state holds and absent otherwise. Interaction and overlay states use these names, whichever building block produces them (`data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-selected`, `data-disabled`, `data-invalid`, `data-required`, `data-readonly`, `data-open`, `data-expanded`, `data-entering`, `data-exiting`, `data-placement` and others); a building block that names a state differently is adapted in `src/primitives/` ([PRIMITIVES.md](PRIMITIVES.md)). States the library adds follow the same rule (`data-loading`, `data-dirty`).

Implementation: `src/core/hooks.ts`
Verification: `src/core/hooks.test.ts`

### UIC-HOOKS-2.3 - Caller data attributes

Every component shall forward the caller's `data-*` props to its root element, for tests, analytics and host behaviour, rendered as React renders a `data-*` prop: strings, numbers and booleans as text (`false` as `"false"`), while `null` and `undefined` omit the attribute. When a caller attribute has the same name as a hook attribute the component writes, the component's value wins, including clearing the attribute when that hook value is `false`, `null` or `undefined`.

Implementation: `src/core/hooks.ts`
Verification: `src/core/hooks.test.ts`

## UIC-HOOKS-3 - Styles

### UIC-HOOKS-3.1 - No stylesheet and no variables

Library modules shall import no stylesheet, depend on no styling package, and require no CSS custom property. A component renders correctly unstyled, with only browser defaults. The package includes reference stylesheets for its standalone labs; components never load them. The package ships ES modules only: each conditional export lists `types`, `import` and, last, a `default` condition that points at the same ES module, so resolvers that do not assert `import` (Node's `require(esm)`, Jest) still find it. Components may expose the measured custom properties described in UIC-HOOKS-3.2.

Implementation: `eslint.config.js`, `eslint-rules/index.js`, `scripts/check-package.mjs`, `package.json`
Verification: `test/lint-rules.test.ts`, `test/package.test.ts`, `e2e/accessibility.spec.ts`

### UIC-HOOKS-3.2 - Functional inline styles only

A component may set inline styles only for values it computes at runtime: positions, measured sizes, layout tracks (column widths, virtual offsets), layering and interaction locks. It may expose a measured value as a custom property named `--ui-<name>` (for example `--ui-trigger-width`), which its spec lists with kind `property`. Colours, spacing, borders, typography, shadows and every other visual property belong to the host stylesheet. Literal class names in library markup are hook classes only.

Implementation: `eslint-rules/index.js`, `src/core/hooks.ts`
Verification: `test/lint-rules.test.ts`, `src/core/hooks.test.ts`

## UIC-HOOKS-4 - Spec ownership

### UIC-HOOKS-4.1 - Markup matches the spec

Each component's spec shall list every hook the component renders in its `## Hooks` table ([README.md](README.md#file-format)). Component tests assert their rendered markup with `expectHooksMatchSpec`, which fails on a hook class no spec declares, on a data attribute or `--ui-*` property not declared by a spec that owns the element's classes, on a value outside the declared list, and on a missing root or required slot. It parses the spec hook tables once per test worker, not once per test file.

Implementation: `test/hooks.ts`
Verification: `test/hooks.test.tsx`
