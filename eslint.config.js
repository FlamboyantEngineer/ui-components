import jestDom from 'eslint-plugin-jest-dom';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';
import local from './eslint-rules/index.js';
import { createBaseConfig, ENUM_SYNTAX } from './tooling/eslint.mjs';

const STYLING_PACKAGES = [
  { group: ['@heroui/*', 'tailwindcss', 'tailwind-*', 'tailwind-merge', 'tailwind-variants'] },
  { group: ['styled-components', '@emotion/*', '@stitches/*', '@vanilla-extract/*', 'goober'] },
  { group: ['@linaria/*', 'styled-jsx', 'jss', 'react-jss', 'clsx', 'classnames'] },
];

// The React Compiler's rule set, every rule at error: code the compiler cannot optimise fails lint.
const REACT_COMPILER_RULES = Object.fromEntries(
  Object.keys(reactHooks.configs['recommended-latest'].rules).map((rule) => [rule, 'error']),
);

// React Aria and its companion packages load only in src/primitives (specs/PRIMITIVES.md).
const ARIA_PACKAGES = {
  group: [
    'react-aria',
    'react-aria/*',
    'react-aria-components',
    'react-aria-components/*',
    'react-stately',
    'react-stately/*',
    '@react-aria/*',
    '@react-stately/*',
    '@react-types/*',
    '@internationalized/*',
  ],
  message: 'Import React Aria building blocks from src/primitives (UIC-PRIMITIVES-1.1).',
};

// Labs show hosts the public API, so they never reach into the building blocks (specs/PRIMITIVES.md).
// Hidden text renders through the library's VisuallyHidden, which carries its hook (UIC-VISUALLY-HIDDEN-1.4).
const VISUALLY_HIDDEN_PRIMITIVE = {
  group: ['**/primitives/index.js', '**/primitives/content.js'],
  importNames: ['VisuallyHidden'],
  message: 'Use the library VisuallyHidden (src/components/visually-hidden/visually-hidden.js).',
};

const STORAGE_GLOBALS = ['localStorage', 'sessionStorage'].map((name) => ({
  name,
  message: 'Persist through the UiProvider storage adapter (useUiStorage).',
}));

// Components listen, look up and measure in their own element's document and window, which is a
// frame's or a popup window's when they render there (specs/PORTAL.md, UIC-PORTAL-1.7).
const STORAGE_PROPERTIES = ['localStorage', 'sessionStorage'].map((property) => ({
  object: 'window',
  property,
  message: 'Persist through the UiProvider storage adapter (useUiStorage).',
}));

const OWNER_WINDOW_GLOBALS = [
  'document',
  'window',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
].map((name) => ({
  name,
  message:
    "Read it from the component's own element: getOwnerDocument or getOwnerWindow (src/utils/owner-window.ts).",
}));

const PRIMITIVES_MODULES = {
  group: ['**/src/primitives', '**/src/primitives/**'],
  message: 'Labs use the public API, not src/primitives (UIC-PRIMITIVES-1.4).',
};

// The accessibility sweep scans every lab in both themes in one load (UIC-LABS-3.4), so a component
// spec does not reload its lab dark only to end on the same scan.
const DARK_RELOAD_SYNTAX = {
  selector:
    "ExpressionStatement:has(CallExpression[callee.property.name='open'] Property[key.name='theme'][value.value='dark']) + ExpressionStatement:last-child:has(CallExpression[callee.property.name='expectAccessible'][arguments.length=0])",
  message:
    'The accessibility sweep already scans this lab in the dark theme; drop the reload (UIC-LABS-3.4).',
};

// e2e/fixtures.ts owns the lab's cell and family addresses (matrix, matrixCell and their selectors).
const LAB_ADDRESS_SYNTAX = [
  {
    selector: 'Literal[value=/\\[data-lab-(?:family|cell)=/]',
    message: 'Address a lab section or cell through the e2e/fixtures.ts helpers (UIC-LABS-3.2).',
  },
  {
    selector: 'TemplateElement[value.raw=/\\[data-lab-(?:family|cell)=/]',
    message: 'Address a lab section or cell through the e2e/fixtures.ts helpers (UIC-LABS-3.2).',
  },
];

