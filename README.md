# ui-components

Unstyled, accessible React components that expose documented styling hooks for a host stylesheet.

- **Unstyled components.** Components load no CSS and require no CSS variables. Every component renders hook classes (`ui-<component>`, `ui-<component>__<slot>`) and data attributes (`data-variant`, `data-size`, `data-disabled`, …), with documented custom properties for measured values. The host page loads a stylesheet that styles those hooks. The standalone labs include their own reference stylesheets.
- **Accessible behaviour** comes from [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html).
- **Generic API.** Neutral names and props (`Button`, `variant`, `size`). Built-in glyphs are [Heroicons](https://heroicons.com) outline icons carried in the library (MIT, no icon dependency) and can be replaced per glyph with any SVG component.
- **Static labs.** Every component has a lab page under `labs/` that shows its full variant, size and state matrix with a stylesheet picker. The built labs ship as a separate release archive so a host can serve them.

The library is in `0.x` development; `v0.1.0` is its first release. APIs and styling hooks are experimental until `1.0.0`; development changes are described in changesets without migration notices or deprecation periods. See [versioning](CONTRIBUTING.md#versioning).

## Install

Each release is a `v<version>` tag in this repository, on a commit that holds the built package (`dist/` and the reference stylesheet) and no `prepare` script, so installing it installs no development dependencies and builds nothing. The repository is private, so git needs a token that can read it.

1. Create a token that can read `FlamboyantEngineer/ui-components`:
   - **Locally:** a fine-grained personal access token with read access to the repository's contents (or a classic token with the `repo` scope).
   - **In GitHub Actions of another repository:** a token with read access to this repository, stored as a secret of the consuming repository (the consuming job's own `GITHUB_TOKEN` cannot read other private repositories).
2. Let git use the token from the environment:

   ```sh
   git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/FlamboyantEngineer/".insteadOf "https://github.com/FlamboyantEngineer/"
   ```

3. Install an exact version by its tag:

   ```sh
   npm install --save-exact "git+https://github.com/FlamboyantEngineer/ui-components.git#v0.1.0"
   ```

   The lockfile records the tag's commit. The tarball is also attached to the tag's GitHub Release.

To try unreleased work, install a branch or commit the same way, for example `#dev`. The branch holds no build output, so npm installs the development dependencies in its clone and runs the `prepare` script, which builds the entry points, their declarations and the reference stylesheet. Runnable labs are a separate download: extract `ui-components-labs-<version>.tgz` and serve its `labs/` directory with a static HTTP server. The lockfile records the branch's commit, and `npm ci` prepares that commit again. `npm run check:git-install -- "<dependency>"` checks such an install from a clean consumer.

The package ships the neutral reference stylesheet at `labs/build/reference.css` (also `@flamboyantengineer/ui-components/reference.css`): one self-contained file a host can copy into its assets or import, built when npm prepares the package. A bare `import '@flamboyantengineer/ui-components/reference.css';` opts into these styles and survives production tree shaking without consumer overrides; unused JavaScript exports remain removable. It sits in the `ui-reference` cascade layer, so the host's own unlayered rules override it without a specificity fight, and it supports Chrome and Edge 117, Firefox 121 and Safari 17 or later (the package's `browserslist`). It styles components only; to also take its document base (type, text colour, canvas and colour scheme on the page), set `data-reference-document` on the root element, and `data-theme="dark"` there for the dark theme.

`react` and `react-dom` 19.2 or later are peer dependencies. Three entry points also need the optional rich-text peers (`@handlewithcare/react-prosemirror`, `react-reconciler` and the `prosemirror-*` packages listed in `package.json`): `@flamboyantengineer/ui-components/rich-text-editor`, `/message-composer/rich` and `/chat`. A host that imports none of them installs none of the peers. `prosemirror-view` is pinned to an exact version because `@handlewithcare/react-prosemirror` requires exactly that version; install the version `package.json` names.

## Use

Import from the package root or from a component's own entry point, which keeps bundles small:

```tsx
import { Button } from '@flamboyantengineer/ui-components/button';
import { PlusGlyph } from '@flamboyantengineer/ui-components/core';

<Button startIcon={PlusGlyph}>Add item</Button>;
```

Icons accept imported components or rendered elements. Built-in glyph components honor `UiProvider` overrides; icons from other libraries can be passed directly.

Then style the hooks in the host stylesheet:

```css
.ui-button[data-variant='primary'] {
  background: #1d4ed8;
  color: white;
}
.ui-button[data-pressed] {
  transform: translateY(1px);
}
```

The styling contract is [specs/HOOK-CONTRACT.md](specs/HOOK-CONTRACT.md). Each component's spec under [specs/](specs/) lists its hooks in a `## Hooks` table.

### Server components

Interactive modules start with `'use client'`, so a React Server Components framework (such as the Next.js app router) can import any entry point from a server page. Render components there with serializable props, and call server-safe utilities such as `sanitizeHtml`, `parseMarkdown` or `formatMetaLine` on the server. Event handlers, render functions and hooks belong in the host's own client module:

```tsx
// app/page.tsx, a server component
import { Badge, Button, UiProvider, formatMetaLine } from '@flamboyantengineer/ui-components';

export default function Page() {
  return (
    <UiProvider locale="en-US">
      <p>{formatMetaLine(['Draft', 3, 'shared'])}</p>
      <Badge>New</Badge>
      <Button type="submit">Save</Button>
    </UiProvider>
  );
}
```

```tsx
// app/save-button.tsx
'use client';
import { Button } from '@flamboyantengineer/ui-components/button';

export function SaveButton({ onSaved }: { onSaved: () => void }) {
  return <Button onPress={onSaved}>Save</Button>;
}
```

The boundaries are specified in [specs/SERVER-COMPONENTS.md](specs/SERVER-COMPONENTS.md).

### Provider

Components work without any setup. `UiProvider` replaces the defaults when a host needs to ([specs/PROVIDER.md](specs/PROVIDER.md)):

```tsx
import { UiProvider, createSafeStorage } from '@flamboyantengineer/ui-components';
import { fr } from '@flamboyantengineer/ui-components/locales';
import { BoltIcon } from './icons'; // any SVG component

<UiProvider
  icons={{ close: BoltIcon }} // replace one built-in glyph
  messages={{ ...fr, close: 'Fermer la fenêtre' }} // a language file, with any key replaced
  locale="fr-FR" // plurals, numbers and lists; React Aria formatting and direction
  renderLink={(props) => <RouterLink to={props.href} {...props} />} // library links
  navigate={router.navigate} // React Aria links, menu items and tabs with href
  storage={createSafeStorage(window.localStorage)} // persisted layout state
>
  <App />
</UiProvider>;
```

### Languages

All built-in text comes from a language file: a flat JSON object of [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/) messages, one per key. The package ships `en` (the default), `fr`, `es` and `ja` from `@flamboyantengineer/ui-components/locales`, and as JSON from `@flamboyantengineer/ui-components/locales/<language>.json` for translation tools. Pass another file, or part of one, as `messages`; changing `messages` and `locale` switches every component below on the fly, as a language menu does. A host formats its own messages with the same rules through `useFormatMessage()` or `formatMessage()`:

```tsx
const format = useFormatMessage();
format('{count, plural, one {# guest} other {# guests}}: {names}', { count: 3, names });
// 3 guests: Ana, Ben, and Chloé
```

### External form controllers

Fields can be owned by a form controller such as React Hook Form instead of a library `Form`: they take values through `value` and `onChange`, report leaving through `onLeave`, focus through `controlRef` and show the controller's errors through `errorMessage`. [docs/FORM-CONTROLLERS.md](docs/FORM-CONTROLLERS.md) has the recipe and says which layer owns validation, dirty state and the submit; the library itself depends on no controller.

### Testing helpers

`@flamboyantengineer/ui-components/testing` drives the components from a host's tests the way a reader does ([specs/TESTING.md](specs/TESTING.md)). The helpers work with any test runner; they need the optional peers `@testing-library/dom` and `@testing-library/user-event`.

```tsx
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  chooseMenuItem,
  getFieldError,
  getTableCell,
  pickDate,
  selectOption,
} from '@flamboyantengineer/ui-components/testing';

const user = userEvent.setup();
await selectOption(user, screen.getByRole('button', { name: /Fruit$/ }), 'Pear');
await pickDate(user, screen.getByRole('group', { name: 'Due' }), '2026-05-14');
await chooseMenuItem(user, screen.getByRole('button', { name: 'Actions' }), 'Delete');
expect(getTableCell(screen.getByRole('grid'), 'Apple', 'Colour')).toHaveTextContent('Red');
expect(getFieldError(screen.getByRole('textbox', { name: 'Name' }))).toBeNull();
```

| Helper                                               | Does                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `selectOption(user, field, option)`                  | Opens a `SelectField` or `Combobox` list from its button and picks an option. |
| `pickComboboxOption(user, input, { text, option })`  | Types into a combobox and picks a suggestion.                                 |
| `openMenu(user, trigger)`                            | Opens a menu and returns it.                                                  |
| `chooseMenuItem(user, trigger, name)`                | Opens a menu and presses an item.                                             |
| `pickDate(user, field, isoDate)`                     | Types an ISO date into a date field's segments.                               |
| `toggleTreeItem(user, tree, name)`                   | Expands or collapses a tree row.                                              |
| `getTableCell(table, rowName, columnName)`           | Finds a cell by row and column names.                                         |
| `dismissOverlay(user, overlay?)`                     | Presses Escape and waits for the overlay to close.                            |
| `getHookElement(root, component, slot?)`             | Finds the element carrying `ui-<component>` or `ui-<component>__<slot>`.      |
| `getFieldError(field)`, `getFieldDescription(field)` | Read the error and description a field's control announces.                   |
| `createMemoryStorage(initial?)`                      | A `UiStorage` for `UiProvider` that a test can read.                          |

## Labs

```sh
npm run labs         # install and build what is out of date, then serve labs/ at http://127.0.0.1:4173/
npm run build:labs   # bundle labs/src/*.lab.tsx into labs/build/
```

`npm run labs` runs `npm ci` when `package-lock.json` changed since the last install and `npm run build:labs` when a lab source changed since the last build. `npm run labs -- --dry-run` lists those steps without running them; `node scripts/serve-labs.mjs` serves `labs/` as it is. Both, and the browser tests, use port 4173 (`LABS_PORT` in `scripts/lib/labs.mjs`); set the `LABS_PORT` environment variable to use another.

Labs are static HTML files; any static file server works. In a lab, the toolbar's stylesheet picker switches between no styles, the neutral reference sheet (`labs/build/reference.css`, bundled from the partials in `labs/reference.css`) and any stylesheet URL, and writes a theme value to a root data attribute (`data-theme` by default, excluding the reserved `data-lab-*` attributes). `?stylesheet=`, `?theme=` and `?themeAttribute=` preselect them, so a host can open a lab with its own stylesheet and theme:

```text
labs/provider.html?stylesheet=/assets/app.css&theme=dark
```

The package ships no labs except the reference stylesheet; the built labs are the separate `ui-components-labs-<version>.tgz` release archive ([specs/LABS.md](specs/LABS.md)).

## Develop

Node.js 22 is required.

```sh
npm ci
npm run check       # lint, format, types, references, specs, labs, structure, client boundaries, builds, unit tests, public types, package, labs archive
npm run test:labs   # Playwright against the built labs
npm run cleanup     # return to dev, delete working branches and remove test output
```

Run `./cleanup` on Unix or `cleanup.cmd` on Windows for the same cleanup, including
from another working directory. It switches to local `dev` tracking `origin/dev`
(creating `dev` if needed), preserves local `dev` commits and deletes every other
local branch, including branches with unmerged commits. It uses the existing
`origin/dev` reference without fetching and stops if Git cannot safely switch.
Cleanup then removes `coverage/`, `test-results/`,
`playwright-report/`, `blob-report/`, `node_modules/.cache/` and `node_modules/.vite/`.
It keeps installed dependencies and built package and lab output.

[CONTRIBUTING.md](CONTRIBUTING.md) covers branches, versioning and the source rules.
