# Specs

Each file in this directory specifies one component, one family of components, or one shared contract. Specs are the source of truth for behaviour and for styling hooks; tests and labs verify them.

## Ownership

| Document                             | Owns                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| [HOOK-CONTRACT.md](HOOK-CONTRACT.md) | The rules every hook follows: class and attribute naming, inline styles, caller hooks. |
| [PROVIDER.md](PROVIDER.md)           | `UiProvider`: glyphs, strings, locale, links and storage.                              |
| [COMPOSITION.md](COMPOSITION.md)     | Swapping elements with `render`, merging props, and slot props.                        |
| [COLLECTIONS.md](COLLECTIONS.md)     | Virtualized and incrementally loaded collections.                                      |
| [PRIMITIVES.md](PRIMITIVES.md)       | The one directory that imports React Aria and its companion packages.                  |
| [TESTING.md](TESTING.md)             | The testing helpers hosts use to drive the components in their own tests.              |
| `<COMPONENT>.md`                     | One component's behaviour and **its hook list**, in the `## Hooks` table.              |

A component's hooks are listed only in its own spec. A family spec (for example a menu with items and sections) lists the hooks of every component in the family. No hook is declared in two specs.

## File format

- File names are `UPPER-KEBAB.md`, named after the component (`BUTTON.md`, `ICON-BUTTON.md`).
- The first line is a `# Title` heading.
- Requirements are grouped under `## UIC-<AREA>-<n> - <Group title>` headings. Each requirement is a `### UIC-<AREA>-<n>.<m> - <Title>` heading followed by its statement, then two lines:

  ```markdown
  Implementation: `src/components/button/button.tsx`
  Verification: `src/components/button/button.test.tsx`, `e2e/button.spec.ts`
  ```

  - `<AREA>` is the spec's name in upper case (`BUTTON`, `ICON-BUTTON`, `HOOKS`, `PROVIDER`).
  - `Implementation:` lists the files that implement the requirement, each in backticks.
  - `Verification:` lists the tests that verify it, each in backticks. At least one of those tests names the requirement ID in a test title or comment.
  - IDs are never reused. A withdrawn requirement keeps its heading with the statement `Withdrawn.` and its last verification.

- Optional test sequences use `### UIC-<AREA>-T<n>.<m> - <Title>` headings for multi-step browser checks.
- A component spec ends with a `## Hooks` section holding one table:

  ```markdown
  ## Hooks

  | Hook                | Kind      | Values                          | Description                 |
  | ------------------- | --------- | ------------------------------- | --------------------------- |
  | `ui-button`         | root      |                                 | The `<button>` element.     |
  | `ui-button__icon`   | slot      |                                 | Leading or trailing glyph.  |
  | `data-variant`      | attribute | `primary`, `secondary`, `ghost` | Emphasis.                   |
  | `data-pressed`      | state     | `true`                          | While pressed (React Aria). |
  | `--ui-button-width` | property  |                                 | Measured width, in pixels.  |
  ```

  - `root`: a `ui-<component>` class. `slot`: a `ui-<component>__<slot>` class whose root is in the same table.
  - `attribute`: a `data-*` option the caller chooses (variant, size, orientation). `state`: a `data-*` state the component or React Aria sets.
  - `property`: a measured `--ui-*` custom property set inline.
  - `Values` lists the allowed values in backticks; empty means free text (an ID, a count).

`npm run check:specs` enforces this format, the existence of every listed path, that the listed tests name each ID, that every component directory is implemented by some spec, and that the reference stylesheet partials (`labs/reference/`) style every root and slot hook. The test helper `expectHooksMatchSpec` in `test/hooks.ts` fails a test when rendered markup carries a hook its spec does not declare.

## Host requirement IDs

Specs never mention a host application or its requirement IDs. A host that maps its own IDs to `UIC-` IDs keeps that map in its own repository.
