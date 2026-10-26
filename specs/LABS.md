# Labs

Every component has a static lab page that renders its full variant, size and state matrix. Labs are debugging and review pages, not package API, but hosts may serve the built labs from the package.

## UIC-LABS-1 - Pages

### UIC-LABS-1.1 - Static files

Each lab shall be a static file `labs/<name>.html` that loads a prebuilt bundle from `labs/build/<name>.js`. `npm run build:labs` builds every bundle, and the labs need nothing beyond a static file server (`npm run labs` is one). `labs/index.html` lists every lab with its description, in tiers from the simplest up: Foundations (setup and layout), Primitives grouped by type, Fields built on the field base, Assemblies of primitives and fields for one job, and Widgets that run a whole task on their own surface. Each tier lists its groups in order and each group its labs by title; every lab page names its tier and group (`lab-tier`, `lab-group`), and `npm run check:labs` rejects a tier or group the index does not list. The supplied server shall reject malformed URL paths with 400, reject paths outside the lab directory (including symbolic links that resolve outside it) with 403 and return 404 for missing files, while continuing to serve subsequent requests.

Every page shall declare an embedded icon so browsers do not request a missing `favicon.ico` while opening the standalone labs.

Implementation: `scripts/build-labs.mjs`, `scripts/serve-labs.mjs`, `scripts/lib/labs.mjs`, `scripts/check-labs.mjs`
Verification: `e2e/lab-harness.spec.ts`, `test/serve-labs.test.ts`

### UIC-LABS-1.2 - Shipped in the package

The published package shall contain the lab pages, `labs/reference.css` and the built bundles, including the PDF engine, its worker, its upstream license and both sample documents, so a host can serve them without building this repository or fetching lab dependencies from another server. Package checks shall verify the engine and worker byte for byte against the installed `pdfjs-dist` dependency and reject modified copies.

Implementation: `package.json`, `scripts/check-package.mjs`, `scripts/check-references.mjs`
Verification: `test/package.test.ts`, `test/check-references.test.ts`

### UIC-LABS-1.3 - Local start

`npm run labs` shall bring a checkout's labs up to date before serving them with the supplied server, passing its server options through: it runs `npm ci` when the dependencies are missing or `package-lock.json` changed since the last install, and `npm run build:labs` after an install, when the labs are not built, or when a lab source (the library and lab sources, the reference partials, the samples, the installed dependencies, the package and TypeScript configuration and the labs build scripts) changed, was added or was removed since the last build. It leaves a `node_modules` linked from another checkout alone. `--dry-run` prints the steps it would run, or that the labs are up to date, without running them or serving.

Implementation: `scripts/start-labs.mjs`, `package.json`
Verification: `test/start-labs.test.ts`

## UIC-LABS-2 - Chrome

### UIC-LABS-2.1 - Stylesheet picker

Every lab and the index shall show a toolbar with a stylesheet picker offering Unstyled, Reference (`labs/build/reference.css`) and Custom URL. The chosen stylesheet applies to the lab content immediately. The root element reports the current stylesheet's loading state in `data-lab-stylesheet-state` (`none`, `loading`, `loaded`, `error`); events from a replaced or removed stylesheet shall not change it. An invalid stylesheet URL shall report `error` without interrupting the lab or preventing another choice.

Implementation: `labs/src/chrome/lab-chrome.tsx`, `labs/src/chrome/settings.ts`, `labs/src/chrome/mount.tsx`
Verification: `e2e/lab-harness.spec.ts`, `labs/src/chrome/settings.test.ts`

### UIC-LABS-2.2 - Theme

The toolbar shall offer a theme picker: System (the default), Light, Dark and Custom, and the root-element attribute the theme is written to (`data-theme` by default). System writes `light` or `dark` from the reader's colour scheme and follows it when it changes; Light and Dark write `light` and `dark`, which the reference stylesheet draws; Custom writes a value typed in, nothing while it is empty, so a host stylesheet's own theme switch can be exercised. The toolbar draws itself in the colour scheme a light or dark theme sets.

Implementation: `labs/src/chrome/lab-chrome.tsx`, `labs/src/chrome/settings.ts`, `labs/src/chrome/mount.tsx`
Verification: `e2e/lab-harness.spec.ts`, `labs/src/chrome/settings.test.ts`

### UIC-LABS-2.3 - Query string and remembered choice

