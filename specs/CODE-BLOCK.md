# Code Block

`CodeBlock` shows a block of code to read and reuse, such as a snippet in an answer or a command to run: a header with the block's title or language, a [Copy Button](COPY-BUTTON.md) and an optional Apply action, over the preformatted code, which scrolls sideways rather than wrapping. Highlighting follows [Code Editor](CODE-EDITOR.md)'s contract: the caller's `tokenize` splits the code into typed tokens. A `terminal` block shows commands after a prompt and their output. `createCodeBlockOverride` draws the code blocks of a [Markdown](MARKDOWN.md) document through it ([UIC-MARKDOWN-2.8](MARKDOWN.md#uic-markdown-28---node-overrides)).

## UIC-CODE-BLOCK-1 - Block

### UIC-CODE-BLOCK-1.1 - Header and group

`CodeBlock` shall render a `ui-code-block` root, a `role="group"` named by its header's title (`ui-code-block__title` in `ui-code-block__header`): `title`, or else `language`, or else the provider's `codeBlockTitle` string for the variant (`Code`, `Terminal`). The root publishes `variant` (`code` by default) in `data-variant` and `language` in `data-language`.

Implementation: `src/components/code-block/code-block.tsx`, `src/core/code-strings.ts`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-1.2 - Code

The code shall render exactly as given, whitespace included, in a `<pre>` (`ui-code-block__code`) around a `<code>`, its text through [Text Match](TEXT-MATCH.md) so a `TextMatchProvider` above marks its query. Long lines do not wrap: the `<pre>` scrolls sideways.

Implementation: `src/components/code-block/code-block.tsx`, `src/components/code-block/code-block-content.tsx`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-1.3 - Keyboard scrolling

While the code is wider than its `<pre>` (measured after each render, whenever the `<pre>` resizes, whenever its content changes in the document, such as tokens highlighted asynchronously or their classes and styles, and whenever the document's fonts finish loading), the `<pre>` shall publish `data-overflowing` and join the tab order, so a keyboard reader can reach it and scroll it with the arrow keys, and drop both as soon as it fits again; the block's group names its context. It takes no landmark role, so a transcript of many blocks adds no landmarks. Code that fits adds no tab stop.

Implementation: `src/components/code-block/code-block.tsx`, `src/components/code-block/use-horizontal-overflow.ts`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-1.4 - Highlighting

With `tokenize`, a `code` block shall split its code into tokens that cover it exactly, in order ([UIC-CODE-EDITOR-1.2](CODE-EDITOR.md#uic-code-editor-12---tokens)); each token with a `type` renders in a `ui-code-block__token` span carrying `data-token` with that type, and tokens without one render as plain text. Without `tokenize` the code is one plain run.

Implementation: `src/components/code-block/code-block-content.tsx`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

## UIC-CODE-BLOCK-2 - Actions

### UIC-CODE-BLOCK-2.1 - Copy

The header's `ui-code-block__actions` shall hold a [Copy Button](COPY-BUTTON.md) (`ui-code-block__copy`) that copies the block's value: the code exactly as given, or for a `terminal` block with command lines, its commands without their prompts, one per line. It is named by the provider's `codeBlockCopy` string (`Copy code`), or in a terminal block by `codeBlockCopyCommands` with the number of commands, or `codeBlockCopyOutput` when it holds only output. It announces the copy as Copy Button does.

Implementation: `src/components/code-block/code-block.tsx`, `src/core/code-strings.ts`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-2.2 - Apply

With `onApply`, the actions shall start with a small ghost [Button](BUTTON.md) (`ui-code-block__apply`) named by `applyLabel` or else the provider's `codeBlockApply` string (`Apply`); pressing it calls `onApply` with the block's value. Without `onApply` there is no Apply action.

Implementation: `src/components/code-block/code-block.tsx`, `src/core/code-strings.ts`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

## UIC-CODE-BLOCK-3 - Terminal

### UIC-CODE-BLOCK-3.1 - Commands and output

A `terminal` block shall render each line of its code in a `ui-code-block__line` span, joined by line breaks. A line that is the `prompt` (`$` by default), or starts with it and a space, is a command: it publishes `data-kind="command"` and shows the prompt and a space in a `ui-code-block__prompt` span hidden from assistive technology, followed by the command. Every other line is output (`data-kind="output"`), shown as written. `tokenize` does not apply to a terminal block.

Implementation: `src/components/code-block/code-block-content.tsx`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block-content.test.ts`, `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

## UIC-CODE-BLOCK-4 - Markdown

### UIC-CODE-BLOCK-4.1 - Code block override

`createCodeBlockOverride(options)` shall return a `renderNode` for [Markdown](MARKDOWN.md) that draws every code block node, fenced or indented, as a `CodeBlock` of its text headed by its fence language, and leaves every other node to the default rendering. A `console`, `terminal` or `shell-session` fence is a `terminal` block. `tokenizers` maps fence languages to `tokenize` functions, read from its own entries only: a fence language the map does not register, even one an ordinary object inherits (`constructor`, `toString`, `__proto__`), draws plain code, while an entry the map does register under such a name highlights; `onApply` shows Apply on every block and receives the block's value and its fence language (`null` without one); `applyLabel` names it. A streaming `Markdown` shows an unclosed fence through it as a growing block.

Implementation: `src/components/code-block/markdown-code-block.tsx`
Verification: `src/components/code-block/markdown-code-block.test.tsx`, `src/components/code-block/markdown-code-languages.test.tsx`, `e2e/code-block.spec.ts`

## UIC-CODE-BLOCK-5 - Integration

### UIC-CODE-BLOCK-5.1 - Hooks and caller attributes

`CodeBlock` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes and `id` to its root, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/code-block/code-block.tsx`
Verification: `src/components/code-block/code-block.test.tsx`

## Hooks

| Hook                     | Kind      | Values              | Description                                                |
| ------------------------ | --------- | ------------------- | ---------------------------------------------------------- |
| `ui-code-block`          | root      |                     | The group around the header and the code.                  |
| `ui-code-block__header`  | slot      |                     | The row of the title and the actions.                      |
| `ui-code-block__title`   | slot      |                     | The title, language or default name that names the block.  |
| `ui-code-block__actions` | slot      |                     | Holds the Apply action and the Copy button.                |
| `ui-code-block__apply`   | slot      |                     | The Apply button (also `ui-button`).                       |
| `ui-code-block__copy`    | slot      |                     | The Copy button (also `ui-copy-button`).                   |
| `ui-code-block__code`    | slot      |                     | The `<pre>` holding the code; scrolls sideways.            |
| `ui-code-block__token`   | slot      |                     | A typed token of highlighted code.                         |
| `ui-code-block__line`    | slot      |                     | A line of a terminal block.                                |
| `ui-code-block__prompt`  | slot      |                     | A command line's prompt, hidden from assistive technology. |
| `data-variant`           | attribute | `code`, `terminal`  | The kind of block.                                         |
| `data-language`          | attribute |                     | The block's language.                                      |
| `data-token`             | attribute |                     | On a token: its type, from the caller's tokenizer.         |
| `data-kind`              | state     | `command`, `output` | On a terminal line: a command after the prompt, or output. |
| `data-overflowing`       | state     | `true`              | On the code: it is wider than its box and focusable.       |
