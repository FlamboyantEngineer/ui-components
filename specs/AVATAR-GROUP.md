# Avatar Group

`AvatarGroup` stacks the avatars of a set of people, such as the assignees or reviewers of an item, overlapping one another, with a `+N` count for the ones past a maximum. It is not presence: it draws who is involved, not who is here now ([Presence Strip](PRESENCE-STRIP.md) does that). Assistive technology hears everyone's names; a pressable group lists everyone in a popover.

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
