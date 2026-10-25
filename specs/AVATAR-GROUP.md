# Avatar Group

`AvatarGroup` stacks the avatars of a set of people, such as the assignees or reviewers of an item, overlapping one another, with a `+N` count for the ones past a maximum. It is not presence: it draws who is involved, not who is here now ([Presence Strip](AVATAR-GROUP.md) does that). Assistive technology hears everyone's names; a pressable group lists everyone in a popover.

## UIC-AVATAR-GROUP-1 - Stack

### UIC-AVATAR-GROUP-1.1 - Avatars in order

`AvatarGroup` shall draw an `Avatar` for each visible person, in the order of `people`, each also carrying the `ui-avatar-group__avatar` slot class and receiving the person's identity fields ([AVATAR.md](AVATAR.md)) with the group's `size` (`xs`, `sm`, `md` by default, `lg`, published in `data-size`), `variant` and `colorCount`. A person's element is kept across renders by their `id`, and repeated ids are allowed. A group with no people renders nothing. The stack's overlap belongs to the host stylesheet; later avatars paint over earlier ones.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/utils/stable-keys.ts`
Verification: `src/components/avatar-group/avatar-group.test.tsx`, `e2e/avatar-group.spec.ts`

### UIC-AVATAR-GROUP-1.2 - Maximum and overflow

`maxVisible` shall show at most that many people from the start of the list, a whole non-negative number, all of them when it is missing. The `ui-avatar-group__overflow` element shall show `+N` for the `N` people past it, and is absent when `N` is zero.

Implementation: `src/components/avatar-group/avatar-group.tsx`
Verification: `src/components/avatar-group/avatar-group.test.tsx`, `e2e/avatar-group.spec.ts`

## UIC-AVATAR-GROUP-2 - Names and action

### UIC-AVATAR-GROUP-2.1 - Accessible names

The group shall be a `role="group"` named by the trimmed `aria-label`, otherwise by every person's name joined by commas, blank names reading as the provider's `unnamed` string. Each avatar is a named image, and the overflow is a `role="img"` named by the provider's `morePeople` string with the names it hides (`2 more people: Priya Nair, Tom Li`). With `action="none"` (the default, published in `data-action`) the group has no tab stop.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/core/strings.ts`
Verification: `src/components/avatar-group/avatar-group.test.tsx`, `e2e/avatar-group.spec.ts`

### UIC-AVATAR-GROUP-2.2 - Listing everyone

With `action="list"`, the stack shall be one React Aria button (`ui-avatar-group__trigger`) inside the group, named by its content (each visible avatar's name, then the overflow's, separated by commas in `VisuallyHidden` text), so its name holds what it shows ([VISUALLY-HIDDEN.md](VISUALLY-HIDDEN.md)). Pressing it, by click, Enter or Space, opens a `Popover` ([POPOVER.md](POPOVER.md)) in the `ui-avatar-group__popover` slot, titled by the provider's `peopleCount` string (`6 people`), holding a list (`ui-avatar-group__list`, a `<ul>`) of everyone in order, hidden ones included, each item (`ui-avatar-group__item`) a small `UserIdentity` with the person's identity fields and their `description` ([USER-IDENTITY.md](USER-IDENTITY.md)). Escape or an outside press closes it and focus returns to the button.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/components/visually-hidden/visually-hidden.tsx`, `src/core/presentation-strings.ts`, `labs/reference/avatar-group.css`
Verification: `src/components/avatar-group/avatar-group.test.tsx`, `e2e/avatar-group.spec.ts`

### UIC-AVATAR-GROUP-2.3 - Hooks and caller attributes

`AvatarGroup` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/avatar-group/avatar-group.tsx`
Verification: `src/components/avatar-group/avatar-group.test.tsx`

## UIC-AVATAR-GROUP-11 - People

### UIC-AVATAR-GROUP-11.1 - Order and status

`AvatarGroup` shall draw a `Avatar` for each visible person, in the order of `people`, each also carrying the `ui-avatar-group__avatar` slot class and receiving the person's avatar fields, `status` and `statusLabel` ([AVATAR.md](AVATAR.md)). A person's element is kept across renders by their `id`, and repeated ids are allowed.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/utils/stable-keys.ts`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

### UIC-AVATAR-GROUP-11.2 - Maximum visible and overflow

`maxVisible` shall show at most that many people from the start of the list, all of them when it is missing. The `ui-avatar-group__overflow` element shall show `+N`, where `N` is the number of people past `maxVisible` plus the whole, non-negative `overflowCount` of people the caller already left out. It is absent when `N` is zero. With no visible person and no overflow the strip renders nothing.

Implementation: `src/components/avatar-group/avatar-group.tsx`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

### UIC-AVATAR-GROUP-11.3 - Accessible names

The `avatars` strip shall be a `role="group"` named by the trimmed `aria-label`, otherwise by the names of every person in `people` and in `hiddenNames`, joined by commas. Its overflow shall be a `role="img"` named by the provider's `morePeople` string from the count and the names it hides: the people past `maxVisible`, then `hiddenNames` (`3 more people: Jon Berg, Lena Ortiz, Sam Okafor`). Blank names read as the provider's `unnamed` string.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/core/strings.ts`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

### UIC-AVATAR-GROUP-11.4 - Pressing a person

