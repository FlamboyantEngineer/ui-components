# Card

`Card` is a framed container for a self-contained group of content: a settings section, a dashboard widget, a record tile or a tool panel. It draws optional media, an optional header (a title block with a description and actions, or custom header content), a body and an optional footer. With `href` or `onAction` the whole card is a link or press target. `CardGrid` arranges cards as a navigable, selectable collection. Grouping without a frame belongs to layout, or to a [Section](SECTION-HEADER.md) whose header matches a card's title block; a region with nothing to show is an [Empty State](EMPTY-STATE.md).

A record card with a status, metadata, a preview while collapsed, actions and details, in place of a header, summary and disclosure composed by the host:

```tsx
<Card
  title="Orchard row 4"
  abbreviation="R4"
  leading={<Badge tone="success">Active</Badge>}
  description="Twelve plum trees along the south wall"
  meta="Updated Monday"
  summary={<ProgressBar label="Harvest" value={40} />}
  actions={<Button size="sm">Water</Button>}
  isCollapsible
  isExpanded={isExpanded}
  onExpandedChange={setExpanded}
  presentationSteps={{ compact: { width: 320 }, minimal: { width: 120 } }}
>
  <TextField label="Notes" />
</Card>
```

## UIC-CARD-1 - Structure

### UIC-CARD-1.1 - Parts

`Card` shall render a `<section>` holding a `<header>` in the `ui-card__header` slot when it has header content, its children in the `ui-card__body` slot (always), and `footer` in a `<footer>` in the `ui-card__footer` slot when given. A card without header content renders no header.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-1.2 - Title block

