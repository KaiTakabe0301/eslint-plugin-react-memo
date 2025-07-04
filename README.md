# @kaitakabe0301/eslint-plugin-react-memo

[日本語版 README](./README.ja.md)

An ESLint plugin that enforces the use of `useCallback` for functions created in React custom hooks and components, and `useMemo` for function calls and object-type values.

## Overview

This plugin is designed to optimize the performance of React applications. Functions and values newly created within custom hooks or components will have different references on re-renders, potentially causing unnecessary re-renders or re-execution of side effects. This plugin enforces wrapping functions with `useCallback` and function calls or object-type values with `useMemo`.

## Installation

First, you need to install [ESLint](https://eslint.org/):

```sh
npm install eslint --save-dev
# or
pnpm add -D eslint
```

Next, install `@kaitakabe0301/eslint-plugin-react-memo`:

```sh
npm install @kaitakabe0301/eslint-plugin-react-memo --save-dev
# or
pnpm add -D @kaitakabe0301/eslint-plugin-react-memo
```

## Usage

### ESLint v9+ (Flat Config)

```javascript
// eslint.config.js
import reactMemoPlugin from '@kaitakabe0301/eslint-plugin-react-memo';

export default [
  {
    plugins: {
      '@kaitakabe0301/react-memo': reactMemoPlugin.flatConfig,
    },
    rules: {
      '@kaitakabe0301/react-memo/require-usecallback': 'error',
      '@kaitakabe0301/react-memo/require-usememo': 'error',
    },
  },
];
```

Using the recommended configuration:

```javascript
// eslint.config.js
import { flatConfig } from '@kaitakabe0301/eslint-plugin-react-memo';

export default [
  // Other configs...
  flatConfig.configs.recommended,
];
```

### ESLint v8 (Legacy Config)

Add `@kaitakabe0301/react-memo` to your `.eslintrc` as follows:

```json
{
  "plugins": ["@kaitakabe0301/react-memo"],
  "rules": {
    "@kaitakabe0301/react-memo/require-use-callback-in-hooks": "error",
    "@kaitakabe0301/react-memo/require-use-memo": "error"
  }
}
```

## Rules

### require-use-callback-in-hooks / require-usecallback

Enforces wrapping functions newly created in custom hooks and React components with `useCallback`.

This rule ensures that functions created within custom hooks or components maintain referential equality between renders, preventing unnecessary re-renders.

**❌ Bad:**

```javascript
// Custom hook
function useCustomHook() {
  const handler = () => {
    console.log('clicked');
  };
  return handler;
}

// React component
function Button({ onClick }) {
  const handleClick = () => {
    console.log('Button clicked');
    onClick();
  };
  return <button onClick={handleClick}>Click me</button>;
}

// Arrow function component
const Modal = ({ onClose }) => {
  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return <div onClick={handleBackdropClick}>Modal</div>;
};
```

**✅ Good:**

```javascript
import { useCallback } from 'react';

// Custom hook
function useCustomHook() {
  const handler = useCallback(() => {
    console.log('clicked');
  }, []);
  return handler;
}

// React component
function Button({ onClick }) {
  const handleClick = useCallback(() => {
    console.log('Button clicked');
    onClick();
  }, [onClick]);
  return <button onClick={handleClick}>Click me</button>;
}

// Arrow function component
const Modal = ({ onClose }) => {
  const handleBackdropClick = useCallback(
    e => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );
  return <div onClick={handleBackdropClick}>Modal</div>;
};
```

### require-use-memo / require-usememo

Enforces wrapping function calls and object-type values (objects, arrays, JSX elements) with `useMemo` in custom hooks and React components.

This rule detects two patterns:

1. Function calls - when computation cost or reference stability is needed
2. Object-type values - to prevent creating new references on every render

**❌ Bad:**

```javascript
// Custom hook
function useCustomHook(value) {
  const result = calculateSomething(value);
  const config = { theme: 'dark', size: 'large' };
  const items = [1, 2, 3];
  return { result, config, items };
}

// React component
function MyComponent({ data }) {
  const processed = processData(data);
  const styles = { padding: '10px', border: '1px solid #ccc' };
  const element = <div>Hello</div>;
  return <div style={styles}>{element}</div>;
}
```

**✅ Good:**

```javascript
import { useMemo } from 'react';

// Custom hook
function useCustomHook(value) {
  const result = useMemo(() => calculateSomething(value), [value]);
  const config = useMemo(() => ({ theme: 'dark', size: 'large' }), []);
  const items = useMemo(() => [1, 2, 3], []);
  return { result, config, items };
}

// React component
function MyComponent({ data }) {
  const processed = useMemo(() => processData(data), [data]);
  const styles = useMemo(
    () => ({ padding: '10px', border: '1px solid #ccc' }),
    []
  );
  const element = useMemo(() => <div>Hello</div>, []);
  return <div style={styles}>{element}</div>;
}
```

## Auto-fix

Both rules provide auto-fix functionality. ESLint will automatically:

1. Wrap functions with `useCallback` and values with `useMemo`
2. Import `useCallback` or `useMemo` from React if needed
3. Set an empty dependency array `[]` as the initial value

```sh
# Run auto-fix
eslint --fix .
```

## When to Use These Rules

These rules are particularly useful when:

1. You're building performance-critical applications
2. Your custom hooks return functions that are used as dependencies
3. You want to enforce consistent memoization patterns
4. You're working in a team and want to maintain code quality
5. You have components that pass functions as props to memoized child components
6. You want to prevent unnecessary re-renders throughout your component tree

## Development

### Setup

```sh
# Install dependencies
pnpm install

# Build for development
pnpm build
```

### Scripts

```sh
# Compile TypeScript
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run linting
pnpm lint

# Run formatting
pnpm format

# Type check
pnpm tsc --noEmit
```

### Project Structure

```
src/
├── rules/
│   ├── require-usecallback/
│   │   ├── index.ts        # Rule implementation
│   │   └── type.ts         # Type definitions
│   └── index.ts            # Rules export
├── flat-config.ts          # ESLint v9 flat config support
└── index.ts                # Main entry point
```

## Contributing

Bug reports and feature requests are welcome on GitHub Issues. Pull requests are also welcome!

### Development Flow

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

Copyright (c) 2025 Kai Takabe (KaiTakabe0301)
This software is released under the MIT License, see LICENSE.
