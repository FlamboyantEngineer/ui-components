# Code Block

`CodeBlock` shows a block of code to read and reuse, such as a snippet in an answer or a command to run: a header with the block's title or language, a [Copy Button](COPY-BUTTON.md) and an optional Apply action, over the preformatted code, which scrolls sideways unless it wraps on request, with optional line numbers. Highlighting follows [Code Editor](CODE-EDITOR.md)'s contract: the caller's `tokenize` splits the code into typed tokens. A `terminal` block shows commands after a prompt and their output. `createCodeBlockOverride` draws the code blocks of a [Markdown](MARKDOWN.md) document through it ([UIC-MARKDOWN-2.8](MARKDOWN.md#uic-markdown-28---node-overrides)).

## UIC-CODE-BLOCK-1 - Block

### UIC-CODE-BLOCK-1.1 - Header and group

`CodeBlock` shall render a `ui-code-block` root, a `role="group"` named by its header's title (`ui-code-block__title` in `ui-code-block__header`): `title`, or else `language`, or else the provider's `codeBlockTitle` string for the variant (`Code`, `Terminal`). The root publishes `variant` (`code` by default) in `data-variant` and `language` in `data-language`.

Implementation: `src/components/code-block/code-block.tsx`, `src/core/strings/code.ts`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-1.2 - Code

