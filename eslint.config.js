import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
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
    files: ['src/**/*.{ts,tsx}', 'labs/src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-restricted-imports': ['error', { patterns: [ARIA_PACKAGES] }],
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
      'no-restricted-imports': ['error', { patterns: [...STYLING_PACKAGES, ARIA_PACKAGES] }],
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Persist through the UiProvider storage adapter (useUiStorage).',
        },
        {
          name: 'sessionStorage',
          message: 'Persist through the UiProvider storage adapter (useUiStorage).',
        },
      ],
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
        { selector: 'ExportDefaultDeclaration', message: 'Use named exports (S3).' },
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
