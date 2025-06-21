import { RuleTester } from 'eslint-v8';

/**
 * ESLint v8 用の RuleTester を作成
 * parserOptions 形式の設定を使用
 */
export const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
});
