export const createRequireUseMemoTestCases = () => ({
  validUseMemoTestCases: [
    // カスタムフック内でuseMemoを使用している場合は問題なし
    {
      code: `
        import { useMemo } from 'react';
        function useCustomHook() {
          const result = useMemo(() => calculateSomething(value), [value]);
          const data = useMemo(() => ({ foo: 'bar' }), []);
          const items = useMemo(() => [1, 2, 3], []);
          return { result, data, items };
        }
      `,
    },
    // カスタムフックでもコンポーネントでもない関数は対象外
    {
      code: `
        function normalFunction() {
          const result = calculateSomething(value);
          const data = { foo: 'bar' };
          const items = [1, 2, 3];
          return { result, data, items };
        }
      `,
    },
    // Reactコンポーネント内でuseMemoを使用している場合は問題なし
    {
      code: `
        import { useMemo } from 'react';
        function MyComponent() {
          const processed = useMemo(() => processData(data), [data]);
          const config = useMemo(() => ({ theme: 'dark' }), []);
          const element = useMemo(() => <div>Hello</div>, []);
          return <div>{element}</div>;
        }
      `,
    },
    // React Hooksの呼び出しは対象外
    {
      code: `
        import { useState, useEffect } from 'react';
        function useCustomHook() {
          const [state, setState] = useState(0);
          const ref = useRef(null);
          useEffect(() => {
            console.log('effect');
          }, []);
          return state;
        }
      `,
    },
    // console系の呼び出しは対象外
    {
      code: `
        function useDebugHook() {
          const logValue = console.log('debug');
          const warnValue = console.warn('warning');
          return null;
        }
      `,
    },
    // プリミティブ値は対象外
    {
      code: `
        function useSimpleHook() {
          const number = 42;
          const text = 'hello';
          const bool = true;
          return { number, text, bool };
        }
      `,
    },
    // メソッドチェーンが既にuseMemoでラップされている場合は問題なし
    {
      code: `
        import { useMemo } from 'react';
        function useFilteredData(data) {
          const filtered = useMemo(() => data
            .filter(item => item.active)
            .map(item => ({ ...item, timestamp: Date.now() }))
            .sort((a, b) => b.timestamp - a.timestamp), [data]);
          
          const summary = useMemo(() => data
            .reduce((acc, item) => ({
              total: acc.total + item.value,
              count: acc.count + 1
            }), { total: 0, count: 0 }), [data]);
          
          return { filtered, summary };
        }
      `,
    },
    // コンポーネント内でメソッドチェーンがuseMemoでラップされている
    {
      code: `
        import { useMemo } from 'react';
        const SearchResults = ({ items, query }) => {
          const results = useMemo(() => items
            .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
            .map(item => ({
              ...item,
              highlighted: item.title.replace(
                new RegExp(query, 'gi'),
                match => \`<mark>\${match}</mark>\`
              )
            }))
            .slice(0, 20), [items, query]);
          
          return (
            <ul>
              {results.map(result => (
                <li key={result.id} dangerouslySetInnerHTML={{ __html: result.highlighted }} />
              ))}
            </ul>
          );
        };
      `,
    },
  ],
  invalidUseMemoTestCases: [
    // ケース1: 関数呼び出し（React importなし）
    {
      code: `
        function useCustomHook() {
          const result = calculateSomething(value);
          return result;
        }
      `,
      errors: [
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function useCustomHook() {
          const result = useMemo(() => calculateSomething(value), []);
          return result;
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useMemo } from 'react';
        function useCustomHook() {
          const result = useMemo(() => calculateSomething(value), []);
          return result;
        }
      `,
    },
    // ケース2: オブジェクトリテラル（既存import有り）
    {
      code: `
        import { useState } from 'react';
        function useCustomHook() {
          const [count, setCount] = useState(0);
          const config = { theme: 'dark', count };
          return config;
        }
      `,
      errors: [
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useState, useMemo } from 'react';
        function useCustomHook() {
          const [count, setCount] = useState(0);
          const config = useMemo(() => ({ theme: 'dark', count }), []);
          return config;
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useState, useMemo } from 'react';
        function useCustomHook() {
          const [count, setCount] = useState(0);
          const config = useMemo(() => ({ theme: 'dark', count }), []);
          return config;
        }
      `,
    },
    // ケース3: 配列リテラル
    {
      code: `
        function useListHook() {
          const items = [1, 2, 3, 4, 5];
          return items;
        }
      `,
      errors: [
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function useListHook() {
          const items = useMemo(() => [1, 2, 3, 4, 5], []);
          return items;
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useMemo } from 'react';
        function useListHook() {
          const items = useMemo(() => [1, 2, 3, 4, 5], []);
          return items;
        }
      `,
    },
    // ケース4: JSX要素（Reactコンポーネント内）
    {
      code: `
        function MyComponent({ title }) {
          const header = <h1>{title}</h1>;
          return <div>{header}</div>;
        }
      `,
      errors: [
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function MyComponent({ title }) {
          const header = useMemo(() => <h1>{title}</h1>, []);
          return <div>{header}</div>;
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useMemo } from 'react';
        function MyComponent({ title }) {
          const header = useMemo(() => <h1>{title}</h1>, []);
          return <div>{header}</div>;
        }
      `,
    },
    // ケース5: メソッド呼び出し
    {
      code: `
        function useDataHook(data) {
          const formatted = data.format();
          const processed = processor.process(data);
          return { formatted, processed };
        }
      `,
      errors: [
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function useDataHook(data) {
          const formatted = useMemo(() => data.format(), []);
          const processed = processor.process(data);
          return { formatted, processed };
        }
      `,
            },
          ],
        },
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function useDataHook(data) {
          const formatted = data.format();
          const processed = useMemo(() => processor.process(data), []);
          return { formatted, processed };
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useMemo } from 'react';
        function useDataHook(data) {
          const formatted = useMemo(() => data.format(), []);
          const processed = processor.process(data);
          return { formatted, processed };
        }
      `,
    },
    // ケース6: アロー関数コンポーネント
    {
      code: `
        const Card = ({ data }) => {
          const content = processContent(data);
          const styles = { padding: '10px', border: '1px solid #ccc' };
          return <div style={styles}>{content}</div>;
        };
      `,
      errors: [
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        const Card = ({ data }) => {
          const content = useMemo(() => processContent(data), []);
          const styles = { padding: '10px', border: '1px solid #ccc' };
          return <div style={styles}>{content}</div>;
        };
      `,
            },
          ],
        },
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        const Card = ({ data }) => {
          const content = processContent(data);
          const styles = useMemo(() => ({ padding: '10px', border: '1px solid #ccc' }), []);
          return <div style={styles}>{content}</div>;
        };
      `,
            },
          ],
        },
      ],
      output: `
        import { useMemo } from 'react';
        const Card = ({ data }) => {
          const content = useMemo(() => processContent(data), []);
          const styles = { padding: '10px', border: '1px solid #ccc' };
          return <div style={styles}>{content}</div>;
        };
      `,
    },
    // ケース7: メソッドチェーンを多用しているケース
    {
      code: `
        function useDataProcessing(items) {
          const sortedItems = items
            .filter(item => item.active)
            .sort((a, b) => a.priority - b.priority)
            .map(item => ({ ...item, processed: true }));
          
          const summary = data
            .filter(d => d.visible)
            .map(d => d.value)
            .reduce((acc, val) => acc + val, 0);
          
          const uniqueTags = posts
            .flatMap(post => post.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)
            .sort();
          
          const formattedNames = users
            .map(user => user.name)
            .filter(name => name.length > 0)
            .map(name => name.toLowerCase())
            .sort()
            .join(', ');
          
          return { sortedItems, summary, uniqueTags, formattedNames };
        }
      `,
      errors: [
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function useDataProcessing(items) {
          const sortedItems = useMemo(() => items
            .filter(item => item.active)
            .sort((a, b) => a.priority - b.priority)
            .map(item => ({ ...item, processed: true })), []);
          
          const summary = data
            .filter(d => d.visible)
            .map(d => d.value)
            .reduce((acc, val) => acc + val, 0);
          
          const uniqueTags = posts
            .flatMap(post => post.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)
            .sort();
          
          const formattedNames = users
            .map(user => user.name)
            .filter(name => name.length > 0)
            .map(name => name.toLowerCase())
            .sort()
            .join(', ');
          
          return { sortedItems, summary, uniqueTags, formattedNames };
        }
      `,
            },
          ],
        },
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function useDataProcessing(items) {
          const sortedItems = items
            .filter(item => item.active)
            .sort((a, b) => a.priority - b.priority)
            .map(item => ({ ...item, processed: true }));
          
          const summary = useMemo(() => data
            .filter(d => d.visible)
            .map(d => d.value)
            .reduce((acc, val) => acc + val, 0), []);
          
          const uniqueTags = posts
            .flatMap(post => post.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)
            .sort();
          
          const formattedNames = users
            .map(user => user.name)
            .filter(name => name.length > 0)
            .map(name => name.toLowerCase())
            .sort()
            .join(', ');
          
          return { sortedItems, summary, uniqueTags, formattedNames };
        }
      `,
            },
          ],
        },
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function useDataProcessing(items) {
          const sortedItems = items
            .filter(item => item.active)
            .sort((a, b) => a.priority - b.priority)
            .map(item => ({ ...item, processed: true }));
          
          const summary = data
            .filter(d => d.visible)
            .map(d => d.value)
            .reduce((acc, val) => acc + val, 0);
          
          const uniqueTags = useMemo(() => posts
            .flatMap(post => post.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)
            .sort(), []);
          
          const formattedNames = users
            .map(user => user.name)
            .filter(name => name.length > 0)
            .map(name => name.toLowerCase())
            .sort()
            .join(', ');
          
          return { sortedItems, summary, uniqueTags, formattedNames };
        }
      `,
            },
          ],
        },
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        function useDataProcessing(items) {
          const sortedItems = items
            .filter(item => item.active)
            .sort((a, b) => a.priority - b.priority)
            .map(item => ({ ...item, processed: true }));
          
          const summary = data
            .filter(d => d.visible)
            .map(d => d.value)
            .reduce((acc, val) => acc + val, 0);
          
          const uniqueTags = posts
            .flatMap(post => post.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)
            .sort();
          
          const formattedNames = useMemo(() => users
            .map(user => user.name)
            .filter(name => name.length > 0)
            .map(name => name.toLowerCase())
            .sort()
            .join(', '), []);
          
          return { sortedItems, summary, uniqueTags, formattedNames };
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useMemo } from 'react';
        function useDataProcessing(items) {
          const sortedItems = useMemo(() => items
            .filter(item => item.active)
            .sort((a, b) => a.priority - b.priority)
            .map(item => ({ ...item, processed: true })), []);
          
          const summary = data
            .filter(d => d.visible)
            .map(d => d.value)
            .reduce((acc, val) => acc + val, 0);
          
          const uniqueTags = posts
            .flatMap(post => post.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)
            .sort();
          
          const formattedNames = users
            .map(user => user.name)
            .filter(name => name.length > 0)
            .map(name => name.toLowerCase())
            .sort()
            .join(', ');
          
          return { sortedItems, summary, uniqueTags, formattedNames };
        }
      `,
    },
    // ケース8: React コンポーネント内のメソッドチェーン
    {
      code: `
        const DataTable = ({ rawData }) => {
          const processedData = rawData
            .filter(row => row.isValid)
            .map(row => ({
              ...row,
              displayName: row.firstName + ' ' + row.lastName,
              age: new Date().getFullYear() - row.birthYear
            }))
            .sort((a, b) => b.age - a.age)
            .slice(0, 10);
          
          const columns = Object.keys(rawData[0] || {})
            .filter(key => !key.startsWith('_'))
            .map(key => ({
              header: key.charAt(0).toUpperCase() + key.slice(1),
              accessor: key
            }));
          
          return (
            <table>
              <thead>
                <tr>
                  {columns.map(col => <th key={col.accessor}>{col.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {processedData.map(row => (
                  <tr key={row.id}>
                    {columns.map(col => <td key={col.accessor}>{row[col.accessor]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        };
      `,
      errors: [
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        const DataTable = ({ rawData }) => {
          const processedData = useMemo(() => rawData
            .filter(row => row.isValid)
            .map(row => ({
              ...row,
              displayName: row.firstName + ' ' + row.lastName,
              age: new Date().getFullYear() - row.birthYear
            }))
            .sort((a, b) => b.age - a.age)
            .slice(0, 10), []);
          
          const columns = Object.keys(rawData[0] || {})
            .filter(key => !key.startsWith('_'))
            .map(key => ({
              header: key.charAt(0).toUpperCase() + key.slice(1),
              accessor: key
            }));
          
          return (
            <table>
              <thead>
                <tr>
                  {columns.map(col => <th key={col.accessor}>{col.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {processedData.map(row => (
                  <tr key={row.id}>
                    {columns.map(col => <td key={col.accessor}>{row[col.accessor]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        };
      `,
            },
          ],
        },
        {
          messageId: 'useMemo',
          suggestions: [
            {
              messageId: 'useMemo',
              output: `
        import { useMemo } from 'react';
        const DataTable = ({ rawData }) => {
          const processedData = rawData
            .filter(row => row.isValid)
            .map(row => ({
              ...row,
              displayName: row.firstName + ' ' + row.lastName,
              age: new Date().getFullYear() - row.birthYear
            }))
            .sort((a, b) => b.age - a.age)
            .slice(0, 10);
          
          const columns = useMemo(() => Object.keys(rawData[0] || {})
            .filter(key => !key.startsWith('_'))
            .map(key => ({
              header: key.charAt(0).toUpperCase() + key.slice(1),
              accessor: key
            })), []);
          
          return (
            <table>
              <thead>
                <tr>
                  {columns.map(col => <th key={col.accessor}>{col.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {processedData.map(row => (
                  <tr key={row.id}>
                    {columns.map(col => <td key={col.accessor}>{row[col.accessor]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        };
      `,
            },
          ],
        },
      ],
      output: `
        import { useMemo } from 'react';
        const DataTable = ({ rawData }) => {
          const processedData = useMemo(() => rawData
            .filter(row => row.isValid)
            .map(row => ({
              ...row,
              displayName: row.firstName + ' ' + row.lastName,
              age: new Date().getFullYear() - row.birthYear
            }))
            .sort((a, b) => b.age - a.age)
            .slice(0, 10), []);
          
          const columns = Object.keys(rawData[0] || {})
            .filter(key => !key.startsWith('_'))
            .map(key => ({
              header: key.charAt(0).toUpperCase() + key.slice(1),
              accessor: key
            }));
          
          return (
            <table>
              <thead>
                <tr>
                  {columns.map(col => <th key={col.accessor}>{col.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {processedData.map(row => (
                  <tr key={row.id}>
                    {columns.map(col => <td key={col.accessor}>{row[col.accessor]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        };
      `,
    },
  ],
});
