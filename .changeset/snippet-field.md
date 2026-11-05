---
'@flamboyantengineer/ui-components': minor
---

Add `SnippetField`, a field holding a code snippet taken from a source and an optional line range. The reader previews what the host's `loadSnippet` adapter finds (aborted when replaced, cancelled or unmounted, so late answers never show), and saves it explicitly with Apply. Failed previews keep the saved code; previewing the saved range shows whether the source changed, and Update replaces it only on request. Adds the `snippet*` strings in every language file.
