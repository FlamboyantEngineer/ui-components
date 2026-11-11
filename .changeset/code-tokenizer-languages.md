---
'@flamboyantengineer/ui-components': minor
---

`CodeEditor` and `resolveCodeTokenizer` add C (`c`), C++ (`cpp`), YAML, XML and shell (`shell`) presets. The spec now documents `resolveCodeTokenizer` and `CodeToken` as a stable public API for hosts that highlight code elsewhere, the token kinds the presets emit, and `syntax` as the extension point for other languages.
