import { FlatCompat } from '@eslint/eslintrc/dist/eslintrc.cjs'
import importPlugin from 'eslint-plugin-import'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'next/core-web-vitals', 'next/typescript', 'prettier'],
  }),
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Warn about unused exports (functions, variables, etc.)
      'import/no-unused-modules': ['warn', { unusedExports: true }],
      // Warn about unused variables/functions within files
      'no-unused-vars': ['warn', { args: 'after-used', ignoreRestSiblings: true }],
    },
    files: ['**/*.{js,jsx,ts,tsx}'],
  },
]

export default eslintConfig