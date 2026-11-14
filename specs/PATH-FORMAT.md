# Path Format

Pure display helpers format location text and resolve a folder's known ancestry. They do not render controls or fetch missing folders.

## UIC-PATH-FORMAT-1 - Display text

### UIC-PATH-FORMAT-1.1 - Labels and separator

`PATH_SEPARATOR` shall be `/`. `formatPath` shall trim labels, omit blank labels and join the remaining labels with one separator. A string input is split on `/`; array entries remain whole, including embedded slashes. Input arrays are unchanged and text is returned literally without interpreting markup.

Implementation: `src/utils/path.ts`
Verification: `src/utils/path.test.ts`

### UIC-PATH-FORMAT-1.2 - Root and empty values

With `rooted`, a nonempty formatted path shall begin with `/`. A path without labels, including null or undefined, shall return `emptyLabel` when supplied, otherwise `/` when rooted and an empty string when not rooted.

Implementation: `src/utils/path.ts`
Verification: `src/utils/path.test.ts`

### UIC-PATH-FORMAT-1.3 - Folder ancestry

`formatFolderPath` shall resolve a trimmed folder id against the supplied flat catalog and return a rooted path from its known ancestry. It shall preserve the known portion when an ancestor is missing, stop before repeating a folder in a cycle, and use a folder's id when its name is blank. An absent, blank or unknown id shall return `rootLabel`, which defaults to `/`.

Implementation: `src/utils/path.ts`
Verification: `src/utils/path.test.ts`

### UIC-PATH-FORMAT-1.4 - Resolved paths and fallback text

A selected folder with a nonblank resolved `path` shall use that path, normalized through rooted `formatPath`, instead of walking its parents. A blank resolved path shall fall back to ancestry. A caller-supplied `rootLabel` shall be used for absent or unknown folders.

Implementation: `src/utils/path.ts`
Verification: `src/utils/path.test.ts`
