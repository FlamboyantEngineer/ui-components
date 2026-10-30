# ui-components

Unstyled, accessible React components that expose documented styling hooks for a host stylesheet.

- **Unstyled components.** Components load no CSS and require no CSS variables. Every component renders hook classes (`ui-<component>`, `ui-<component>__<slot>`) and data attributes (`data-variant`, `data-size`, `data-disabled`, …), with documented custom properties for measured values. The host page loads a stylesheet that styles those hooks. The standalone labs include their own reference stylesheets.
- **Accessible behaviour** comes from [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html).
- **Generic API.** Neutral names and props (`Button`, `variant`, `size`). Built-in glyphs default to [Heroicons](https://heroicons.com) and can be replaced per glyph.
- **Static labs.** Every component has a lab page under `labs/` that shows its full variant, size and state matrix with a stylesheet picker. The built labs ship as a separate release archive so a host can serve them.

The library is preparing its initial `0.1.0` release. APIs and styling hooks are experimental until `1.0.0`; development changes are described in changesets without migration notices or deprecation periods. See [versioning](CONTRIBUTING.md#versioning).

## Install

Each release is a `v<version>` tag in this repository, on a commit that holds the built package, so installing it needs no build or source checkout. The repository is private, so git needs a token that can read it.

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

To try unreleased work, install a branch or commit the same way, for example `#dev`. The branch holds no build output, so npm installs the development dependencies in its clone and runs the `prepare` script, which builds the entry points and their declarations. Runnable labs are a separate download: extract `ui-components-labs-<version>.tgz` and serve its `labs/` directory with a static HTTP server. The lockfile records the branch's commit, and `npm ci` prepares that commit again. `npm run check:git-install -- "<dependency>"` checks such an install from a clean consumer.

`react` and `react-dom` 19 are peer dependencies.

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
import { BoltIcon } from '@heroicons/react/24/outline';

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

`npm run labs` runs `npm ci` when `package-lock.json` changed since the last install and `npm run build:labs` when a lab source changed since the last build. `npm run labs -- --dry-run` lists those steps without running them; `node scripts/serve-labs.mjs` serves `labs/` as it is.

Labs are static HTML files; any static file server works. In a lab, the toolbar's stylesheet picker switches between no styles, the neutral reference sheet (`labs/build/reference.css`, bundled from the partials in `labs/reference.css`) and any stylesheet URL, and writes a theme value to a root attribute (`data-theme` by default). `?stylesheet=`, `?theme=` and `?themeAttribute=` preselect them, so a host can open a lab with its own stylesheet and theme:

```text
labs/provider.html?stylesheet=/assets/app.css&theme=dark
```

The published package contains the built labs in `labs/` ([specs/LABS.md](specs/LABS.md)).

## Develop

Node.js 22 is required.

```sh
npm ci
npm run check       # lint, format, typecheck, no-reference, specs, labs, structure, unit tests, builds, public types, package
npm run test:labs   # Playwright against the built labs
```

[CONTRIBUTING.md](CONTRIBUTING.md) covers branches, versioning and the source rules.