The header shall hold the `title` as a heading (the level `headingLevel` chooses, 1 to 6, else the automatic level of [Section Header](SECTION-HEADER.md#uic-section-header-21---automatic-heading-levels)) in the `ui-card__title` slot and the `description` in the `ui-card__description` slot, both inside a `ui-card__heading` group, and `actions` in the `ui-card__actions` slot after the header row's controls ([UIC-CARD-6.3](#uic-card-63---header-row)). Empty values (`undefined`, `null`, `false` or `""`) render no slot. `header` replaces the title block and actions with the caller's own content. Headings in the body sit one level below a titled card's title (its own `title` or a slotted `CardTitle`, clamped at 6); an untitled card leaves the level of its surroundings. The body stays mounted, with its state and focus, while a title arrives, leaves or gives way to a custom header.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `src/components/card/card-heading.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-1.3 - Region name and roles

A card with a `title` shall be named by it through `aria-labelledby` and a heading ID that is unique per instance and stable across renders, so it is a region a reader can navigate to; the description and actions stay outside the name. A caller's `aria-label` or `aria-labelledby` replaces that name, and a caller `role` (the role a surrounding collection gives its items) passes through. The card itself takes no focus: a card that opens something sits inside the link or button that does.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-1.4 - Slotted title in a custom header

Custom `header` content shall name the card by the `CardTitle` it holds ([COMPOSITION.md](COMPOSITION.md#uic-composition-31---slot-props)): `CardTitle` renders a heading at the card's level (`headingLevel`, else the automatic level) with the card's title `id`, the `ui-card__title` class and the caller's `className` and `data-*` attributes. Once it renders, the card is named by it as by its own title ([UIC-CARD-1.3](#uic-card-13---region-name-and-roles)); without one the card has no name of its own, and a caller's `aria-label` or `aria-labelledby` still wins. Other headings in the header are left alone, and a `CardTitle` outside a card's custom header is a plain heading at the automatic level.

Implementation: `src/components/card/card.tsx`, `src/components/card/card-parts.tsx`
Verification: `src/components/card/card.test.tsx`, `src/components/card/card-heading.test.tsx`, `e2e/card.spec.ts`

## UIC-CARD-2 - Options

### UIC-CARD-2.1 - Variants

`variant` shall publish `data-variant`: `default` (content on the page) or `panel` (a chrome region, on a muted surface in the reference sheet).

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.2 - Densities

`density` shall publish `data-density`: `default` (the header, body and footer keep their own insets), `comfortable`, `compact` or `tight`, which give the card one interior padding instead, so a host never layers padding around the parts. The reference sheet uses 10, 8 and 4 pixel interiors.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.3 - Selected

`isSelected` shall publish `data-selected` for the current card, such as a selected record, so the stylesheet draws a selection edge. The card offers no disabled, loading or invalid state; the control that selects a card exposes the selection to assistive technology.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.4 - Layout options

`interactive` shall publish `data-interactive` (a hover affordance for a card inside a link or button), `flush` `data-flush` (set into a surrounding frame), `fill` `data-fill` (the body is a canvas that grows to the card's height and owns its interior) and `fullWidth` `data-full-width`.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`

### UIC-CARD-2.5 - Hooks and caller attributes

`Card` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `hidden` to its root, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`

## UIC-CARD-3 - Whole-card action

### UIC-CARD-3.1 - Title action

With `href`, the card's title shall render inside its heading as a link in the `ui-card__action` slot, drawn through the provider's link renderer with `target` and `rel` (`target="_blank"` adds `noopener` and `noreferrer` to the caller's `rel`, as a [Link](LINK.md#uic-link-22---new-tabs) does). With `onAction` and no `href`, the title shall render as a React Aria `Button` in the same slot that calls `onAction` on pointer, Enter and Space activation; with both, following the link also calls `onAction`. The action is named by the title, the card stays a region named by its title, and the card publishes `data-interactive`.

Implementation: `src/components/card/card.tsx`, `src/components/card/card-action.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-3.2 - Pressing the card

A pointer click anywhere on a card with an action shall activate the action, with the same button and modifier keys, unless the click lands in an inner control (a link, a button, a form control or label, or an element with a widget role, even a roving item out of the tab order, or a tab stop of its own) or one of the library's gesture surfaces that carry no role (a `NumberField` slider track and thumbs and its scrub handle, a `ScrollRegion` overlay track and a `SignaturePad` surface), or ends a press that started on one (a slider drag, a scrub or a signature stroke released elsewhere on the card), in an editor (inside an element whose `contenteditable` is anything but `false`, inherited or not), in an actionable card nested inside it (the innermost actionable card owns the click, and the cards around it do nothing) or in content portalled out of the card (a popover, menu or dialog the card opened), was already handled (`preventDefault`), or ends a text selection inside the card. Inner controls keep their own behaviour, and keyboard users reach the action and each inner control as separate tab stops. The click is repeated on the first action element the card registered that is still mounted, so a later copy that mounts and leaves (such as a tooltip's) never takes the action over; a click after the cut title's tooltip closes still activates the card.

Implementation: `src/components/card/card-action.tsx`, `src/utils/is-interactive-target.ts`
Verification: `src/components/card/card.test.tsx`, `src/components/card/card-action.test.tsx`, `src/components/card/card-collapse.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-3.3 - Slotted action in a custom header

A `CardAction` in custom `header` content shall draw the card's action ([COMPOSITION.md](COMPOSITION.md#uic-composition-31---slot-props)): for `href` a link through the provider's link renderer with `target` and `rel` that also calls `onAction` when followed, and for `onAction` alone a React Aria `Button`, each with the `ui-card__action` class and named by its content or its `aria-label`. Clicks on the card then activate it ([UIC-CARD-3.2](#uic-card-32---pressing-the-card)). Without a card action it renders its children as they are; other links and buttons in the header are left alone.

Implementation: `src/components/card/card-action.tsx`, `src/components/card/card-parts.tsx`, `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`

## UIC-CARD-4 - Media and loading

### UIC-CARD-4.1 - Media

`media` shall render in the `ui-card__media` slot as the card's first part, before the header, for a cover image or preview that the stylesheet draws edge to edge. An empty value renders no slot.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-4.2 - Loading skeleton

`isLoading` shall publish `data-loading`, set `aria-busy="true"` and replace the body's content with a decorative `ui-card__skeleton` slot hidden from assistive technology, which the stylesheet draws as placeholder lines. The slot is a [Skeleton](SKELETON.md) block, so it also carries `ui-skeleton` and its attributes and a host draws it like its other placeholders. The media, header and footer stay. Without it neither attribute renders.

Implementation: `src/components/card/card.tsx`, `src/components/skeleton/skeleton.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

## UIC-CARD-5 - Card collections

### UIC-CARD-5.1 - Grid

`CardGrid` shall render React Aria's `GridList` in its `grid` layout with the `ui-card-grid` root, and `CardGridItem` a `GridListItem` (keyed by its `id`) with the `ui-card-grid-item` root around its content, usually a `Card` that takes `role="group"` from the caller ([UIC-CARD-1.3](#uic-card-13---region-name-and-roles)). Arrow keys move focus between cards in two dimensions by their positions on screen (in the `waterfall` layout, Left and Right move by position and Up and Down in collection order), Home and End reach the first and last card, and typing moves to the card whose `textValue` starts with the typed text. A text control inside a card (a text input, a slider or select, a text area, editable content, or an element with role `textbox` or `combobox`) keeps every key but Tab and Escape: the arrow keys, Home, End and typed characters move its caret or change its value, and neither the card's navigation between its controls, the grid's arrow keys nor its typeahead take them; Tab and Escape still reach the grid. The grid needs an `aria-label` or `aria-labelledby`.

Implementation: `src/components/card/card-grid.tsx`, `labs/reference/card.css`, `src/utils/text-control-keys.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`, `src/utils/text-control-keys.test.tsx`

### UIC-CARD-5.2 - Collection children

Cards shall come from `CardGridItem` children, or from `items` with a function in `children` that draws one per item and redraws them when `dependencies` change. `virtualized` shall render the grid through React Aria's `Virtualizer` with its grid layout, so only the cards in view of the bounded grid, plus a small buffer, are in the document; `layout="waterfall"` lays out cards of different heights in columns through React Aria's waterfall layout, always virtualized. `minItemSize` (`{ width, height }` in pixels, 200 by 200 by default) sets the smallest card either virtual layout draws. `onLoadMore` shall be called when the end of the cards scrolls into view while `isLoading` is false, through React Aria's `GridListLoadMoreItem` after the cards (`ui-card-grid__loader`); while `isLoading`, it shows a small loading [EmptyState](EMPTY-STATE.md) reading the provider's `loading` string. `renderEmptyState` draws the empty grid, which publishes `data-empty`.

Implementation: `src/components/card/card-grid.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-5.3 - Selectable cards

`selectionMode` (`single` or `multiple`), `selectionBehavior`, `selectedKeys`, `defaultSelectedKeys` and `onSelectionChange` (with the new `Selection`) shall select cards with the pointer and with Space, as React Aria's grid list does, and items publish React Aria's `data-selected`. While the grid selects with toggles (the default `selectionBehavior`), each item has a selection [Checkbox](CHECKBOX.md) in the `ui-card-grid-item__checkbox` slot, which React Aria names after the item: the first `Card` the item holds draws it at the start of its header row ([UIC-CARD-6.3](#uic-card-63---header-row)), claiming it before paint, and an item whose content is no card draws it before its content. Cards nested inside that card never draw it. A function in an item's `children` receives `{ isSelected }`, which a card draws through its own `isSelected`. Changing `layout` or `virtualized` mounts React Aria's grid list afresh; the grid keeps an uncontrolled selection itself, so the reader's selection survives the change in either direction with no new `onSelectionChange` (a controlled selection simply follows `selectedKeys`), and the card that held focus takes it again once the new layout renders it, unless focus has moved elsewhere. Cards a virtual layout leaves out of the document keep their selection.

Implementation: `src/components/card/card-grid.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-5.4 - Card actions in a grid

`onAction` on the grid (with the card's key) or on an item, and `href` on an item, shall act on a card as React Aria's grid list does: with toggle selection, Enter or a press opens the card while no card is selected, and selects once some are; so a card collection opens a card without nesting a link inside each card. A menu or popover a control inside a card opened returns focus to that control as it closes, not to the card's row.

Implementation: `src/components/card/card-grid.tsx`
Verification: `src/components/card/card.test.tsx`

## UIC-CARD-6 - Header regions and collapse

### UIC-CARD-6.1 - Leading content, metadata and summary

`leading` shall render before the title block in the `ui-card__leading` slot (a status icon or badges), and `meta` inside the title block after the description in the `ui-card__meta` slot (an owner, a date). `summary` renders after the header in the `ui-card__summary` slot and shows only while a collapsible card is collapsed, as its preview (progress, a current activity); it stays mounted, `hidden`, while the card is expanded. Empty values render no slot, and a hidden region leaves no element, border or padding behind.

Implementation: `src/components/card/card-header.tsx`, `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card-collapse.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-6.2 - Collapsible card

`isCollapsible` shall draw an expand and collapse control in the header (`ui-card__toggle`, a [Button](BUTTON.md)) named "Details" followed by the card's title (the provider's `details` string), with `aria-expanded` and `aria-controls` naming the regions it shows and hides: the media, body and footer. The state is controlled with `isExpanded` or held from `defaultExpanded` (default `true`); `onExpandedChange` receives each requested state, also while controlled, and a controlled card follows its owner's value only. A collapsed card keeps those regions mounted but `hidden`, so drafts, editor state and pending work survive toggling while the regions take no space and leave the tab order and the accessibility tree. The root publishes `data-collapsible` and, while expanded, `data-expanded`. `isToggleDisabled` disables the control and keeps the state. The control works the same in a custom header, beside the caller's content.

Activating the control never activates the card's action, its grid item's selection or a drag: it is an inner control ([UIC-CARD-3.2](#uic-card-32---pressing-the-card)). Collapse is independent of the action, selection, loading, density and layout options. When a change of state from outside hides the element that holds focus inside the card, focus moves to the control (or, in the minimal presentation, the More button); focus anywhere else stays.

Implementation: `src/components/card/card.tsx`, `src/components/card/card-header.tsx`, `src/components/card/card-focus.ts`, `labs/reference/card.css`
Verification: `src/components/card/card-collapse.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-6.3 - Header row

The header shall render its parts in this order: the selection checkbox of the grid item holding the card ([UIC-CARD-5.3](#uic-card-53---selectable-cards)), the leading content, the title block (or a custom header's content, after its abbreviation), the expand and collapse control, the More button, then the actions. The reference sheet lays the parts up to More on one row, each control in its own room and the title block taking what is left (wrapping or cutting the title), and puts the actions on a line of their own below, so no control lies over another or over the title at any width, presentation or direction; reading and focus order follow the same order. The selection checkbox stays on the row in every presentation, `minimal` included.

Implementation: `src/components/card/card-header.tsx`, `src/components/card/card-selection.tsx`, `src/components/card/card-grid.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card-collapse.test.tsx`, `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

## UIC-CARD-7 - Adaptive presentation

### UIC-CARD-7.1 - Presentations by allocated space

The host sets each card's breakpoints with `presentationSteps` (`compact` and `minimal`, each a `width`, a `height` or both, in pixels); the library has no defaults. With at least one breakpoint, the card shall measure its own border box, which its container sizes, and publish `data-presentation`: `compact` below a `compact` breakpoint, `minimal` below a `minimal` one, else `full`, taking the smaller of what its width and its height call for. A presentation without a breakpoint is never shown, and a height breakpoint suits a card whose height is its container's, such as a `fill` card. Growing past a threshold takes 8 pixels more than shrinking below it, so resizing never oscillates, and the presentation never changes the size it is measured by. A card without breakpoints publishes no presentation and keeps every region. The presentation never changes the expanded state or calls `onExpandedChange`.

Implementation: `src/components/card/card-presentation.ts`, `src/components/card/card.tsx`
Verification: `src/components/card/card-collapse.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-7.2 - What each presentation shows

`full` shows every region. `compact` keeps the leading content, the title, the summary and the toggle in one header line and moves the description, metadata and actions behind the More button. `minimal` keeps only the title (the `abbreviation` when given, else the title cut to the room left) and moves the leading content, description, metadata, summary, actions and toggle behind it. A smaller presentation moves secondary content (description, metadata) before identity (title, leading content).

A moved region never changes place: it keeps its element, its parent and its mounted content in every presentation, carries `data-moved`, and is `hidden` until More is open, so an uncontrolled input, a child's state and its pending work survive every change of presentation and every opening and closing of More. Each region renders exactly once, so no control or id is duplicated. The More button (`ui-card__more`, named "Show more" followed by the title, the provider's `showMore` string) shows whenever a present region was moved and is a disclosure, not a menu: it draws a plus (the `plus` icon) while the moved regions are hidden and a minus (the `minus` icon) while they show, so it reads apart from a menu's three dots and from the toggle's chevron; `aria-expanded` and `data-expanded` tell whether it is open, `aria-controls` lists the moved regions, and opening it reveals them where they stand, which the reference sheet lays out on lines after the header row, the revealed actions set off by a rule, so every action and the toggle stay reachable at every size. Escape in a region its More revealed closes More and returns focus to it, found by id in the card's own tree (the shadow root holding it, else its document), unless the Escape belongs to a text composition or a control inside already handled it (its default was prevented), which leaves it with that control; in nested cards the Escape belongs to the card whose revealed region holds it. A change of presentation closes More. Outside `full`, the title is cut by the stylesheet in a [Truncation Tooltip](TRUNCATION-TOOLTIP.md), which shows it whole on hover and focus. An abbreviation shows in the `ui-card__abbreviation` slot hidden from assistive technology while the whole title stays in the heading, visually hidden, so the heading level and the card's accessible name do not change; the stylesheet cuts text at grapheme boundaries, so no character is split. A custom header keeps its content on screen until `minimal`; there, with an `abbreviation`, the abbreviation shows and the content becomes a moved region: mounted, so its `CardTitle` still names the card and its state survives, and revealed by More with every control in it, its `CardAction` included. Without an abbreviation the content stays on screen. When a presentation change removes the focused element, focus moves to the More button, else the toggle or the card's action. The presentation never hides the media, body or footer: an expanded card keeps them at every size, and in `minimal` the reference sheet lets them scroll sideways, so a host collapses a card it wants reduced to its header. The reference sheet's minimal card fits two characters and the More button in about 50 pixels, plus the selection checkbox in a selectable grid.

Implementation: `src/components/card/card-header.tsx`, `src/components/card/card-focus.ts`, `src/components/card/card-more.tsx`, `src/utils/owner-window.ts`, `labs/reference/card.css`
Verification: `src/components/card/card-collapse.test.tsx`, `e2e/card.spec.ts`

## Hooks

| Hook                          | Kind      | Values                                       | Description                                                                                  |
| ----------------------------- | --------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ui-card`                     | root      |                                              | The `<section>`.                                                                             |
| `ui-card__media`              | slot      |                                              | Full-bleed media before the header.                                                          |
| `ui-card__header`             | slot      |                                              | The `<header>`, when the card has header content.                                            |
| `ui-card__heading`            | slot      |                                              | Groups the title and description.                                                            |
| `ui-card__title`              | slot      |                                              | The title heading.                                                                           |
| `ui-card__action`             | slot      |                                              | The title's link or button, or the slotted action.                                           |
| `ui-card__description`        | slot      |                                              | Supporting text under the title.                                                             |
| `ui-card__actions`            | slot      |                                              | Header controls or status, on their own line after the header row.                           |
| `ui-card__leading`            | slot      |                                              | Leading content before the title block.                                                      |
| `ui-card__abbreviation`       | slot      |                                              | The minimal presentation's short title (hidden from AT).                                     |
| `ui-card__meta`               | slot      |                                              | Metadata in the title block.                                                                 |
| `ui-card__toggle`             | slot      |                                              | The expand and collapse control (also `ui-button`).                                          |
| `ui-card__more`               | slot      |                                              | The More disclosure button (also `ui-button`).                                               |
| `ui-card__summary`            | slot      |                                              | The collapsed card's preview.                                                                |
| `ui-card__body`               | slot      |                                              | The body.                                                                                    |
| `ui-card__skeleton`           | slot      |                                              | The loading placeholder (also `ui-skeleton`).                                                |
| `ui-card__footer`             | slot      |                                              | The `<footer>`.                                                                              |
| `ui-card-grid`                | root      |                                              | The card collection (`role="grid"`).                                                         |
| `ui-card-grid__loader`        | slot      |                                              | The loading item after the cards while more load.                                            |
| `ui-card-grid-item`           | root      |                                              | One item of the collection (`role="row"`).                                                   |
| `ui-card-grid-item__checkbox` | slot      |                                              | The selection checkbox (also `ui-checkbox`), first in its card's header row.                 |
| `data-variant`                | attribute | `default`, `panel`                           | Surface.                                                                                     |
| `data-density`                | attribute | `default`, `comfortable`, `compact`, `tight` | Interior padding.                                                                            |
| `data-presentation`           | attribute | `full`, `compact`, `minimal`                 | An adaptive card's presentation.                                                             |
| `data-collapsible`            | state     | `true`                                       | The card has an expand and collapse control.                                                 |
| `data-moved`                  | state     | `true`                                       | A region the presentation moved behind More, hidden until More opens.                        |
| `data-expanded`               | state     | `true`                                       | A collapsible card shows its media, body and footer, its toggle shows that, or More is open. |
| `data-selected`               | state     | `true`                                       | The current card, or a selected item (React Aria).                                           |
| `data-loading`                | state     | `true`                                       | The card's content is loading.                                                               |
| `data-layout`                 | state     | `grid`                                       | The grid's layout (React Aria).                                                              |
| `data-empty`                  | state     | `true`                                       | The grid has no items (React Aria).                                                          |
| `data-focused`                | state     | `true`                                       | Focus on the grid or an item (React Aria).                                                   |
| `data-focus-visible`          | state     | `true`                                       | Keyboard focus on the grid or an item (React Aria).                                          |
| `data-hovered`                | state     | `true`                                       | Pointer over an item (React Aria).                                                           |
| `data-pressed`                | state     | `true`                                       | An item being pressed (React Aria).                                                          |
| `data-disabled`               | state     | `true`                                       | A disabled item (React Aria).                                                                |
| `data-selection-mode`         | state     | `single`, `multiple`                         | The grid's selection mode, on items (React Aria).                                            |
| `data-focus-visible-within`   | state     | `true`                                       | Keyboard focus inside an item (React Aria).                                                  |
| `data-orientation`            | state     | `vertical`                                   | The grid's orientation (React Aria).                                                         |
| `data-collection`             | state     |                                              | React Aria's collection marker, on the grid and items.                                       |
| `data-key`                    | state     |                                              | An item's `id` (React Aria).                                                                 |
| `data-interactive`            | state     | `true`                                       | Answers to a pointer.                                                                        |
| `data-flush`                  | state     | `true`                                       | Set into a surrounding frame.                                                                |
| `data-fill`                   | state     | `true`                                       | The body grows to the card's height.                                                         |
| `data-full-width`             | state     | `true`                                       | Fills the container's width.                                                                 |
