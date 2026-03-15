import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      // --- React Hooks ---
      ...eslintPluginReactHooks.configs.recommended.rules,

      // --- React Refresh ---
      ...eslintPluginReactRefresh.configs.vite.rules,

      // --- TypeScript: reduce noise ---
      '@typescript-eslint/no-explicit-any': 'warn', // warn instead of error — useful during prototyping
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // ignore args prefixed with _
          varsIgnorePattern: '^_', // ignore vars prefixed with _
          caughtErrorsIgnorePattern: '^_' // ignore caught errors prefixed with _
        }
      ],
      '@typescript-eslint/no-non-null-assertion': 'off', // too aggressive for Electron IPC / DOM refs
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-ignore': 'allow-with-description' } // allow @ts-ignore only when a reason is given
      ],
      '@typescript-eslint/explicit-function-return-type': 'off', // verbose; rely on inference
      '@typescript-eslint/explicit-module-boundary-types': 'off', // same as above
      '@typescript-eslint/no-empty-function': 'warn', // noop callbacks are common in Electron handlers
      '@typescript-eslint/no-empty-object-type': 'warn', // warn rather than error for empty interfaces

      // --- React: reduce noise ---
      'react/prop-types': 'off', // redundant with TypeScript
      'react/display-name': 'warn', // helpful for DevTools but not blocking
      'react/no-unescaped-entities': 'warn', // warn; too strict as an error for copy-heavy UIs
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }], // security: keep as error

      // --- General JS/TS quality ---
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // keep useful console methods in Electron main
      'no-debugger': 'warn', // warn instead of error so it doesn't block builds
      'prefer-const': 'error', // enforce immutability by default
      'no-var': 'error', // ban var entirely
      eqeqeq: ['error', 'always', { null: 'ignore' }], // strict equality; null == undefined is fine
      'object-shorthand': ['warn', 'always'], // prefer { foo } over { foo: foo }
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'TSEnumDeclaration',
          message: 'Avoid TypeScript enums; use const objects or union types instead.'
        }
      ]
    }
  },
  eslintConfigPrettier
)
