---
'@flamboyantengineer/ui-components': minor
---

Widget and foundation fixes from the second review:

- `StateMachineView` takes the initial state as `initialKey` (was `initialState`), beside `currentKey` and `selectedKey`.
- `ActionRow` takes `finalFocus`, where focus goes when its selection bar leaves while holding focus.
- `InlineError` and `Banner` make only their message a live region: the retry button, actions and dismiss sit beside it, so they are never announced with the message. A banner's `aria-label` names that region.
- `FolderManager`'s `onDelete` may resolve to `false` when the folder was not deleted: the selection stays and the row keeps focus. F2 with no single folder to rename leaves the filter, and toggling a row while filtering keeps hidden branches collapsed.
- `ReactionBar`, `ConstraintEditor`'s Unset and `StepListEditor` moves keep focus and announce what changed; a step's drag handle is described by React Aria's drag instructions.
- `Timeline` expands groups that arrive after mounting; `Tree` selects children that load under a selected branch.
- `CharacterGrid` search matches a name that reads like a code point; `ConstraintEditor` checks each set once.
- `createSafeStorage` returns the same adapter for the same storage, and the README defines provider services outside the render.
- `formatMessage` reads a missing plural or number argument as 0, so `=0` branches apply.
- Scroll geometry treats a box within a pixel of its layout size as unscaled; synced scrolling observes a frame's containers with the frame's own observers; collection selections are encoded once per selection.
- `react-aria`, `react-stately` and `react-aria-components` are pinned to exact versions that agree.
