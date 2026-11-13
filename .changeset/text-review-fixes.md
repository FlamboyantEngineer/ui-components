---
'@flamboyantengineer/ui-components': minor
---

Text component fixes from the second library review.

- `Markdown` takes `images`: `show` (the default) loads images as before, and `link` loads none, drawing each as a link to its source named by its text, for content from an untrusted writer.
- `getMergeViewResult` reads a merge's result without rendering, so a merge with nothing to resolve can be accepted at once. `MergeView` keeps the line breaks of `ours` (`\r\n` stays `\r\n`).
- Line, word and sequence diffs bound each search to a thousand steps and build no closure or result per diagonal, so small texts that differ throughout no longer take seconds and large texts with hundreds of scattered changes stay exact. `TextDiff` shares one word-diff budget across a comparison.
- `CodeEditor` watches its gutter rather than each line for diagnostic marks, keeps its gutter, tokenizer and diagnostics across renders that do not change them, and finds a completion query by walking back over the word only.
- Buttons that leave or disable themselves when pressed hand focus on: `CommentComposer` Cancel to the text box, `SearchPane` page turns to the first result, `FindBar` replace buttons to the query, and `FormulaBar` Confirm and Cancel to the editor. A highlighted comment behind "show more" no longer pulls focus, and one that loads later is scrolled to.
- `SearchPane` scrolls the current result into view when the list mounts or the page turns.
- A terminal `CodeBlock` copies a command's continuation lines with it.
- `MessageComposer` pastes text that comes with a picture as text, and its insertions respect `maxLength`.
- `TextMatch` matches Hangul written as conjoining jamo against composed syllables.
- `RichTextEditor` names each task checkbox by its task, turns `www.example.org` into an `https` link, measures its selection toolbar only while it may show, and reads block starts once per document.
