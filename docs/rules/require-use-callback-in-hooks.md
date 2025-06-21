# Enforce wrapping new functions with useCallback inside custom hooks and components (require-usecallback)

This rule ensures that all newly created functions inside custom hooks and React components are wrapped with `useCallback`.

## Rule Details

Functions created inside custom hooks and components without memoization will have different references on each render, potentially causing unnecessary re-renders or effect re-executions. This is especially important for:

- Functions passed as props to child components
- Functions used as dependencies in other hooks
- Event handlers that trigger expensive operations

Examples of **incorrect** code for this rule:

```javascript
// Custom hook without useCallback
function useCustomHook() {
  const handleClick = () => {
    console.log('clicked');
  };

  const handleSubmit = function () {
    console.log('submitted');
  };

  return { handleClick, handleSubmit };
}

// React component without useCallback
function Button({ onClick }) {
  const handleClick = () => {
    console.log('Button clicked');
    onClick();
  };

  return <button onClick={handleClick}>Click me</button>;
}

// Arrow function component
const Form = ({ onSubmit }) => {
  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(new FormData(e.target));
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

Examples of **correct** code for this rule:

```javascript
import { useCallback } from 'react';

// Custom hook with useCallback
function useCustomHook() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  const handleSubmit = useCallback(function () {
    console.log('submitted');
  }, []);

  return { handleClick, handleSubmit };
}

// React component with useCallback
function Button({ onClick }) {
  const handleClick = useCallback(() => {
    console.log('Button clicked');
    onClick();
  }, [onClick]);

  return <button onClick={handleClick}>Click me</button>;
}

// Arrow function component with useCallback
const Form = ({ onSubmit }) => {
  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      onSubmit(new FormData(e.target));
    },
    [onSubmit]
  );

  return <form onSubmit={handleSubmit}>...</form>;
};
```

## When Not To Use It

You may want to disable this rule if:

1. You're using a different memoization strategy
2. The functions in your hooks or components don't need stable references
3. You're prioritizing simplicity over performance
4. You're working with components that don't pass functions as props
5. Your application doesn't have performance concerns related to re-renders

## Auto-fix

This rule provides auto-fix functionality that will:

1. Wrap function expressions and arrow functions with `useCallback`
2. Add the `useCallback` import from 'react' if it doesn't exist
3. Initialize with an empty dependency array

## Options

This rule has no options.
