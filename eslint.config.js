const js = require('@eslint/js');
const globals = require('globals');

const extensionGlobals = {
  ...globals.browser,
  ...globals.webextensions,
  CONFIG: 'readonly',
  DOMOptimizerConfig: 'readonly',
  Storage: 'readonly',
  SiteDetector: 'readonly',
  DOMTrimmer: 'readonly',
  LazyLoader: 'readonly',
  PerformanceBoost: 'readonly',
  DOMOptimizerOverlay: 'readonly',
  BaseAdapter: 'readonly',
  ChatGPTAdapter: 'readonly',
  ClaudeAdapter: 'readonly',
  GrokAdapter: 'readonly',
  PerplexityAdapter: 'readonly',
  GeminiAdapter: 'readonly',
  module: 'readonly'
};

module.exports = [
  {
    ignores: ['node_modules/**', 'icons/**', 'screenshots/**']
  },
  js.configs.recommended,
  {
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        require: 'readonly',
        module: 'readonly'
      }
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...extensionGlobals
      }
    },
    rules: {
      'no-redeclare': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'error'
    }
  }
];
