# ui-components

Unstyled, accessible React components that expose stable styling hooks for a host stylesheet.

- **Unstyled components.** Components load no CSS and require no CSS variables. Every component renders hook classes (`ui-<component>`, `ui-<component>__<slot>`) and data attributes (`data-variant`, `data-size`, `data-disabled`, …), with documented custom properties for measured values. The host page loads a stylesheet that styles those hooks. The standalone labs include their own reference stylesheets.
- **Accessible behaviour** comes from [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html).
- **Generic API.** Neutral names and props (`Button`, `variant`, `size`). Built-in glyphs default to [Heroicons](https://heroicons.com) and can be replaced per glyph.
- **Static labs.** Every component has a lab page under `labs/` that shows its full variant, size and state matrix with a stylesheet picker. The built labs ship in the package so a host can serve them.

## Install

The package is published privately to GitHub Packages as `@flamboyantengineer/ui-components`.

1. Create a token that can read the package:
   - **Locally:** a classic personal access token with the `read:packages` scope, from an account that can read `FlamboyantEngineer/ui-components`.
   - **In GitHub Actions of another repository:** add that repository under the package's **Manage Actions access** settings, give the job `permissions: packages: read`, and use `secrets.GITHUB_TOKEN`.
2. Point the `@flamboyantengineer` scope at GitHub Packages in the consuming project's `.npmrc`:

   ```ini
   @flamboyantengineer:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```

3. Install an exact version with the token in `NODE_AUTH_TOKEN`:

   ```sh
   NODE_AUTH_TOKEN=<token> npm install --save-exact @flamboyantengineer/ui-components
   ```

`react` and `react-dom` 19 are peer dependencies.

## Use

Import from the package root or from a component's own entry point, which keeps bundles small:

```tsx
import { Button } from '@flamboyantengineer/ui-components/button';
```

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

### Provider

Components work without any setup. `UiProvider` replaces the defaults when a host needs to ([specs/PROVIDER.md](specs/PROVIDER.md)):

```tsx
import { UiProvider, createSafeStorage } from '@flamboyantengineer/ui-components';
import { BoltIcon } from '@heroicons/react/24/outline';

<UiProvider
  icons={{ close: BoltIcon }} // replace one built-in glyph
  strings={{ close: 'Fermer' }} // replace built-in text
  locale="fr-FR" // React Aria formatting and direction
  renderLink={(props) => <RouterLink to={props.href} {...props} />} // library links
  navigate={router.navigate} // React Aria links, menu items and tabs with href
  storage={createSafeStorage(window.localStorage)} // persisted layout state
>
  <App />
</UiProvider>;
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
npm run build:labs   # bundle labs/src/*.lab.tsx into labs/build/
npm run labs         # serve labs/ at http://127.0.0.1:4173/
```

Labs are static HTML files; any static file server works. In a lab, the toolbar's stylesheet picker switches between no styles, the neutral reference sheet (`labs/build/reference.css`, bundled from the partials in `labs/reference.css`) and any stylesheet URL, and writes a theme value to a root attribute (`data-theme` by default). `?stylesheet=`, `?theme=` and `?themeAttribute=` preselect them, so a host can open a lab with its own stylesheet and theme:

```text
labs/provider.html?stylesheet=/assets/app.css&theme=dark
```

The published package contains the built labs in `labs/` ([specs/LABS.md](specs/LABS.md)).

## Develop

Node.js 22 is required.

```sh
npm ci
npm run check       # lint, format, typecheck, no-reference, specs, labs, unit tests, builds, package
npm run test:labs   # Playwright against the built labs
```

[CONTRIBUTING.md](CONTRIBUTING.md) covers branches, versioning and the source rules.
