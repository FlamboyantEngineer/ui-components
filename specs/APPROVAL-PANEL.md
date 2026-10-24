# Approval Panel

`ApprovalPanel` shows who must decide on something and where each decision stands: a heading with the outcome, the approvals given against those needed over a [Segmented Bar](SEGMENTED-BAR.md) of every decision, one row per approver (a person or a group) with their decision, when they decided and what they said, Remind and Request again actions, and an action area for the reader's own decision, usually a [Decision Control](DECISION-CONTROL.md). It draws the decisions it is given; the caller records them.

## UIC-APPROVAL-PANEL-1 - Contract

### UIC-APPROVAL-PANEL-1.1 - Named section

`ApprovalPanel` shall render a `ui-approval-panel` `<section>` named by its heading (`ui-approval-panel__title`), which reads `title`, else the provider's `approvals` string, at one level below the enclosing section's, else 3. The heading sits in `ui-approval-panel__header` with a `status` `Badge` of the outcome (`ui-approval-panel__outcome`), its tone following the outcome and its label the provider's `approvalDecision` string for it.

Implementation: `src/components/approval-panel/approval-panel.tsx`, `src/core/content-strings.ts`
Verification: `src/components/approval-panel/approval-panel.test.tsx`, `e2e/approval-panel.spec.ts`

### UIC-APPROVAL-PANEL-1.2 - Outcome

The panel shall publish `data-outcome`: `rejected` when any approver rejected, else `approved` once the approvers who approved reach `requiredCount`, else `pending`. `requiredCount` is a whole number from 1 and defaults to the number of approvers, or 1 without approvers, so a panel nobody has approved yet is `pending`.

Implementation: `src/components/approval-panel/approval-panel.tsx`
Verification: `src/components/approval-panel/approval-panel.test.tsx`, `e2e/approval-panel.spec.ts`

### UIC-APPROVAL-PANEL-1.3 - Progress

Under the header, a small `SegmentedBar` (`ui-approval-panel__progress`) shall be labelled by the provider's `approvalProgress` string (`2 of 3 approvals`), approvals past the count needed reading as the count needed, and draw one segment per decision with its count: approved (`success`), rejected (`danger`), abstained (`info`) and pending (`neutral`), named by the provider's `approvalDecision` strings, without a total.

Implementation: `src/components/approval-panel/approval-panel.tsx`, `src/core/content-strings.ts`
Verification: `src/components/approval-panel/approval-panel.test.tsx`, `e2e/approval-panel.spec.ts`

### UIC-APPROVAL-PANEL-1.4 - Approvers

The approvers shall render in order in a `ui-approval-panel__approvers` list named by the provider's `approvers` string, each a `ui-approval-panel__approver` item publishing `data-decision` with: a small `UserIdentity` (`ui-approval-panel__identity`) of `person`, a group drawing the group avatar; a `Badge` of the decision (`ui-approval-panel__decision`) with its tone (approved `success`, rejected `danger`, abstained `info`, pending `neutral`), glyph (`check`, `close`, `minus`, `clock`) and the provider's `approvalDecision` label; a `RelativeTime` of `time` read against `getNow` (`ui-approval-panel__time`) when there is one; and the `comment` in `ui-approval-panel__comment` when there is one.

Numeric and text IDs, such as `1` and `'1'`, identify distinct entries; removing one preserves the other entry's rendered identity.

Implementation: `src/components/approval-panel/approval-panel.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/approval-panel/approval-panel.test.tsx`, `e2e/approval-panel.spec.ts`

### UIC-APPROVAL-PANEL-1.5 - The reader's row

The approver whose `id` is `currentApproverId` shall publish `data-current` and show the provider's `you` string after their name and a space (`ui-approval-panel__you`).

Implementation: `src/components/approval-panel/approval-panel.tsx`
Verification: `src/components/approval-panel/approval-panel.test.tsx`, `e2e/approval-panel.spec.ts`

