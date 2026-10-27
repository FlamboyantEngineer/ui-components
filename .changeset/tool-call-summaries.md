---
'@flamboyantengineer/ui-components': minor
---

Groups of steps sum up what they did in one line, such as "Edited files, read files, ran a command", led by the glyph of their first kind of call:

- Tool calls take a `kind` (`read`, `edit`, `command`, `search`, `fetch` or `other`, the default), published as `data-kind`, and a `target` (`ui-chat-tool-call__target`) shown after the label. A call that succeeded shows its kind's glyph in place of the success glyph. The chat controller's `tool-call` event carries both.
- `ChatSteps` takes `actions` (`ChatStepsAction`: how many calls of each kind) in place of `stepCount`, and draws the first kind's glyph (`ui-chat-steps__glyph`). Its running label is "Working…", without a step count; without `actions` an ended run reads "Worked for 12 s".
- The provider string `chatStepsRunning` is now a plain string, and `chatStepsComplete` takes the actions and the seconds.
- `ChatParts` groups a run of steps only when it holds a tool call, so reasoning followed by text stays on its own. Text written between tool calls splits them into separate groups.
- New glyphs: `terminal`, `globe` and `wrench`.
