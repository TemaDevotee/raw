/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended'
  ],
  plugins: ['vue'],
  rules: {
    'no-unused-vars': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-mutating-props': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/attributes-order': 'off',
    'vue/html-self-closing': 'off',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/html-closing-bracket-spacing': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-toggle-inside-transition': 'off',
    'vue/require-explicit-emits': 'off',
    'vue/no-ref-as-operand': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/attribute-hyphenation': 'off',
    'no-empty': 'off',
    'no-useless-escape': 'off',
    'no-irregular-whitespace': 'off'
  },
  overrides: [
    { files: ['e2e/**', '**/*.test.*'], env: { jest: true, node: true } }
  ]
}