The code shall render exactly as given, whitespace included, in a `<pre>` (`ui-code-block__code`) around a `<code>`, its text through [Text Match](TEXT-MATCH.md) so a `TextMatchProvider` above marks its query. Long lines do not wrap unless `wrap` asks ([UIC-CODE-BLOCK-1.6](#uic-code-block-16---wrapping)): the `<pre>` scrolls sideways, and scrolls down too when the host stylesheet bounds its height.

Implementation: `src/components/code-block/code-block.tsx`, `src/components/code-block/code-block-content.tsx`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-1.3 - Keyboard scrolling

While the code is wider or taller than its `<pre>`, so the `<pre>` scrolls (measured after each render, the first with the resize observer's first report where the window has one, so a page that mounts many blocks is laid out once for them all, whenever the `<pre>` resizes, whenever its content changes in the document, such as tokens highlighted asynchronously or their classes and styles, and whenever the document's fonts finish loading), the `<pre>` shall publish `data-overflowing` and join the tab order, so a keyboard reader can reach it and scroll it with the arrow keys, and drop both as soon as it fits again; the block's group names its context. It takes no landmark role, so a transcript of many blocks adds no landmarks. Code that fits adds no tab stop.

Implementation: `src/components/code-block/code-block.tsx`, `src/components/code-block/use-scroll-overflow.ts`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-1.4 - Highlighting

With `tokenize`, a `code` block shall split its code into tokens that cover it exactly, in order ([UIC-CODE-EDITOR-1.2](CODE-EDITOR.md#uic-code-editor-12---tokens)); each token with a `type` renders in a `ui-code-block__token` span carrying `data-token` with that type, and tokens without one render as plain text. Without `tokenize` the code is one plain run. [Code Editor](CODE-EDITOR.md#uic-code-editor-121---built-in-and-custom-syntax)'s `resolveCodeTokenizer` gives the editor's language presets, or a tokenizer for custom syntax rules, in this form.

Implementation: `src/components/code-block/code-block-content.tsx`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-1.5 - Line numbers

With `lineNumbers`, the `<pre>` shall publish `data-line-numbers` and render each line of the code, in either variant, in a `ui-code-block__line` span that holds the line's text and the line break after it, so a stylesheet can lay each line out as a block. Each line starts with an empty `ui-code-block__line-number` span, hidden from assistive technology, whose `data-line-number` carries the line's number from 1; the stylesheet draws it (such as with `content: attr(data-line-number)`), so the number never joins the code's text, a selection, a find or Copy. The empty line after a final line break gets no number. The `<pre>` publishes the digit count of the highest number as `--ui-code-block-line-number-digits`, from which the stylesheet sizes the gutter. Tokens that span a line break continue on the next line with their type, and the code's text stays exactly as given. The reference stylesheet keeps the numbers at the start while the code scrolls sideways, and level with their lines while it scrolls down or wraps. Without `lineNumbers` a `code` block renders its tokens as one run.

Implementation: `src/components/code-block/code-block.tsx`, `src/components/code-block/code-block-content.tsx`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block-content.test.ts`, `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-1.6 - Wrapping

`wrap` (`off` by default, or `soft`) shall publish `data-wrap` on the `<pre>`: `off` keeps each line on one row and scrolls sideways, and `soft` lets the stylesheet wrap long lines, which then neither overflow sideways nor add a tab stop for it. A wrapped numbered line keeps one number, on its first row.

Implementation: `src/components/code-block/code-block.tsx`, `labs/reference/code-block.css`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

## UIC-CODE-BLOCK-2 - Actions

### UIC-CODE-BLOCK-2.1 - Copy

The header's `ui-code-block__actions` shall hold a [Copy Button](COPY-BUTTON.md) (`ui-code-block__copy`) that copies the block's value: the code exactly as given, or for a `terminal` block with command lines, its commands without their prompts, one per line, with each command's continuation lines as written. It is named by the provider's `codeBlockCopy` string (`Copy code`), or in a terminal block by `codeBlockCopyCommands` with the number of commands, or `codeBlockCopyOutput` when it holds only output. It announces the copy as Copy Button does.

Implementation: `src/components/code-block/code-block.tsx`, `src/core/strings/code.ts`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

### UIC-CODE-BLOCK-2.2 - Apply

With `onApply`, the actions shall start with a small ghost [Button](BUTTON.md) (`ui-code-block__apply`) named by `applyLabel` or else the provider's `codeBlockApply` string (`Apply`); pressing it calls `onApply` with the block's value. Without `onApply` there is no Apply action.

Implementation: `src/components/code-block/code-block.tsx`, `src/core/strings/code.ts`
Verification: `src/components/code-block/code-block.test.tsx`, `e2e/code-block.spec.ts`

## UIC-CODE-BLOCK-3 - Terminal

### UIC-CODE-BLOCK-3.1 - Commands and output

A `terminal` block shall render each line of its code in a `ui-code-block__line` span, joined by line breaks. A line that is the `prompt` (`$` by default), or starts with it and a space, is a command: it publishes `data-kind="command"` and shows the prompt and a space in a `ui-code-block__prompt` span hidden from assistive technology, followed by the command. A line after a command line that ends in a line continuation (an odd number of backslashes) continues that command: it is a command line too, shown as written without a prompt, and counts as part of the command above it; here-documents and open quotes are not followed, so their lines read as output. Every other line is output (`data-kind="output"`), shown as written. `tokenize` does not apply to a terminal block.

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

| Hook                                 | Kind      | Values              | Description                                                              |
| ------------------------------------ | --------- | ------------------- | ------------------------------------------------------------------------ |
| `ui-code-block`                      | root      |                     | The group around the header and the code.                                |
| `ui-code-block__header`              | slot      |                     | The row of the title and the actions.                                    |
| `ui-code-block__title`               | slot      |                     | The title, language or default name that names the block.                |
| `ui-code-block__actions`             | slot      |                     | Holds the Apply action and the Copy button.                              |
| `ui-code-block__apply`               | slot      |                     | The Apply button (also `ui-button`).                                     |
| `ui-code-block__copy`                | slot      |                     | The Copy button (also `ui-copy-button`).                                 |
| `ui-code-block__code`                | slot      |                     | The `<pre>` holding the code; scrolls sideways.                          |
| `ui-code-block__token`               | slot      |                     | A typed token of highlighted code.                                       |
| `ui-code-block__line`                | slot      |                     | A line of a terminal block, or of numbered code.                         |
| `ui-code-block__line-number`         | slot      |                     | A line's empty number, hidden from assistive technology.                 |
| `ui-code-block__prompt`              | slot      |                     | A command line's prompt, hidden from assistive technology.               |
| `data-variant`                       | attribute | `code`, `terminal`  | The kind of block.                                                       |
| `data-language`                      | attribute |                     | The block's language.                                                    |
| `data-token`                         | attribute |                     | On a token: its type, from the caller's tokenizer.                       |
| `data-kind`                          | state     | `command`, `output` | On a terminal line: a command after the prompt, or output.               |
| `data-overflowing`                   | state     | `true`              | On the code: it scrolls (wider or taller than its box) and is focusable. |
| `data-wrap`                          | attribute | `off`, `soft`       | On the code: whether long lines scroll or wrap.                          |
| `data-line-numbers`                  | state     | `true`              | On the code: its lines are numbered.                                     |
| `data-line-number`                   | attribute |                     | On a line number: the line's number, from 1.                             |
| `--ui-code-block-line-number-digits` | property  |                     | On numbered code: the digit count of the highest line number.            |
