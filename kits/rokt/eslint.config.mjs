import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  vi: 'readonly',
  vitest: 'readonly',
};

const sharedRules = {
  ...js.configs.recommended.rules,
  ...typescriptEslint.configs.recommended.rules,
  ...prettierConfig.rules,
  'prettier/prettier': 'error',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  'no-prototype-builtins': 'off',
};

export default [
  { ignores: ['**/node_modules/**', '**/dist/**'] },
  // Source files
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
    },
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser, process: 'readonly' },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: sharedRules,
  },
  // Test files
  {
    files: ['test/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
    },
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser, ...vitestGlobals },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...sharedRules,
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
];
