# Section Header

`SectionHeader` titles a section: a heading, optional supporting text and optional trailing actions or status. `Section` renders a `<section>` region named by the same header, followed by its content in a `Stack`; nested sections take the next heading level, and a collapsible section's title toggles its content. A framed section is a [Card](CARD.md), whose title block is the same header.

## UIC-SECTION-HEADER-1 - Contract

### UIC-SECTION-HEADER-1.1 - Parts

`SectionHeader` shall render a `<header>` holding a `ui-section-header__content` with the title heading (`ui-section-header__title`) and, when given, the `ui-section-header__description`, followed by the `ui-section-header__actions` when given. A description or actions that are `null`, `undefined`, a boolean or an empty string render no slot.

Implementation: `src/components/section-header/section-header.tsx`
Verification: `src/components/section-header/section-header.test.tsx`, `e2e/section-header.spec.ts`

### UIC-SECTION-HEADER-1.2 - Heading

The title shall render in a heading of `headingLevel` 1 to 6, by default the automatic level ([UIC-SECTION-HEADER-2.1](#uic-section-header-21---automatic-heading-levels)), with an id generated per instance that stays the same across rerenders and differs between instances with the same title.

Implementation: `src/components/section-header/section-header.tsx`
Verification: `src/components/section-header/section-header.test.tsx`

### UIC-SECTION-HEADER-1.3 - Named sections

`Section` shall render a `<section>` whose `aria-labelledby` names its heading, so the region is named by the visible title only; the description and actions stay out of the name. A standalone `SectionHeader` and its `<header>` are not named, so the heading keeps its place in heading navigation, and the `<header>` carries `role="none"` so it never becomes the page's `banner` landmark, wherever the host places it. `space` (the gap before the content, `2xl` by default), `grow`, `fill` and `clip` work as on `Stack` ([LAYOUT.md](LAYOUT.md)).

Implementation: `src/components/section-header/section-header.tsx`
Verification: `src/components/section-header/section-header.test.tsx`, `e2e/section-header.spec.ts`

### UIC-SECTION-HEADER-1.4 - No states of its own

The header shall add no interactive, busy or disabled state: actions keep their own behaviour, disabled state and status semantics, and a rerender with a new title, description or actions keeps the section's content mounted.

Implementation: `src/components/section-header/section-header.tsx`
Verification: `src/components/section-header/section-header.test.tsx`, `e2e/section-header.spec.ts`

### UIC-SECTION-HEADER-1.5 - Hooks and caller attributes

`SectionHeader` and `Section` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to their root; caller attributes never replace a hook attribute.

Implementation: `src/components/section-header/section-header.tsx`
Verification: `src/components/section-header/section-header.test.tsx`

### UIC-SECTION-HEADER-1.6 - Reference layout

In the reference stylesheet the actions shall follow the text on one row and wrap below it in a narrow container, without horizontal overflow.

Implementation: `labs/reference/section-header.css`
Verification: `e2e/section-header.spec.ts`

### UIC-SECTION-HEADER-1.7 - Framed sections

A framed section shall be a [Card](CARD.md) given the same `title`, `description`, `actions` and `headingLevel`; there is no card variant of `SectionHeader`. The card's single `<header>` holds the same parts in the same order (the title heading and the description grouped in `ui-card__heading`, then `ui-card__actions`) without nesting a second header, names the card's region by the title only through a heading id unique per instance and stable across rerenders, keeps the actions' own behaviour and disabled state, and keeps Card's `variant`, `density` and other options. In the reference stylesheet the card's title and description use the same type, line height and spacing as a section header's. Card's actions occupy their own line below the title block as UIC-CARD-6.3 requires; SectionHeader's actions follow UIC-SECTION-HEADER-1.6.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/section-header/section-header.test.tsx`, `e2e/section-header.spec.ts`

## UIC-SECTION-HEADER-2 - Nesting and collapsing

### UIC-SECTION-HEADER-2.1 - Automatic heading levels

A `SectionHeader`, `Section` or titled [Card](CARD.md) without `headingLevel` shall take one level below the nearest enclosing `Section` or titled card, down to 6, and level 3 outside any. A `Section` or titled card publishes its own level to its content, so nesting follows the document outline without counting levels; an explicit `headingLevel` sets the level of that heading and of the levels below it. A host sets the level of top-level sections by providing `HeadingLevelContext` (the level of the heading above them), and its own headings follow with `useHeadingLevel(level)`, which returns `level` when given and the automatic level otherwise. The body of a `Modal`, `Drawer` or `Popover` publishes its dialog title's level, 2, so sections in a dialog start at 3 wherever the dialog was opened.

Implementation: `src/core/heading-level.ts`, `src/components/section-header/section-header.tsx`, `src/components/card/card.tsx`
Verification: `src/components/section-header/section-header.test.tsx`, `e2e/section-header.spec.ts`

### UIC-SECTION-HEADER-2.2 - Collapsible section

A `collapsible` section shall be a disclosure whose title is the trigger: the heading holds a `ui-section-header__trigger` button with the title after a `ui-section-header__chevron` glyph (pointing to the inline end while collapsed, down while expanded), whose `aria-expanded` and `aria-controls` name the content's `ui-section__panel` (React Aria's disclosure behaviour, holding the content in a `Stack` with the section's `space`). The section stays a `<section>` named by its title, publishes `data-collapsible` and, while open, `data-expanded`; the description and actions stay outside the trigger and never toggle it. `isExpanded` controls the state, `defaultExpanded` (true by default) starts it, and `onExpandedChange` receives each request. The panel keeps React Aria's `hidden="until-found"` while collapsed, so find-in-page opens it, and React Aria's `--disclosure-panel-height` and `--disclosure-panel-width` for animating it.

Implementation: `src/components/section-header/section-header.tsx`, `labs/reference/section-header.css`
Verification: `src/components/section-header/section-header.test.tsx`, `e2e/section-header.spec.ts`

### UIC-SECTION-HEADER-2.3 - Changing collapsibility

Every `Section` shall hold its content in the `ui-section__panel` element, a plain container while it is not collapsible, so turning `collapsible` on or off keeps the content mounted with its state, its focus and its heading levels. A section turned collapsible starts from `isExpanded`, else `defaultExpanded` as first given; when that hides content that holds focus, focus moves to the trigger. Focus is read through open shadow roots, so this holds for a section inside one.

Implementation: `src/components/section-header/section-header.tsx`, `src/utils/focus-target.ts`
Verification: `src/components/section-header/section-collapse.test.tsx`, `e2e/section-header.spec.ts`

## Hooks

| Hook                             | Kind  | Values | Description                                                                |
| -------------------------------- | ----- | ------ | -------------------------------------------------------------------------- |
| `ui-section-header`              | root  |        | The `<header>`.                                                            |
| `ui-section-header__content`     | slot  |        | Title and description.                                                     |
| `ui-section-header__title`       | slot  |        | The heading.                                                               |
| `ui-section-header__trigger`     | slot  |        | A collapsible section's title button, inside the heading.                  |
| `ui-section-header__chevron`     | slot  |        | The trigger's expand glyph.                                                |
| `ui-section-header__description` | slot  |        | Supporting text.                                                           |
| `ui-section-header__actions`     | slot  |        | Trailing actions or status.                                                |
| `ui-section`                     | root  |        | `Section`'s `<section>`, also a `Stack` (`ui-stack` and its attributes).   |
| `ui-section__panel`              | slot  |        | The section's content; a disclosure panel while collapsible.               |
| `data-collapsible`               | state | `true` | On `ui-section`: the title toggles the content.                            |
| `data-expanded`                  | state | `true` | On a collapsible `ui-section`: the content shows (React Aria).             |
| `data-focus-visible-within`      | state | `true` | On a collapsible section or its panel: keyboard focus inside (React Aria). |
| `data-hovered`                   | state | `true` | On the trigger (React Aria).                                               |
| `data-pressed`                   | state | `true` | On the trigger (React Aria).                                               |
| `data-focused`                   | state | `true` | On the trigger (React Aria).                                               |
| `data-focus-visible`             | state | `true` | On the trigger, focused by keyboard (React Aria).                          |
