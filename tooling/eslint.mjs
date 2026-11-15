// The ESLint configuration every repository shares (specs/TOOLING.md, UIC-TOOLING-3.1): imports,
// the type-aware TypeScript rules TS2 to TS11, named exports only, and the size and naming limits
// of library source. A repository spreads it first and adds its own rules after it:
//
//   import { createBaseConfig } from '@flamboyantengineer/ui-components/tooling/eslint';
//   export default [...createBaseConfig({ tsconfigRootDir: import.meta.dirname, ... }), ...own];

import js from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Forbids `enum` (TS6); a repository that adds `no-restricted-syntax` selectors repeats it. */
export const ENUM_SYNTAX = {
  selector: 'TSEnumDeclaration',
  message: 'Use a string-literal union or an `as const` object instead of `enum` (TS6).',
};

const ALWAYS_IGNORED = ['node_modules/', 'dist/', 'coverage/', 'test-results/'];

/**
 * @typedef {object} BaseConfigOptions
 * @property {string} name Prefixes the names of the configuration objects, such as `ui-components`.
 * @property {string} tsconfigRootDir The repository root, for the type-aware rules.
 * @property {string[]} typedFiles The files the type-aware rules load the TypeScript program for.
 * @property {string[]} sourceFiles Library source, which takes the size and naming limits.
 * @property {string[]} nodeFiles Files that run in Node: scripts and configuration.
 * @property {string[]} [defaultExportLoaders] Typed files a tool loads through their default export.
 * @property {string[]} [ignores] Build output beyond `node_modules/`, `dist/`, `coverage/` and `test-results/`.
 * @property {boolean} [components] Library source declares React components, so functions and
 *   parameters may be PascalCase.
 */

/**
 * The shared configuration objects.
 * @param {BaseConfigOptions} options
 */
export function createBaseConfig(options) {
  const { name, tsconfigRootDir, typedFiles, sourceFiles, nodeFiles } = options;
  const { defaultExportLoaders = [], ignores = [], components = false } = options;
  const functionCase = components ? ['camelCase', 'PascalCase'] : ['camelCase'];
  return tseslint.config(
    { ignores: [...ALWAYS_IGNORED, ...ignores] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      languageOptions: { globals: { ...globals.browser } },
      plugins: { 'simple-import-sort': simpleImportSort },
      rules: {
        // One import statement per module, sorted: packages first, then relative paths.
        'no-duplicate-imports': 'error',
        'simple-import-sort/imports': [
          'error',
          { groups: [['^\\u0000', '^node:', '^@?\\w', '^']] },
        ],
        'simple-import-sort/exports': 'error',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
        ],
      },
    },
    {
      // TypeScript rules TS2 to TS11 (docs/CODING-GUIDELINES.md). They load the TypeScript
      // program, so `npm run lint` gives ESLint a 6 GB heap.
      name: `${name}/typescript`,
      files: typedFiles,
      languageOptions: { parserOptions: { projectService: true, tsconfigRootDir } },
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
        'no-restricted-syntax': ['error', ENUM_SYNTAX],
      },
    },
    {
      name: `${name}/typescript/default-exports`,
      files: typedFiles,
      ignores: defaultExportLoaders,
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
      // Coding guidelines C1, N3 and N6 (docs/CODING-GUIDELINES.md).
      name: `${name}/source`,
      files: sourceFiles,
      ignores: ['**/*.test.{ts,tsx}'],
      rules: {
        complexity: ['error', 15],
        'max-depth': ['error', 3],
        'max-params': ['error', 3],
        'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
        'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'typeLike', format: ['PascalCase'] },
          {
            selector: 'variable',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
          },
          { selector: 'function', format: functionCase },
          { selector: 'parameter', format: functionCase, leadingUnderscore: 'allow' },
        ],
      },
    },
    { name: `${name}/node`, files: nodeFiles, languageOptions: { globals: { ...globals.node } } },
  );
}
