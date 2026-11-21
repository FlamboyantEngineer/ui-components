# Questionnaire

`Questionnaire` asks the reader a few questions in a form, after shadcn/ui's questionnaire parts: each question is a group of choices or a field for the reader's own words, shown all at once or one at a time, with actions that move between them, pass over optional ones and submit the answers. The answers live in the form's own controls and submit under each question's name. It suits a short survey, or a card in which an agent asks the reader questions (see [Chat](CHAT.md)).

## UIC-QUESTIONNAIRE-1 - Questions

### UIC-QUESTIONNAIRE-1.1 - Form and questions

`Questionnaire` shall render a `ui-questionnaire` `<form>` that the browser does not validate (`noValidate`), forwarding its native attributes, so a caller names it with `aria-label`. `QuestionnaireItem` shall render a `ui-questionnaire__item` `<fieldset>` carrying the question's `name`, named by its `QuestionnaireTitle` (a `ui-questionnaire__title` `<legend>`) and described by its `QuestionnaireDescription` (a `ui-questionnaire__description` `<div>`, which may hold paragraphs and lists) while one renders. It publishes `data-status`: `answered` once one of its controls holds a non-empty value, `skipped` once the reader passed over it with Skip and while it has no answer, else `unanswered`; `data-required` with `isRequired`; and `data-disabled` with `isDisabled`, which disables its fieldset and every control in it. Without `items` every question shows, and the form does not publish `data-stepping`.

Implementation: `src/components/questionnaire/questionnaire.tsx`, `src/components/questionnaire/use-questionnaire.ts`, `labs/reference/questionnaire.css`
Verification: `src/components/questionnaire/questionnaire.test.tsx`, `e2e/questionnaire.spec.ts`

### UIC-QUESTIONNAIRE-1.2 - Stepping and progress

With `items`, the question names in order, the form shall publish `data-stepping` and show one question at a time: the current one, given by `currentKey` (controlled) or `defaultCurrentKey`, else the first of `items`, publishes `data-current`, and the others stay mounted but hidden, so their answers keep their state and still submit. Every step the actions take calls `onCurrentKeyChange` with the question it moves to, and then focuses that question's chosen radio, else its first enabled control, else the question itself. `QuestionnaireProgress` shall render, only while stepping, a `ui-questionnaire__progress` `progressbar` named by the provider's `questionSteps` string, from 1 to the number of questions, at the current one's position, whose value text and default content is the provider's `questionProgress` string (`Question 2 of 3`); its children replace the shown text.

Implementation: `src/components/questionnaire/questionnaire.tsx`, `src/components/questionnaire/use-questionnaire.ts`, `labs/reference/questionnaire.css`
Verification: `src/components/questionnaire/questionnaire.test.tsx`, `e2e/questionnaire.spec.ts`

### UIC-QUESTIONNAIRE-1.3 - Answers

`QuestionnaireChoices` shall render a `ui-questionnaire__choices` group of its question's options, named by the question's title, that submits under the question's name and publishes `selectionMode` as `data-selection-mode`: `single` (the default) as a `radiogroup` of one choice, `multiple` as a group of checkboxes. Its `value` (controlled) or `defaultValue` lists the chosen values, and `onChange` receives them after each pick. `QuestionnaireChoice` shall render a `ui-questionnaire__choice` around one [Choice](CHOICE-GROUP.md) with its `value`, label, `description` and `isDisabled`; it publishes `data-selected` while chosen. `QuestionnaireInput` shall render a `ui-questionnaire__input` `<input>` of `type` (`text` by default, or `email`, `number`, `tel`, `url`, `date`, `time`) with `placeholder`, `value` (controlled) or `defaultValue`, and `onChange` receiving the text after each edit; it submits under the question's name and is named by the question's title unless `aria-label` or `aria-labelledby` names it. Enter in it, without a modifier and outside an input method's composition, acts as Next, or submits from the last question.

Implementation: `src/components/questionnaire/questionnaire-answers.tsx`, `labs/reference/questionnaire.css`
Verification: `src/components/questionnaire/questionnaire.test.tsx`, `e2e/questionnaire.spec.ts`

### UIC-QUESTIONNAIRE-1.4 - Answers kept outside the form

With `answers` (controlled), the answers by question name, the questionnaire shall read which questions are answered from them instead of from its controls, for answers a caller keeps outside the form, such as drafts that outlive its controls: a question is answered while its list holds a non-empty value, and `onSubmit` receives those lists for the questions in the form. Without `answers` it reads the controls.

Implementation: `src/components/questionnaire/use-questionnaire.ts`, `src/components/questionnaire/questionnaire.tsx`
Verification: `src/components/questionnaire/questionnaire.test.tsx`

### UIC-QUESTIONNAIRE-1.5 - Read-only

With `isReadOnly` the form shall publish `data-read-only` and show its answers without letting the reader change them: the choices are read-only and an input is `readOnly`. The actions still step through the questions.

Implementation: `src/components/questionnaire/questionnaire.tsx`, `src/components/questionnaire/questionnaire-answers.tsx`
Verification: `src/components/questionnaire/questionnaire.test.tsx`

## UIC-QUESTIONNAIRE-2 - Actions