### UIC-APPROVAL-PANEL-1.6 - Remind and request again

With `onRemind`, each pending approver's row shall end with a `bell` `IconButton` (`ui-approval-panel__remind`) named and hinted by the provider's `remindApprover` string for their name, which calls `onRemind(id)`. With `onRequestAgain`, each approver who decided gets a `refresh` `IconButton` (`ui-approval-panel__request-again`) named by `requestApprovalAgain`, which calls `onRequestAgain(id)`.

Implementation: `src/components/approval-panel/approval-panel.tsx`, `src/core/content-strings.ts`
Verification: `src/components/approval-panel/approval-panel.test.tsx`, `e2e/approval-panel.spec.ts`

### UIC-APPROVAL-PANEL-1.7 - Action area

`children`, the reader's own decision, shall render after the approvers in `ui-approval-panel__actions`; without children there is no action area.

Implementation: `src/components/approval-panel/approval-panel.tsx`
Verification: `src/components/approval-panel/approval-panel.test.tsx`, `e2e/approval-panel.spec.ts`

### UIC-APPROVAL-PANEL-1.8 - Hooks and caller attributes

`ApprovalPanel` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/approval-panel/approval-panel.tsx`
Verification: `src/components/approval-panel/approval-panel.test.tsx`

## UIC-APPROVAL-PANEL-2 - Accessibility

### UIC-APPROVAL-PANEL-2.1 - Readable decisions

Every decision shall be read as text (its badge label), never by tone or glyph alone, and the outcome badge is a polite live region, so a change of outcome is announced. The panel's only tab stops are its action buttons, the decision times' tooltips and the action area's controls.

Implementation: `src/components/approval-panel/approval-panel.tsx`
Verification: `src/components/approval-panel/approval-panel.test.tsx`, `e2e/approval-panel.spec.ts`

## Hooks

| Hook                               | Kind  | Values                                         | Description                                               |
| ---------------------------------- | ----- | ---------------------------------------------- | --------------------------------------------------------- |
| `ui-approval-panel`                | root  |                                                | The panel (`<section>`).                                  |
| `ui-approval-panel__header`        | slot  |                                                | The heading and the outcome.                              |
| `ui-approval-panel__title`         | slot  |                                                | The heading.                                              |
| `ui-approval-panel__outcome`       | slot  |                                                | The outcome (also `ui-badge`).                            |
| `ui-approval-panel__progress`      | slot  |                                                | Approvals against those needed (also `ui-segmented-bar`). |
| `ui-approval-panel__approvers`     | slot  |                                                | The list of approvers (`<ul>`).                           |
| `ui-approval-panel__approver`      | slot  |                                                | One approver (`<li>`).                                    |
| `ui-approval-panel__identity`      | slot  |                                                | Who decides (also `ui-user-identity`).                    |
| `ui-approval-panel__you`           | slot  |                                                | Marks the reader's own row.                               |
| `ui-approval-panel__decision`      | slot  |                                                | The decision (also `ui-badge`).                           |
| `ui-approval-panel__time`          | slot  |                                                | When they decided (also `ui-relative-time`).              |
| `ui-approval-panel__comment`       | slot  |                                                | What they said.                                           |
| `ui-approval-panel__remind`        | slot  |                                                | Remind a pending approver (also `ui-icon-button`).        |
| `ui-approval-panel__request-again` | slot  |                                                | Ask an approver again (also `ui-icon-button`).            |
| `ui-approval-panel__actions`       | slot  |                                                | The reader's own decision.                                |
| `data-outcome`                     | state | `pending`, `approved`, `rejected`              | Where the whole approval stands (on the root).            |
| `data-decision`                    | state | `pending`, `approved`, `rejected`, `abstained` | An approver's decision (on an approver).                  |
| `data-current`                     | state | `true`                                         | The reader's own row (on an approver).                    |
