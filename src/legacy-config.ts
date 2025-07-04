// Legacy configs export (for ESLint v8 and below)
export const configs = {
  recommended: {
    plugins: ['@kaitakabe0301/react-memo'],
    rules: {
      '@kaitakabe0301/react-memo/require-usecallback': 'error',
      '@kaitakabe0301/react-memo/require-usememo': 'error',
    },
  },
};
