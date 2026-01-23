import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        __APP_VERSION__: 'readonly',
        __MAINTAINER_CALLSIGN__: 'readonly',
        __GITHUB_REPO__: 'readonly',
        __SECTION_NAMES__: 'readonly'
      },
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  {
    ignores: [
      'dist/',
      'build/',
      '.svelte-kit/',
      'node_modules/',
      'data_bg/',
      'data_en/',
      'data_en_debug/'
    ]
  }
];
