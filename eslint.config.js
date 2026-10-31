import js from '@eslint/js';
import jestDom from 'eslint-plugin-jest-dom';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import local from './eslint-rules/index.js';

const STYLING_PACKAGES = [
  { group: ['@heroui/*', 'tailwindcss', 'tailwind-*', 'tailwind-merge', 'tailwind-variants'] },
  { group: ['styled-components', '@emotion/*', '@stitches/*', '@vanilla-extract/*', 'goober'] },
  { group: ['@linaria/*', 'styled-jsx', 'jss', 'react-jss', 'clsx', 'classnames'] },
];

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

// TypeScript rules TS2 to TS11 (docs/CODING-GUIDELINES.md). They load the TypeScript program, so
// `npm run lint` gives ESLint a 6 GB heap.
const TYPED_FILES = [
  'src/**/*.{ts,tsx}',
  'labs/src/**/*.{ts,tsx}',
  'test/**/*.{ts,tsx}',
  'e2e/**/*.ts',
  '*.config.ts',
];
// Vitest and Playwright load their configuration through its default export.
const DEFAULT_EXPORT_LOADERS = ['*.config.ts'];
const ENUM_SYNTAX = {
  selector: 'TSEnumDeclaration',
  message: 'Use a string-literal union or an `as const` object instead of `enum` (TS6).',
};

const CONTEXT_PROVIDER_SYNTAX = {
  selector:
    "MemberExpression[property.name='Provider'], JSXMemberExpression[property.name='Provider']",
  message: 'Render a context as `<Context value>`, not `<Context.Provider>` (I5).',
};

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'labs/build/',
      'coverage/',
      'test-results/',
      'playwright-report/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    name: 'ui-components/typescript',
    files: TYPED_FILES,
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': [
        'error',
        { allowThrowingAny: true, allowThrowingUnknown: true },
      ],
      'preserve-caught-error': 'error',
      'no-restricted-syntax': ['error', ENUM_SYNTAX, CONTEXT_PROVIDER_SYNTAX],
    },
  },
  {
    name: 'ui-components/typescript/default-exports',
    files: TYPED_FILES,
    ignores: DEFAULT_EXPORT_LOADERS,
    rules: {
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'labs/src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
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
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'localStorage',
          message: 'Persist through the UiProvider storage adapter (useUiStorage).',
        },
        {
          object: 'window',
          property: 'sessionStorage',
          message: 'Persist through the UiProvider storage adapter (useUiStorage).',
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-globals': ['error', ...STORAGE_GLOBALS, ...OWNER_WINDOW_GLOBALS],
    },
  },
  {
    // Coding guidelines C1, I1, S3 and N3/N6 (docs/CODING-GUIDELINES.md).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    plugins: { ui: local },
    rules: {
      complexity: ['error', 15],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      'ui/component-imports': 'error',
      'no-restricted-syntax': [
        'error',
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
            "BinaryExpression[operator='instanceof'][right.name=/^(Node|Element|(HTML|SVG)\\w*Element)$/]",
          message:
            'Use isNode, isElement or isHTMLElement (src/utils/is-element.ts), which hold for nodes of any window.',
        },
        ENUM_SYNTAX,
        CONTEXT_PROVIDER_SYNTAX,
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
      ],
    },
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
  {
    files: ['scripts/**/*.mjs', 'eslint-rules/**/*.js', '*.config.{js,ts}'],
    languageOptions: { globals: { ...globals.node } },
  },
);
