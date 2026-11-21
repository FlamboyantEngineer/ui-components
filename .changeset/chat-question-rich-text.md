---
'@flamboyantengineer/ui-components': minor
---

`ChatQuestion` reads a question's `question` and an option's `description` as Markdown: bold, italic, code, links, lists and the rest, with raw HTML kept as text. The opening paragraph is the question's title and names the card, the choices and a free-text field by its words; the blocks after it render in the new `ui-chat-question__body` slot, which describes the question. `QuestionnaireDescription` now renders a `<div>`, so it can hold paragraphs and lists.
