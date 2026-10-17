# Coding Guidelines

Every file in `src/`, `labs/src/`, `test/` and `e2e/` follows these rules. They are strict on purpose: one way to name, place, compose and write each thing keeps a large library predictable. Rules marked **(enforced)** fail `npm run check`; the others are checked in review.

## Naming

**N1. Files and directories are kebab-case.** A component lives in `src/components/<name>/` and its main module is `<name>.tsx` (or `<name>.ts` for a component family's pure model). Helpers beside it are named for what they do (`parse-svg-markup.ts`, `layers.ts`). **(enforced)**

**N2. One name per component, everywhere.** The directory name in PascalCase is the component (`icon-button/` → `IconButton`); the spec is `specs/ICON-BUTTON.md`; the lab is `labs/icon-button.html`; the browser test is `e2e/icon-button.spec.ts`; the reference partial is `labs/reference/icon-button.css`; the root hook class is `ui-icon-button`. **(enforced)**

**N3. Components are PascalCase nouns without prefixes** (`Button`, not `UiButton` or `BaseButton`). Parts of a family start with the family's name or its noun (`Tabs` → `TabList`, `Tab`, `TabPanel`). **(enforced: naming convention)**

**N4. Props interfaces are `<Component>Props`** and are exported next to the component. Option types are `<Component><Option>` (`ButtonVariant`) unless the component uses a shared vocabulary type directly (N7).

**N5. Prop names follow React Aria.** States are `is*` booleans (`isDisabled`, `isSelected`, `isPending`, `isInvalid`, `isRequired`, `isReadOnly`, `isOpen`, `isExpanded`); options that are not states are plain words (`variant`, `size`, `orientation`, `truncate`); events are `on<Event>` (`onPress`, `onChange`, `onAction`, `onOpenChange`); controlled pairs are `value`/`defaultValue` with `onChange` (or `<thing>`/`default<Thing>` with `on<Thing>Change`); render callbacks are `render<Part>`; accessors are `get<Value>`. Props of a wrapped React Aria component pass through unrenamed.

**N6. Functions say what they do.** Hooks are `use<Thing>`; pure functions start with a verb (`formatPath`, `resolveOverlayPlacement`, `createModalController`); predicates start with `is`, `has` or `can`. Module constants are `UPPER_SNAKE_CASE` only for exported primitive defaults (`DEFAULT_OVERLAY_GAP`); everything else is camelCase. **(enforced: naming convention)**

**N7. Shared vocabularies come from `src/core/props.ts`.** Sizes are `Size` values (`xs`, `sm`, `md`, `lg`, `xl`), tones are `Tone` values (`neutral`, `info`, `success`, `warning`, `danger`), orientation is `Orientation`. A component that offers a subset derives it: `type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>`. Never invent a synonym (`error` for `danger`, `medium` for `md`).

**N8. Hooks follow the contract.** Root class `ui-<name>`, slot class `ui-<name>__<slot>`, data attributes and values in kebab-case, all built with `createHooks` (`specs/HOOK-CONTRACT.md`).

## Structure

**S1. Three places for code.** `src/core/` holds the contracts every component uses (hooks, provider, props, glyphs, strings, storage); `src/components/<name>/` holds one component or one family; `src/utils/` holds framework-free helpers and generic React hooks used by more than one component. Nothing else lives in `src/`.

**S2. A component directory contains** `index.ts`, the main module `<name>.tsx`, optional helper modules, and the unit tests `<module>.test.ts(x)` beside the modules they test. **(enforced)**

**S3. `index.ts` only re-exports** the public API with named `export … from` statements. No default exports anywhere. **(enforced)**

**S4. Import other components through their main module** (`../icon/icon.js`), never through another component's helper modules. Relative imports end in `.js`; types use `import type`. **(enforced: lint)**

**S5. Every public component is complete:** a spec with its hook table, unit tests that name the spec's requirement IDs, a lab with its full state matrix, a browser test, and a reference partial when the spec declares class hooks. **(enforced)**

**S6. Module order:** imports, exported types, module constants, private helpers, exported components and hooks.

## Inheritance and composition

**I1. Function components only.** No classes in library source, including subclasses of third-party classes: wrap or compose them instead. **(enforced)**

**I2. Props inherit, they are not redeclared.** Every component that renders an element has props that extend `BaseProps` (`className`, `id`, caller `data-*`). A component that wraps a React Aria component extends that component's props, omitting only what the library replaces (`className`, `style`, `render`, `children` when it changes their type):

```ts
export interface ButtonProps
  extends Omit<AriaButtonProps, 'className' | 'style' | 'children' | 'render'>, BaseProps {
  variant?: ButtonVariant | undefined;
}
```

**(enforced: every exported component's props include `BaseProps`, except providers, hosts and controllers that render no element of their own)**

**I3. Specialise by composition.** A specialised component renders the general one with fixed props (`ActionButton` renders `Button`); it does not copy its markup or logic. Shared behaviour that two components need lives in one exported helper or hook, never in two copies.

**I4. Forward, do not filter.** Spread the remaining props onto the wrapped component or root element, and let `createHooks(...).root({ className, props, data })` merge hook classes and caller attributes. Hook values the component writes win over caller attributes of the same name.

## Simplicity

**C1. Small units.** A function has at most 80 lines and a cyclomatic complexity of at most 15, nests at most three levels deep, and takes at most three parameters (pass an options object instead). A module has at most 300 lines; split helpers into sibling modules before that. **(enforced)**

**C2. No speculative surface.** Every prop, export and option is exercised by a unit test and shown in the lab. Remove what nothing uses.

**C3. Prefer the platform and React Aria.** Use React Aria's behaviour (press, focus, keyboard, overlays, collections) before writing your own; derive values during render instead of storing them in state; reach for an effect only to synchronise with something outside React.

**C4. Comments explain why, not what.** Document public props in one line of TSDoc; comment only non-obvious constraints and workarounds. No commented-out code, no narration, no decorative separators.

**C5. No dead code.** No unused exports, parameters, branches or files. **(enforced: lint for unused code)**
