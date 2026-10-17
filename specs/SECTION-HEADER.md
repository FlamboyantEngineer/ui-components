# Section Header

`SectionHeader` titles a section: a heading, optional supporting text and optional trailing actions or status. `Section` renders a `<section>` region named by the same header, followed by its content in a `Stack`.

## UIC-SECTION-HEADER-1 - Contract

### UIC-SECTION-HEADER-1.1 - Parts

`SectionHeader` shall render a `<header>` holding a `ui-section-header__content` with the title heading (`ui-section-header__title`) and, when given, the `ui-section-header__description`, followed by the `ui-section-header__actions` when given. A description or actions that are `null`, `undefined`, `false` or an empty string render no slot.

Implementation: `src/components/section-header/section-header.tsx`
Verification: `src/components/section-header/section-header.test.tsx`, `e2e/section-header.spec.ts`

### UIC-SECTION-HEADER-1.2 - Heading

The title shall render in a heading of `headingLevel` 1 to 6, 3 by default, with an id generated per instance that stays the same across rerenders and differs between instances with the same title.

Implementation: `src/components/section-header/section-header.tsx`
Verification: `src/components/section-header/section-header.test.tsx`

### UIC-SECTION-HEADER-1.3 - Named sections

`Section` shall render a `<section>` whose `aria-labelledby` names its heading, so the region is named by the visible title only; the description and actions stay out of the name. A standalone `SectionHeader` and its `<header>` are not named, so the heading keeps its place in heading navigation. `space` (the gap before the content, `md` by default), `grow`, `fill` and `clip` work as on `Stack` ([LAYOUT.md](LAYOUT.md)).

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

## Hooks

| Hook                             | Kind | Values | Description                                                              |
| -------------------------------- | ---- | ------ | ------------------------------------------------------------------------ |
| `ui-section-header`              | root |        | The `<header>`.                                                          |
| `ui-section-header__content`     | slot |        | Title and description.                                                   |
| `ui-section-header__title`       | slot |        | The heading.                                                             |
| `ui-section-header__description` | slot |        | Supporting text.                                                         |
| `ui-section-header__actions`     | slot |        | Trailing actions or status.                                              |
| `ui-section`                     | root |        | `Section`'s `<section>`, also a `Stack` (`ui-stack` and its attributes). |
