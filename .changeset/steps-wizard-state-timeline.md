---
'@flamboyantengineer/ui-components': minor
---

Add `Steps`, `Wizard` and `StateTimeline`.

- `Steps` (new): an ordered list of a task's steps with `currentId`, per-step `status` (`complete`, `current`, `upcoming`, `error`, `skipped`), `description`, `isOptional` and `isDisabled`, `orientation`, a `compact` variant, and `onAction` to return to settled steps. Hooks: `ui-steps` with `__item`, `__step`, `__marker`, `__text`, `__label`, `__optional`, `__description`, `__connector`, `data-orientation`, `data-variant`, `data-status`, `data-current`.
- `Wizard` (new): a multi-step frame on `Steps` and `Form`: one panel per step, Back, Skip (optional steps), Next and Finish, per-step `validate` (asynchronous allowed) after the fields pass, `currentId`/`defaultCurrentId`/`onCurrentIdChange`, `onFinish`, `onCancel`, `finishLabel`, `orientation` and `headingLevel`; focus moves to each new step's heading, and it works as the body of a `Modal`. Hooks: `ui-wizard` with `__steps`, `__form`, `__panel`, `__heading`, `__error`, `__footer`, `__action`, `data-orientation`, `data-action`, `data-pending`.
- `StateTimeline` (new): a vertical history of state changes with toned state badges, who and when through `Attribution`, comments, the current state marked, `upcoming` states and `direction`. Hooks: `ui-state-timeline` with `__entry`, `__marker`, `__body`, `__header`, `__state`, `__current`, `__attribution`, `__comment`, `data-direction`, `data-status`.
- Provider strings: `back`, `finish`, `skip`, `optional`, `steps`, `stepStatus`, `stateHistory`, `currentState` and `upcomingState`.
