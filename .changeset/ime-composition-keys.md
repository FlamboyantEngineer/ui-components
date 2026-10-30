---
'@flamboyantengineer/ui-components': patch
---

Table cell editors, Tree, Tabs and Folder Manager rename fields leave an Enter or Escape that an input method composition owns to the input method, including the Enter some browsers report with key code 229 as a composition ends, instead of committing or cancelling unfinished text. Inline Edit also recognizes that key code.
