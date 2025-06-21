import type { ESLint } from 'eslint';
import { rules } from './rules';

export const flatConfig: ESLint.Plugin = {
  meta: {
    name: '@kaiTakabe0301/eslint-plugin-react-memo',
    version: '0.0.1',
  },
  rules: {
    'require-usecallback': rules['require-usecallback'],
  },
};

Object.defineProperty(flatConfig, 'configs', {
  value: {
    recommended: {
      plugins: ['@kaiTakabe0301/react-memo'],
      rules: {
        '@kaiTakabe0301/react-memo/require-usecallback': 'error',
      },
    },
  },
});
