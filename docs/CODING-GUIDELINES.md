# Coding Guidelines

Every file in `src/`, `labs/src/`, `test/` and `e2e/` follows these rules; tests also follow [TESTING-GUIDELINES.md](TESTING-GUIDELINES.md). They are strict on purpose: one way to name, place, compose and write each thing keeps a large library predictable. Rules marked **(enforced)** fail `npm run check`; the others are checked in review. Lint applies the size limits (C1), the no-class rule (I1) and the naming convention (N3, N6) to library source, `src/` without its tests; in labs, tests and browser tests those rules are checked in review.

## Naming

**N1. Files and directories are kebab-case.** A component lives in `src/components/<name>/` and its main module is `<name>.tsx` (or `<name>.ts` for a component family's pure model). Helpers beside it are named for what they do (`parse-svg-markup.ts`, `layers.ts`). **(enforced)**

**N2. One name per component, everywhere.** The directory name in PascalCase is the component (`button/` → `Button`); the spec is `specs/BUTTON.md`; the lab is `labs/button.html`; the browser test is `e2e/button.spec.ts`; the reference partial is `labs/reference/button.css`; the root hook class is `ui-button`. A family shares its owner's names: its other components (`Spinner` beside `ProgressBar`, the parts of a menu) live in the owner's directory, are specified in the owner's spec and styled in the owner's partial, and only their root hook classes carry their own names (`ui-spinner`). Utils in `src/utils/` that the package exports (`src/utils/index.ts`) are shared contracts, each named in the `Implementation:` line of a requirement; internal helpers are covered through the requirements of the components that use them. **(enforced)**

**N3. Components are PascalCase nouns without prefixes** (`Button`, not `UiButton` or `BaseButton`). Parts of a family start with the family's name or its noun (`Tabs` → `TabList`, `Tab`, `TabPanel`). **(enforced: naming convention)**

**N4. Props interfaces are `<Component>Props`** and are exported next to the component. Option types are `<Component><Option>` (`ButtonVariant`) unless the component uses a shared vocabulary type directly (N7).

**N5. Prop names follow one vocabulary.** States are `is*` booleans (`isDisabled`, `isSelected`, `isPending`, `isInvalid`, `isRequired`, `isReadOnly`, `isOpen`, `isExpanded`); options that are not states are plain words (`variant`, `size`, `orientation`, `truncate`); events are `on<Event>` (`onPress`, `onChange`, `onAction`, `onOpenChange`); controlled pairs are `value`/`defaultValue` with `onChange` (or `<thing>`/`default<Thing>` with `on<Thing>Change`); render callbacks are `render<Part>`; accessors are `get<Value>`. Collection keys, selections, placements, sorting and events use the shared types in `src/core/` (`Key`, `Selection`, `Placement`, `SortDescriptor`, `PressEvent`); values are plain data (dates as ISO 8601 strings, colours as CSS colour strings).

**N6. Functions say what they do.** Hooks are `use<Thing>`; pure functions start with a verb (`formatPath`, `resolveOverlayPlacement`, `createModalController`); predicates start with `is`, `has` or `can`. Module constants are `UPPER_SNAKE_CASE` only for exported primitive defaults (`DEFAULT_OVERLAY_GAP`); everything else is camelCase. **(enforced: naming convention, for camelCase and PascalCase in library source; keeping `UPPER_SNAKE_CASE` to exported primitive defaults is checked in review)**

**N7. Shared vocabularies come from `src/core/props.ts`.** Sizes are `Size` values (`xs`, `sm`, `md`, `lg`, `xl`), tones are `Tone` values (`neutral`, `info`, `success`, `warning`, `danger`), orientation is `Orientation`. A component that offers a subset derives it: `type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>`. Never invent a synonym (`error` for `danger`, `medium` for `md`).

**N8. Hooks follow the contract.** Root class `ui-<name>`, slot class `ui-<name>__<slot>`, data attributes and values in kebab-case, all built with `createHooks` (`specs/HOOK-CONTRACT.md`).

## Structure

**S1. Five places for code.** `src/core/` holds the contracts every component uses (hooks, provider, props, glyphs, strings, storage); `src/components/<name>/` holds one component or one family; `src/utils/` holds framework-free helpers and generic React hooks used by more than one component; `src/primitives/` holds the named re-exports of React Aria building blocks, one module per area (`specs/PRIMITIVES.md`); `src/testing/` holds the helpers hosts use in their own tests, which import only `@testing-library/dom` (`specs/TESTING.md`). Nothing else lives in `src/`.

**S2. A component directory contains** `index.ts`, the main module `<name>.tsx`, optional helper modules, and the unit tests `<module>.test.ts(x)` beside the modules they test. **(enforced)**

**S3. `index.ts` only re-exports** the public API with named `export … from` statements. No default exports anywhere (TS7). **(enforced)**

**S4. Import other components through their main module** (`../icon/icon.js`), never through another component's helper modules. Labs import a component through its entry point (`index.js`) or its main module. Relative imports end in `.js`; types use `import type`. **(enforced: lint)**

**S5. Every public component is complete:** a spec with its hook table, unit tests that name the spec's requirement IDs, a lab with its full state matrix, a browser test, and a reference partial when the spec declares class hooks. **(enforced)**

**S6. Module order:** imports, exported types, module constants, private helpers, exported components and hooks.

**S7. React Aria loads only in `src/primitives/`.** Import React Aria building blocks (`Button`, `Popover`, `useLocale`, `Key`, …) from `src/primitives/index.js`, never from `react-aria-components`, `react-aria`, `@internationalized/*` or other React Aria packages. A building block the library has not used yet is added, by name, to its area module first. **(enforced: lint)**

## Inheritance and composition

**I1. Function components only.** No classes in library source, including subclasses of third-party classes: wrap or compose them instead. **(enforced in library source)**

**I2. Props are declared by the library.** Every component that renders an element has props that extend `BaseProps` (`className`, `id`, caller `data-*`) and the shared prop groups it supports (`PressEventProps`, `FocusEventProps`, `AriaLabellingProps`, `OpenStateProps`, `SelectionProps` and the others in `src/core/events.ts`), then declares its own props. It never extends or exposes a building block's props or types: a building block is how the component works today, not its API ([specs/PRIMITIVES.md](../specs/PRIMITIVES.md)). Declare only what the spec documents and the tests and lab use; inside the component, pass the props on to the building block. A component whose element the caller may swap takes `render` typed `ElementRender<E, State>` with a library-declared state ([specs/COMPOSITION.md](../specs/COMPOSITION.md)):

```ts
export interface ButtonProps
  extends BaseProps, PressEventProps, FocusEventProps, AriaLabellingProps {
  variant?: ButtonVariant | undefined;
  isDisabled?: boolean | undefined;
  render?: ElementRender<'button', ButtonRenderState> | undefined;
}
```

**(enforced: every exported component's props include `BaseProps`, except providers, hosts and controllers that render no element of their own; `npm run check:public-types` fails on any public declaration that exposes a building block)**

**I3. Specialise by composition.** A specialised component renders the general one with fixed props (`CopyButton` renders `Button`); it does not copy its markup or logic. Shared behaviour that two components need lives in one exported helper or hook, never in two copies.

**I4. Forward, do not filter.** Spread the remaining props onto the wrapped component or root element, and let `createHooks(...).root({ className, props, data })` merge hook classes and caller attributes. Hook values the component writes win over caller attributes of the same name.

## Simplicity

**C1. Small units.** A function has at most 80 lines and a cyclomatic complexity of at most 15, nests at most three levels deep, and takes at most three parameters (pass an options object instead). A module has at most 300 lines; split helpers into sibling modules before that. **(enforced in library source)**

**C2. No speculative surface.** Every prop, export and option is exercised by a unit test and shown in the lab. Remove what nothing uses.

**C3. Prefer the platform and the building blocks.** Use the behaviour in `src/primitives/` (press, focus, keyboard, overlays, collections) before writing your own; derive values during render instead of storing them in state; reach for an effect only to synchronise with something outside React.

**C4. Comments explain why, not what.** Document public props in one line of TSDoc; comment only non-obvious constraints and workarounds. No commented-out code, no narration, no decorative separators.

**C5. No dead code.** No unused exports, parameters, branches or files. **(enforced: lint for unused variables, parameters and imports; unused exports and files are checked in review)**

## TypeScript

Adapted from the agent-rules TypeScript set ([coding-rules/README.md](coding-rules/README.md)). They apply to every TypeScript file. The enforced ones run in `npm run lint` through the `ui-components/typescript` configs in `eslint.config.js`, which load the TypeScript program; ESLint runs with a 6 GB heap for that reason.

**TS1. `strict` stays on.** Do not weaken `tsconfig.json` to make a file compile.

**TS2. No `any`.** Use `unknown` and narrow it; wrap a third-party `any` at the boundary that receives it. **(enforced: `@typescript-eslint/no-explicit-any`)**

**TS3. No non-null assertions (`value!`).** Narrow the value, restructure so the type proves it, or throw an `Error` where the invariant would break. **(enforced: `@typescript-eslint/no-non-null-assertion`)**

**TS4. No `@ts-ignore` or `@ts-nocheck`.** A `@ts-expect-error` carries a description of what removes it. **(enforced: `@typescript-eslint/ban-ts-comment`)**

**TS5. Import a type-only binding with `import type`** (S4). **(enforced: `@typescript-eslint/consistent-type-imports`)**

**TS6. No `enum`.** Use a string-literal union, or an `as const` object with a derived type. **(enforced)**

**TS7. Named exports only.** A default export is allowed only where a loader requires it: the Vitest and Playwright configuration files. **(enforced: `no-restricted-exports`)**

**TS8. A `switch` over a union handles every member,** or ends in a `default` that handles the rest on purpose. **(enforced: `@typescript-eslint/switch-exhaustiveness-check`)**

**TS9. No floating promises.** `await` a promise, return it, or mark a deliberately detached one with `void` and handle its rejection. Do not pass an async function where the callee expects a synchronous callback. **(enforced: `@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-misused-promises`)**

**TS10. Throw and reject with `Error` objects,** never strings or plain objects. Rethrowing a caught `unknown` value is allowed. **(enforced: `@typescript-eslint/only-throw-error`, `@typescript-eslint/prefer-promise-reject-errors`)**

**TS11. When a `catch` block throws a new error, attach the caught one as `{ cause }`.** **(enforced: `preserve-caught-error`)**

**TS12. Return a discriminated result for expected failures** a caller branches on (`{ ok: true, value } | { ok: false, error }`) instead of throwing.

**TS13. Prefer `type` for unions and derived shapes,** and `interface` for object shapes callers extend, such as props (N4, I2).

**TS14. Give an exported function an explicit return type** when the inferred one is a wide object or a promise the caller must branch on.

**TS15. Three compiler programs check the code** (`npm run typecheck`).

- `tsconfig.json` checks library source, tests, labs and configs with Node's globals, which the tests need.
- `tsconfig.build.json` checks library source again without them (`types: []`), as the build compiles it.
- `tsconfig.scripts.json` checks the Node scripts and local lint rules as JavaScript (`checkJs`). An unannotated parameter there is `any`, and everything else is strict.
- Library source compiles in both global environments, so a timer handle is typed `ReturnType<typeof setTimeout>`, which holds in both.
- Beyond `strict`, the programs set `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns` and `noFallthroughCasesInSwitch`.
- Three flags are deliberately off:
  - `exactOptionalPropertyTypes`: optional props declare `| undefined` so callers may pass `undefined`, but the flag would also reject spreading partial objects at about 200 sites.
  - `noPropertyAccessFromIndexSignature`: records keyed by id are read with dot access.
  - `isolatedDeclarations`: public types are inferred where TS14 does not ask for them.
    **(enforced: `npm run typecheck`)**

## Node scripts

Adapted from the agent-rules Node.js set. They apply to `scripts/` and the configuration files; library source runs in the browser and never reads `process.env` or Node APIs.

**R1. Target the Node version in `package.json` `engines`** (Node 22).

**R2. Read options from arguments,** and environment variables only at the script's entry point, with a default.

**R3. Fail loudly.** A check exits non-zero with a message naming the file and the rule it broke; an unexpected failure stays an `Error` with its original `cause`.

**R4. Scripts that write files can run twice with the same result,** and a script that deletes files deletes only build output.

## Security

Adapted from the agent-rules security set. They apply everywhere.

**SEC1. Markup from the host is untrusted.** Render text as text. Markup components parse what they render through the library's sanitizer (`sanitize-html.ts`) or their own allow-list parser; never pass unsanitized input to `dangerouslySetInnerHTML`.

**SEC2. No `eval`, `new Function` or string timers.**

**SEC3. Component validation is a convenience for the reader, never proof.** Do not describe it as a security check; the host validates on its server.

**SEC4. Keep secrets and tokens out of the repository and out of browser storage.** Persisted state goes through the provider storage adapter.

**SEC5. Pass shell arguments as arrays** (`execFileSync(command, args)`), never as a concatenated command string.

**SEC6. Add dependencies through `npm`** so the lockfile records them.

## Design

**D1. Design for less complexity.** New and touched code follows [coding-rules/a-philosophy-of-software-design.mini.md](coding-rules/a-philosophy-of-software-design.mini.md), vendored unchanged from agent-rules-books. It is review guidance, not lint. In short: measure a design by the complexity a reader must carry, prefer deep modules with small interfaces over pass-through layers, keep each decision inside the module that owns it, define invalid states away rather than making callers defend against them, and use names and comments to state contracts, not mechanics. Where it overlaps a numbered rule, the numbered rule wins.
