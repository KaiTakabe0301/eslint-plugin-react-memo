import { RuleTester } from 'eslint';

/**
 * ESLint v9 用の RuleTester を作成
 * languageOptions 形式の設定を使用
 */
export const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});