// Control heights come from the reference scale through controlHeight() in e2e/fixtures.ts.
const CONTROL_HEIGHT_SYNTAX = {
  selector:
    "CallExpression[callee.property.name='toHaveCSS'][arguments.0.value=/^(?:min-)?height$/][arguments.1.value=/^(?:20|24|28|32)px$/]",
  message:
    'Read a control height with controlHeight(page, size) from e2e/fixtures.ts (UIC-LABS-3.7).',
};

const TYPED_FILES = [
  'src/**/*.{ts,tsx}',
  'labs/src/**/*.{ts,tsx}',
  'test/**/*.{ts,tsx}',
  'e2e/**/*.ts',
  '*.config.ts',
];
// Vitest and Playwright load their configuration through its default export.
const DEFAULT_EXPORT_LOADERS = ['*.config.ts'];
const CONTEXT_PROVIDER_SYNTAX = {
  selector:
    "MemberExpression[property.name='Provider'], JSXMemberExpression[property.name='Provider']",
  message: 'Render a context as `<Context value>`, not `<Context.Provider>` (I5).',
};

// Library source: function components, cross-window node checks, cached formatters.
const SOURCE_SYNTAX = [
  {
    selector: 'ClassDeclaration',
    message: 'Use function components and plain functions (I1).',
  },
  {
    selector: 'ClassExpression',
    message: 'Use function components and plain functions (I1).',
  },
  {
    // A frame's or a popup window's nodes come from other constructors.
    selector:
      "BinaryExpression[operator='instanceof'][right.name=/^(Node|Element|ShadowRoot|(HTML|SVG)\\w*Element|\\w*Event)$/]",
    message:
      'Use isNode, isElement, isHTMLElement or isShadowRoot (src/utils/is-element.ts), or test an event by its fields, which hold for any window.',
  },
  {
    // Each call builds a new Intl formatter.
    selector: 'CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]',
    message:
      'Format through the cached useNumberFormatter or useDateFormatter (src/primitives), or getNumberFormat.',
  },
  ENUM_SYNTAX,
  CONTEXT_PROVIDER_SYNTAX,
];

// Inside a shadow root, `document.activeElement` is the host; read focus through the helpers.
const ACTIVE_ELEMENT_SYNTAX = {
  selector: "MemberExpression[property.name='activeElement']",
  message:
    'Read focus with getComposedActiveElement, isFocused, containsFocus or isFocusLost (src/utils/composed-focus.ts), which see through shadow roots.',
};