`?stylesheet=` (`none`, `reference` or a URL), `?theme=` and `?themeAttribute=` shall preselect the settings. Otherwise the last choice made in the toolbar applies, remembered in `localStorage`; a browser that refuses storage falls back to the defaults (reference sheet, system theme). Changing a setting rewrites the query string, and the index carries the current settings into every lab link, including after repeated toolbar changes.

Implementation: `labs/src/chrome/settings.ts`, `labs/src/chrome/mount.tsx`
Verification: `e2e/lab-harness.spec.ts`, `labs/src/chrome/settings.test.ts`

### UIC-LABS-2.5 - Styled from the first paint

Every lab page and the index shall apply the stylesheet and theme from a classic script in the head (`labs/build/boot.js`), before the body is parsed: the stylesheet link holds the first paint (`blocking="render"`) and the lab content stays hidden while the stylesheet loads, so a page never paints unstyled first. The toolbar stays visible, so a slow stylesheet can still be changed.

Implementation: `labs/src/chrome/boot.ts`, `labs/src/chrome/settings.ts`, `scripts/lib/labs.mjs`, `scripts/build-labs.mjs`
Verification: `e2e/lab-harness.spec.ts`, `labs/src/chrome/settings.test.ts`

### UIC-LABS-2.4 - Isolated chrome

The toolbar shall render in a shadow root with its own styles, so neither the chosen stylesheet nor the lab content changes how it looks.

Implementation: `labs/src/chrome/mount.tsx`, `labs/src/chrome/lab-chrome.tsx`
Verification: `e2e/lab-harness.spec.ts`

## UIC-LABS-3 - Content

### UIC-LABS-3.1 - Reference stylesheet

`labs/reference.css` shall be a plain, neutral and readable stylesheet that styles only hook classes and data attributes plus the document base, with a dark theme under `data-theme="dark"`. It styles every root and slot hook any spec declares. It imports `labs/reference/base.css` and one partial per spec (`labs/reference/<spec>.css`), and its import list is generated by `npm run new:lab -- --sync`.

The labs build shall flatten those partials into `labs/build/reference.css`, which the reference option loads in one stylesheet request. The source partials and their import index remain available for editing and inspection.

Implementation: `labs/reference.css`, `labs/reference/base.css`, `scripts/lib/labs.mjs`, `scripts/build-labs.mjs`, `scripts/check-specs.mjs`, `scripts/check-labs.mjs`
Verification: `e2e/lab-harness.spec.ts`

### UIC-LABS-3.2 - State matrix

`StateMatrix` shall render every combination of a lab's axes in one table, the last axis as columns, with each cell uniquely addressable within its matrix as `data-lab-cell="axis=value …"` for browser tests and screenshot comparison. The table stays readable unstyled, and every lab renders without loading a stylesheet.

Implementation: `labs/src/chrome/state-matrix.tsx`
Verification: `e2e/lab-harness.spec.ts`, `e2e/accessibility.spec.ts`

### UIC-LABS-3.3 - Browser fixture

The Playwright fixture `lab` shall open a lab with a given stylesheet and theme, wait until it has rendered and its stylesheet has loaded, fail the test on any page or console error, and run axe on the lab content.

Implementation: `e2e/fixtures.ts`
Verification: `e2e/lab-harness.spec.ts`

### UIC-LABS-3.4 - Accessible in both themes

Every lab shall pass axe with the reference stylesheet in its light theme and in `?theme=dark`, to catch automated accessibility regressions and reference-palette contrast failures in either theme.

Implementation: `labs/reference/base.css`
Verification: `e2e/accessibility.spec.ts`

### UIC-LABS-3.5 - One token set

The reference stylesheet shall draw every colour, type size and weight, radius, focus ring, state opacity, duration, tint and indent from the tokens `labs/reference/base.css` defines on the root (`--ref-*`), with dark values under `data-theme="dark"`: surfaces and text, accent and tones (each tone with a `-fill` that keeps its contrast under `--ref-on-fill`), tint levels for `color-mix`, the search highlight, eight category colours (with fills) for series and avatars, the type, radius and duration scales, focus rings, the scrim, and the dirty mark: a changed, unsaved field colours its whole frame with `--ref-dirty` (or, without a frame of its own, takes `--ref-dirty-outline`), like the validation colours, rather than a bar on one edge. A token that only aliases another in every theme is written as `var()` of it, so no two tokens hold the same literal colour. Partials use no literal a token covers, except a declaration marked `token-exempt:` with its reason (white paper, scanner contrast, a ring over any colour, an alpha mask). A token scoped to one partial is named `--ref-<partial>-…` and exists only for sizes that partial varies by its own data attributes. Every token defined is used, every token used is defined, and measured properties (`--ui-*`) carry a fallback only where the component sets them conditionally. Font shorthands shall use the same type tokens, with code-view line heights independent of the font-size scale; spinner rotations share one `ref-spin` animation in the base.

