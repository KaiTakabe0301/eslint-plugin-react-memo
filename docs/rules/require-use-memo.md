# Enforce wrapping function calls and object-type values with useMemo inside custom hooks and components (require-usememo)

This rule ensures that function calls and object-type values (objects, arrays, JSX elements) inside custom hooks and React components are wrapped with `useMemo`.

## Rule Details

Values that need memoization fall into two categories:

1. **Function calls** - Any function invocation that might be expensive or create new references
2. **Object-type values** - Objects, arrays, and JSX elements that create new references on each render

Without memoization, these values will have different references on each render, potentially causing:

- Unnecessary re-renders of child components
- Unnecessary effect re-executions when used as dependencies
- Performance degradation from repeated expensive calculations

Examples of **incorrect** code for this rule:

```javascript
// Custom hook with function calls
function useCustomHook(value) {
  const result = calculateSomething(value);
  const processed = processor.process(data);

  return { result, processed };
}

// React component with object literals
function MyComponent({ data }) {
  const config = { theme: 'dark', size: 'large' };
  const items = [1, 2, 3];
  const element = <div>Hello</div>;

  return (
    <ChildComponent config={config} items={items}>
      {element}
    </ChildComponent>
  );
}

// Arrow function component
const Card = ({ content }) => {
  const styles = { padding: '10px', border: '1px solid #ccc' };
  const processedContent = formatContent(content);

  return <div style={styles}>{processedContent}</div>;
};
```

Examples of **correct** code for this rule:

```javascript
import { useMemo } from 'react';

// Custom hook with useMemo
function useCustomHook(value) {
  const result = useMemo(() => calculateSomething(value), [value]);
  const processed = useMemo(() => processor.process(data), [data]);

  return { result, processed };
}

// React component with useMemo
function MyComponent({ data }) {
  const config = useMemo(() => ({ theme: 'dark', size: 'large' }), []);
  const items = useMemo(() => [1, 2, 3], []);
  const element = useMemo(() => <div>Hello</div>, []);

  return (
    <ChildComponent config={config} items={items}>
      {element}
    </ChildComponent>
  );
}

// Arrow function component with useMemo
const Card = ({ content }) => {
  const styles = useMemo(
    () => ({ padding: '10px', border: '1px solid #ccc' }),
    []
  );
  const processedContent = useMemo(() => formatContent(content), [content]);

  return <div style={styles}>{processedContent}</div>;
};
```

## When Not To Use It

You may want to disable this rule if:

1. You're not experiencing performance issues related to re-renders
2. The values are only used internally and don't affect rendering
3. You're working with simple applications where optimization isn't critical
4. The function calls are guaranteed to be very fast (though the rule doesn't distinguish between expensive and cheap operations)

## Exceptions

This rule does **not** apply to:

- React Hook calls (useState, useEffect, useCallback, etc.)
- Console methods (console.log, console.warn, etc.)
- Primitive values (strings, numbers, booleans)
- Values that are already wrapped with useMemo

## Auto-fix

This rule provides auto-fix functionality that will:

1. Wrap the value with `useMemo`
2. Add the `useMemo` import from 'react' if it doesn't exist
3. Initialize with an empty dependency array (you should update this based on actual dependencies)

## Options

This rule has no options.

## Further Reading

- [React useMemo documentation](https://react.dev/reference/react/useMemo)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