### UIC-QUESTIONNAIRE-2.1 - Previous, Skip and Next

`QuestionnaireActions` shall render a `ui-questionnaire__actions` row for the action buttons, each a [Button](BUTTON.md) labelled by its children or the provider's string, that renders only where it applies. `QuestionnairePrevious` (`ui-questionnaire__previous`, a secondary button, `previous`) steps back while stepping past the first question. `QuestionnaireSkip` (`ui-questionnaire__skip`, a ghost button, `skip`) shows while stepping before the last question when the current one is not required; it marks it `skipped` and steps on. `QuestionnaireNext` (`ui-questionnaire__next`, a primary button, `next`) steps on while stepping before the last question. Each action takes `isDisabled`, `isPending`, `tooltip` and `focusableWhenDisabled` for its button, so a caller can keep Next or Submit unavailable, with a hint saying why, until a question has an answer.

Implementation: `src/components/questionnaire/questionnaire-actions.tsx`, `labs/reference/questionnaire.css`
Verification: `src/components/questionnaire/questionnaire.test.tsx`, `e2e/questionnaire.spec.ts`

### UIC-QUESTIONNAIRE-2.2 - Required questions

Next shall not leave a required question without an answer: it marks it invalid (`data-invalid` on the item), keeps it shown and focuses its answer, unless focus is already in the question, which keeps it where it is. `QuestionnaireError` renders, only while its question is invalid, a `ui-questionnaire__error` `<p>` with its children or the provider's `questionAnswerToContinue` string, which then describes the question after its description, and an input in it publishes `aria-invalid`. The question stops being invalid as soon as it has an answer.

Implementation: `src/components/questionnaire/questionnaire.tsx`, `src/components/questionnaire/use-questionnaire.ts`, `labs/reference/questionnaire.css`
Verification: `src/components/questionnaire/questionnaire.test.tsx`, `e2e/questionnaire.spec.ts`

### UIC-QUESTIONNAIRE-2.3 - Submitting

`QuestionnaireSubmit` (`ui-questionnaire__submit`, a primary submit button, the provider's `questionSubmit` string) shall show on the last question while stepping, and always without `items`. Submitting the form shall, when every required question has an answer, call `onSubmit` with the answers: for every question, by name, the non-empty values its controls submit, in order, an empty list for one without. Otherwise it marks every required question without an answer invalid, steps to the first of them in document order and focuses its answer. A submission before the last question while stepping, such as the browser's implicit one, acts as Next.

Implementation: `src/components/questionnaire/use-questionnaire.ts`, `src/components/questionnaire/questionnaire-actions.tsx`
Verification: `src/components/questionnaire/questionnaire.test.tsx`, `e2e/questionnaire.spec.ts`

## Hooks

| Hook                            | Kind      | Values                              | Description                          |
| ------------------------------- | --------- | ----------------------------------- | ------------------------------------ |
| `ui-questionnaire`              | root      | `questionnaire`                     | The `<form>`.                        |
| `ui-questionnaire__progress`    | slot      | `questionnaire-progress`            | Where the reader is, while stepping. |
| `ui-questionnaire__item`        | slot      | `questionnaire-item`                | One question's `<fieldset>`.         |
| `ui-questionnaire__title`       | slot      | `questionnaire-title`               | The question, as its legend.         |
| `ui-questionnaire__description` | slot      | `questionnaire-description`         | More about the question.             |
| `ui-questionnaire__choices`     | slot      | `questionnaire-choices`             | The question's options.              |
| `ui-questionnaire__choice`      | slot      | `questionnaire-choice`              | One option around its Choice.        |
| `ui-questionnaire__input`       | slot      | `questionnaire-input`               | An answer in the reader's words.     |
| `ui-questionnaire__error`       | slot      | `questionnaire-error`               | Why the question cannot be left.     |
| `ui-questionnaire__actions`     | slot      | `questionnaire-actions`             | The row of actions.                  |
| `ui-questionnaire__previous`    | slot      | `questionnaire-previous`            | Back to the previous question.       |
| `ui-questionnaire__skip`        | slot      | `questionnaire-skip`                | Passes over an optional question.    |
| `ui-questionnaire__next`        | slot      | `questionnaire-next`                | On to the next question.             |
| `ui-questionnaire__submit`      | slot      | `questionnaire-submit`              | Submits the answers.                 |
| `data-stepping`                 | state     | `true`                              | Questions show one at a time.        |
| `data-read-only`                | state     | `true`                              | The answers cannot be changed.       |
| `data-status`                   | state     | `unanswered`, `answered`, `skipped` | A question's answer.                 |
| `data-current`                  | state     | `true`                              | The question shown while stepping.   |
| `data-required`                 | state     | `true`                              | The question needs an answer.        |
| `data-invalid`                  | state     | `true`                              | A step stopped at it unanswered.     |
| `data-disabled`                 | state     | `true`                              | The question is disabled.            |
| `data-selection-mode`           | attribute | `single`, `multiple`                | One choice or several.               |
| `data-orientation`              | state     | `vertical`                          | The options stack (React Aria).      |
| `data-selected`                 | state     | `true`                              | The option is chosen.                |