With `onAction`, each person shall be a pressable presence avatar that calls `onAction` with the person's `id` once per click, Enter or Space. Without it each person is a named image and the strip has no tab stop, unless name tooltips or an overflow menu add one.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

### UIC-AVATAR-GROUP-11.5 - Person cards

With `renderCard`, each visible person for whom it returns content shall be a presence avatar whose `card` is that content, usually a `UserCard`, so pressing the person opens it ([AVATAR.md](AVATAR.md)); `onAction` is still called. A person for whom it returns nothing opens no card.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

### UIC-AVATAR-GROUP-11.6 - Overflow menu

`overflow` shall publish `data-overflow`: `count` (the default) keeps the `+N` count an image, and `menu` makes it, while it hides people from `people`, a React Aria menu button (still `ui-avatar-group__overflow`, named by the same `morePeople` text) that opens a `Menu` ([MENU.md](MENU.md)) in the `ui-avatar-group__menu` slot, named by the count alone. The menu lists the people past `maxVisible` in order, each as a `MenuItem` showing a small `UserIdentity` row with their avatar fields, `status` and `statusLabel` ([USER-IDENTITY.md](USER-IDENTITY.md)), so it is named by their name and then their status label. Arrow keys and typing a name move through it; choosing a person closes the menu, returns focus to the count and calls `onAction` with their `id`. People counted only by `overflowCount` stay in the count's name. A `dots` strip keeps its plain count.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/components/avatar-group/avatar-group-overflow-menu.tsx`, `labs/reference/avatar-group.css`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

### UIC-AVATAR-GROUP-11.7 - Name tooltips and hover cards

`nameTooltip` and `cardTrigger` shall reach every visible person's presence avatar, so each shows its name in a tooltip ([UIC-AVATAR-11.7](AVATAR.md#uic-avatar-27---name-tooltip)) and opens the card `renderCard` returns on hover and focus ([UIC-AVATAR-11.8](AVATAR.md#uic-avatar-28---card-on-hover)).

Implementation: `src/components/avatar-group/avatar-group.tsx`, `src/components/avatar/avatar.tsx`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

## UIC-AVATAR-GROUP-12 - Presentation

### UIC-AVATAR-GROUP-12.1 - Presence layouts

`layout="strip"` shall show spaced avatars; `layout="dots"` shows decorative colour dots and an overflow count, hidden from assistive technology for use inside another named control. The default layout is an overlapping stack.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `labs/reference/avatar-group.css`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

### UIC-AVATAR-GROUP-12.2 - Sizes

`size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size` on the root and size every presence avatar. `colorCount` reaches every avatar and dot.

Implementation: `src/components/avatar-group/avatar-group.tsx`, `labs/reference/avatar-group.css`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`, `e2e/avatar-group-presence.spec.ts`

### UIC-AVATAR-GROUP-12.3 - Hooks and caller attributes

`AvatarGroup` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/avatar-group/avatar-group.tsx`
Verification: `src/components/avatar-group/avatar-group-presence.test.tsx`

## UIC-AVATAR-GROUP-3 - Unified options

### UIC-AVATAR-GROUP-3.1 - Layouts

layout shall select stack (default), strip or decorative dots. All layouts share people, windowing and overflow; avatar layouts support optional status, cards and person commands. Outlined avatars in groups shall have an opaque theme-matched background.

Implementation: `src/components/avatar-group/avatar-group.tsx`
Verification: `src/components/avatar-group/avatar-group.test.tsx`, `e2e/unified-options.spec.ts`

## Hooks

| Hook                        | Kind      | Values                 | Description                                                 |
| --------------------------- | --------- | ---------------------- | ----------------------------------------------------------- |
| `ui-avatar-group`           | root      |                        | The group (`<span>`).                                       |
| `ui-avatar-group__avatar`   | slot      |                        | Each visible person's avatar (also `ui-avatar`).            |
| `ui-avatar-group__overflow` | slot      |                        | The `+N` count.                                             |
| `ui-avatar-group__trigger`  | slot      |                        | The `<button>` around the stack with `action="list"`.       |
| `ui-avatar-group__popover`  | slot      |                        | The popover listing everyone (also `ui-popover`).           |
| `ui-avatar-group__list`     | slot      |                        | The `<ul>` of everyone.                                     |
| `ui-avatar-group__item`     | slot      |                        | Each person's `<li>`.                                       |
| `data-size`                 | attribute | `xs`, `sm`, `md`, `lg` | Avatar size.                                                |
| `data-action`               | attribute | `none`, `list`         | What pressing the group does.                               |
| `data-hovered`              | state     | `true`                 | Pointer over the trigger (React Aria).                      |
| `data-pressed`              | state     | `true`                 | The trigger is pressed or its popover is open (React Aria). |
| `data-focused`              | state     | `true`                 | The trigger has focus (React Aria).                         |
| `data-focus-visible`        | state     | `true`                 | The trigger has keyboard focus (React Aria).                |

| `ui-avatar-group__dot` | slot | | Each visible person's dot (`dots` variant). |
| `ui-avatar-group__menu` | slot | | The menu of hidden people (also `ui-menu`). |
| `data-overflow` | attribute | `count`, `menu` | What the `+N` count does. |
| `data-color` | attribute | | A dot's colour slot, as on the avatar ([AVATAR.md](AVATAR.md)). |
| `data-layout` | attribute | `stack`, `strip`, `dots` | Overlapping, spaced or decorative-dot layout. |
