---
'@flamboyantengineer/ui-components': patch
---

Code highlighting no longer stalls on long lines. The HTML tag, XML attribute, CSS property and Markdown link rules match without heavy backtracking, the presets try their rules at word starts only, and a line longer than 5000 characters stays plain.
