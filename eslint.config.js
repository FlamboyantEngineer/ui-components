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
      'no-restricted-imports': ['error', { patterns: STYLING_PACKAGES }],
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
    files: ['scripts/**/*.mjs', 'eslint-rules/**/*.js', '*.config.{js,ts}'],
    languageOptions: { globals: { ...globals.node } },
  },
);