export default tseslint.config(
  ...createBaseConfig({
    name: 'ui-components',
    tsconfigRootDir: import.meta.dirname,
    typedFiles: TYPED_FILES,
    defaultExportLoaders: DEFAULT_EXPORT_LOADERS,
    sourceFiles: ['src/**/*.{ts,tsx}'],
    nodeFiles: [
      'scripts/**/*.mjs',
      'bin/*.mjs',
      'tooling/**/*.mjs',
      'eslint-rules/**/*.js',
      '*.config.{js,mjs,ts}',
    ],
    ignores: ['labs/build/', 'playwright-report/'],
    components: true,
  }),
  {
    files: TYPED_FILES,
    rules: { 'no-restricted-syntax': ['error', ENUM_SYNTAX, CONTEXT_PROVIDER_SYNTAX] },
  },
  {
    // Component specs: no dark reload for the sweep's scan, cells and sections addressed through
    // e2e/fixtures.ts, and control heights read from the scale.
    files: ['e2e/**/*.ts'],
    ignores: ['e2e/fixtures.ts', 'e2e/accessibility.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ENUM_SYNTAX,
        CONTEXT_PROVIDER_SYNTAX,
        DARK_RELOAD_SYNTAX,
        ...LAB_ADDRESS_SYNTAX,
        CONTROL_HEIGHT_SYNTAX,
      ],
    },
  },
  {
    // The control scale's own spec pins its pixel heights.
    files: ['e2e/control-sizes.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ENUM_SYNTAX,
        CONTEXT_PROVIDER_SYNTAX,
        DARK_RELOAD_SYNTAX,
        ...LAB_ADDRESS_SYNTAX,
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'labs/src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // The React Compiler's rules, all at error (C7). State an effect sets synchronously renders
      // twice: derive it, or say why the DOM must commit first.
      ...REACT_COMPILER_RULES,
      'no-restricted-imports': ['error', { patterns: [ARIA_PACKAGES] }],
    },
  },
  {
    // Labs use the public API: a component's entry point or main module, never its helpers.
    files: ['labs/src/**/*.{ts,tsx}'],
    plugins: { ui: local },
    rules: {
      'no-restricted-imports': ['error', { patterns: [ARIA_PACKAGES, PRIMITIVES_MODULES] }],
      'ui/component-imports': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    plugins: { ui: local },
    rules: {
      'ui/no-css-import': 'error',
      'ui/no-static-inline-style': 'error',
      'ui/hook-class-names': 'error',
      'no-restricted-imports': [
        'error',
        { patterns: [...STYLING_PACKAGES, ARIA_PACKAGES, VISUALLY_HIDDEN_PRIMITIVE] },
      ],
      'no-restricted-globals': ['error', ...STORAGE_GLOBALS],
      'no-restricted-properties': ['error', ...STORAGE_PROPERTIES],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-globals': ['error', ...STORAGE_GLOBALS, ...OWNER_WINDOW_GLOBALS],
      'no-restricted-properties': [
        'error',
        ...STORAGE_PROPERTIES,
        ...['document', 'window'].map((property) => ({
          object: 'globalThis',
          property,
          message:
            "Read it from the component's own element: getOwnerDocument or getOwnerWindow (src/utils/owner-window.ts).",
        })),
      ],
    },
  },
  {
    // Coding guidelines I1 and S4 (docs/CODING-GUIDELINES.md); the shared configuration holds the
    // size and naming limits.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    plugins: { ui: local },
    rules: {
      'ui/component-imports': 'error',
      'no-restricted-syntax': ['error', ...SOURCE_SYNTAX, ACTIVE_ELEMENT_SYNTAX],
    },
  },
  {
    // The focus helpers are where `activeElement` is read.
    files: ['src/utils/composed-focus.ts'],
    rules: { 'no-restricted-syntax': ['error', ...SOURCE_SYNTAX] },
  },
  {
    // Tests query what a reader perceives and act as a reader does (docs/TESTING-GUIDELINES.md).
    files: ['src/**/*.test.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    ...testingLibrary.configs['flat/react'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      // Events a reader cannot produce through user-event stay on fireEvent.
      'testing-library/prefer-user-event': [
        'error',
        {
          allowedMethods: [
            'scroll',
            'wheel',
            'load',
            'error',
            'dragStart',
            'dragEnter',
            'dragOver',
            'dragLeave',
            'drop',
            'dragEnd',
            'pointerCancel',
            'lostPointerCapture',
            'compositionStart',
            'compositionEnd',
          ],
        },
      ],
      // Components emit hooks only: classes, data attributes and measured properties are their public
      // API (specs/HOOK-CONTRACT.md), so tests read the rendered structure on purpose.
      'testing-library/no-node-access': 'off',
      'testing-library/no-container': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/ByTestId$/]',
          message: 'Query by role, label or text, or by a documented hook, not by test id.',
        },
        {
          selector: 'CallExpression[callee.name=/ByTestId$/]',
          message: 'Query by role, label or text, or by a documented hook, not by test id.',
        },
        ENUM_SYNTAX,
        CONTEXT_PROVIDER_SYNTAX,
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    ...jestDom.configs['flat/recommended'],
    rules: {
      ...jestDom.configs['flat/recommended'].rules,
      // Functional inline styles (positions, measured sizes, --ui-* properties) are hooks checked as
      // written; toHaveStyle compares jsdom's computed style, which resolves those differently.
      'jest-dom/prefer-to-have-style': 'off',
      // aria-valuenow is checked as the attribute string; toHaveValue reads range roles as numbers.
      'jest-dom/prefer-to-have-value': 'off',
    },
  },
  {
    files: ['src/components/visually-hidden/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...STYLING_PACKAGES, ARIA_PACKAGES] }],
    },
  },
  {
    files: ['src/primitives/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: STYLING_PACKAGES }],
    },
  },
);
