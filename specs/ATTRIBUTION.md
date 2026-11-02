# Attribution

`Attribution` says who did something and when in one sentence, such as `Edited 5 minutes ago by Maria Santos`: literal text from a template, a live [Relative Time](RELATIVE-TIME.md) and the person's name, which can open their [User Card](USER-CARD.md). History rows, state timelines, change lists, activity feeds, comments and notifications use it, so every "who did it and when" reads one way.

## UIC-ATTRIBUTION-1 - Contract

### UIC-ATTRIBUTION-1.1 - Template

`Attribution` shall render a `ui-attribution` `<span>` holding `template` with its `{time}` token replaced by the time and its `{person}` token by the person, in order, and every other character kept as literal text (other braces included). Without `template` it uses the provider's `attribution` string (`{time} by {person}`) when there is a `person`, and `{time}` alone when there is not. `parseAttributionTemplate` splits a template into these parts.

Implementation: `src/components/attribution/attribution.tsx`, `src/components/attribution/attribution-template.ts`, `src/core/strings/content.ts`
Verification: `src/components/attribution/attribution.test.tsx`, `src/components/attribution/attribution-template.test.ts`, `e2e/attribution.spec.ts`

### UIC-ATTRIBUTION-1.2 - Time

The time shall be a `RelativeTime` in the `ui-attribution__time` slot, reading `time` against `getNow` with `fallbackAfterDays` in `timeZone` ([UIC-RELATIVE-TIME-1.2](RELATIVE-TIME.md#uic-relative-time-12---relative-words)), live and with its absolute-date tooltip unless `showTooltip` is `false` (where a surrounding control already holds the time). It is capitalized only when it starts the sentence (`Yesterday by Maria Santos`, but `Edited yesterday by Maria Santos`). A missing or unreadable `time` reads as the provider's `unknownTime` string.

Implementation: `src/components/attribution/attribution.tsx`, `src/components/attribution/attribution-template.ts`
Verification: `src/components/attribution/attribution.test.tsx`, `src/components/attribution/attribution-template.test.ts`, `e2e/attribution.spec.ts`

### UIC-ATTRIBUTION-1.3 - Person

The person shall render in the `ui-attribution__person` slot with the trimmed `person.name` in the `ui-attribution__name` slot, or the provider's `unnamed` string when the name is blank or there is no person. With `showAvatar`, a decorative extra-small `Avatar` (`ui-attribution__avatar`) built from the person's identity comes before the name. The reference stylesheet centres the avatar on the name and lets the name alone set the person's baseline in the sentence, for pictures and initials, with or without a card.

Implementation: `src/components/attribution/attribution.tsx`, `labs/reference/attribution.css`
Verification: `src/components/attribution/attribution.test.tsx`, `e2e/attribution.spec.ts`

### UIC-ATTRIBUTION-1.4 - Person card

With `card`, the person slot shall be a `UserCardTrigger` ([USER-CARD-TRIGGER.md](USER-CARD-TRIGGER.md)), also carrying `ui-user-card-trigger`: a button named by the person's name that opens the card on press, or with `cardTrigger="hover"` on hover and keyboard focus. The reference card trigger shall align its name on the surrounding sentence baseline, without extra button padding.

Implementation: `src/components/attribution/attribution.tsx`, `src/components/user-card/user-card.tsx`
Verification: `src/components/attribution/attribution.test.tsx`, `e2e/attribution.spec.ts`, `e2e/lab-layout-regressions.spec.ts`

### UIC-ATTRIBUTION-1.5 - Hooks and caller attributes

`Attribution` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its `<span>` root.

Implementation: `src/components/attribution/attribution.tsx`
Verification: `src/components/attribution/attribution.test.tsx`

### UIC-ATTRIBUTION-1.6 - Accessibility

`Attribution` shall add no role or accessible name: the sentence is read as text. Its only tab stops are those of its parts, the time's tooltip and the person's card trigger.

Implementation: `src/components/attribution/attribution.tsx`
Verification: `src/components/attribution/attribution.test.tsx`, `e2e/attribution.spec.ts`

## Hooks

| Hook                     | Kind | Values | Description                                               |
| ------------------------ | ---- | ------ | --------------------------------------------------------- |
| `ui-attribution`         | root |        | The sentence (`<span>`).                                  |
| `ui-attribution__time`   | slot |        | The time (also `ui-relative-time`).                       |
| `ui-attribution__person` | slot |        | The person: a `<span>`, or the card trigger button.       |
| `ui-attribution__avatar` | slot |        | The decorative avatar before the name (also `ui-avatar`). |
| `ui-attribution__name`   | slot |        | The person's name.                                        |
