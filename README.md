# ui-components

Unstyled, accessible React components that expose stable styling hooks for a host stylesheet.

- **No styles.** The package ships no CSS and defines no CSS variables. Every component renders hook classes (`ui-<component>`, `ui-<component>__<slot>`) and data attributes (`data-variant`, `data-size`, `data-disabled`, …). The host page loads one stylesheet that styles those hooks.
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

## Labs

```sh
npm run build:labs   # bundle labs/src/*.lab.tsx into labs/build/
npm run labs         # serve labs/ at http://127.0.0.1:4173/
```

Labs are static HTML files; any static file server works. The published package contains the built labs in `labs/`.

## Develop

Node.js 22 is required.

```sh
npm ci
npm run check       # lint, format, typecheck, no-reference, specs, labs, unit tests, builds, package
npm run test:labs   # Playwright against the built labs
```

[CONTRIBUTING.md](CONTRIBUTING.md) covers branches, versioning and the source rules.