Implementation: `labs/reference/base.css`, `scripts/check-reference-tokens.mjs`
Verification: `test/reference-tokens.test.ts`, `e2e/accessibility.spec.ts`

### UIC-LABS-3.6 - Stable state layout

A state a person or a field moves through (hover, press, focus, selection, the current item, dirty, validation, pending, dragging and disabled) shall leave the reference layout as it was: no state rule sets a box's display, type size or weight, letter spacing, line height, width, height, padding, margin, border width, gap, grid tracks or flex basis. The stylesheet marks a state with colour, background, outline, shadow, opacity or a positioned part instead, and keeps room for what a state adds: a field keeps one line for its message and the restore button's place at the end of its control row (fields embedded in a row, cell or toolbar opt out, so they stay as tall as their control), and a pending button draws its spinner over its kept icons and label. A declaration marked `layout-exempt:` with its reason may differ (a label that reserves its selected weight, a skip link that appears on focus). Read-only, expanded, editing, empty and loading are modes, which may change the layout. Every selector in a comma-separated group shall satisfy this rule, including selectors before the last line.

Implementation: `labs/reference/field.css`, `labs/reference/button.css`, `scripts/check-reference-tokens.mjs`
Verification: `test/reference-tokens.test.ts`, `e2e/stable-states.spec.ts`

### UIC-LABS-3.7 - Control scale

Every single-line control in the reference stylesheet shall take its height from its `data-size` on one scale, whatever its content and the type around it: `--ref-control-height-xs`, `-sm`, `-md` and `-lg` in `labs/reference/base.css` (20, 24, 28 and 32 pixels). That covers buttons and icon buttons, menu triggers, segmented choices, search boxes, comboboxes, menubar triggers, menu rows, the box of every field (fields default to `md`, 28 pixels) and the rows of checkboxes, switches and radios. A control sets its own type size and line height from its size, so neither the label nor inherited type sets its height. A control's height is a fixed `height`; only content that wraps by design (a sentence button, tags or chips past one line, a label that wraps beside a box) grows past it, from a `min-height` at the same step. Buttons inside a control fit its box, and a field's restore, help and menu buttons take the size below the field's. `scripts/check-reference-tokens.mjs` rejects a `[data-size]` rule that gives a control the height of another step, or sizes a size variant of an element whose height comes from the scale off the scale. The Control Sizes lab draws every control at every size with short content, long content, and inside 24 pixel type at double line height. A visible type sample shows the surrounding typography independently of the control. Checkbox and radio groups show several choices, and size samples omit an empty field message's reserved line.

Implementation: `labs/reference/base.css`, `labs/reference/field.css`, `labs/reference/button.css`, `scripts/check-reference-tokens.mjs`, `labs/src/control-sizes.lab.tsx`
Verification: `test/reference-tokens.test.ts`, `e2e/control-sizes.spec.ts`

### UIC-LABS-3.8 - Field frames

Every field frame in the reference stylesheet, the box a value is typed or picked in (fields, search boxes, comboboxes, pickers, rich text and code editors, message composers, and the inputs of find bars, formula bars, menus, tables and property strips), shall draw from the field frame tokens in `labs/reference/base.css`, so every frame reads alike: `--ref-field-fill` with a `1px solid var(--ref-field-border)` border while it takes input, and `--ref-field-fill-inactive` once read-only, with a dashed border, or disabled, with muted text. A disabled field marks its frame rather than fading: neither the field nor the frame lowers its opacity, so the fill stays visibly grey and the label keeps full contrast. Controls without a frame (checkboxes, radios, switches, sliders) keep `--ref-disabled-opacity`. A focused frame turns its border to `--ref-focus` with `--ref-focus-ring-thin` around it, and `scripts/check-reference-tokens.mjs` rejects a focus ring built by hand. Validation and dirty marks colour the frame's border, and the frame's height comes from the control scale ([UIC-LABS-3.7](#uic-labs-37---control-scale)).

Implementation: `labs/reference/base.css`, `labs/reference/field.css`, `labs/reference/text-field.css`, `labs/reference/message-composer.css`, `scripts/check-reference-tokens.mjs`
Verification: `e2e/field-frames.spec.ts`, `test/reference-tokens.test.ts`
