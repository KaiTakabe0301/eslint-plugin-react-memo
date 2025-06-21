export const createRequireUseCallbackTestCases = () => ({
  validUseCallbackCases: [
    // カスタムフック内でuseCallbackを使用している場合は問題なし
    {
      code: `
        import { useCallback } from 'react';
        function useCustomHook() {
          const handler = useCallback(() => {
            console.log('clicked');
          }, []);
          return handler;
        }
      `,
    },
    // カスタムフックでもコンポーネントでもない関数は対象外
    {
      code: `
        function normalFunction() {
          const handler = () => {
            console.log('clicked');
          };
          return handler;
        }
      `,
    },
    // Reactコンポーネント内でuseCallbackを使用している場合は問題なし
    {
      code: `
        import { useCallback } from 'react';
        function Button() {
          const handleClick = useCallback(() => {
            console.log('clicked');
          }, []);
          return <button onClick={handleClick}>Click</button>;
        }
      `,
    },
    // コンポーネントの変数宣言形式でuseCallbackを使用
    {
      code: `
        import { useCallback } from 'react';
        const MyComponent = function() {
          const handler = useCallback(() => {
            console.log('handler');
          }, []);
          return <div onClick={handler}>Click</div>;
        }
      `,
    },
    // オブジェクトや配列は対象外（require-use-memo-in-hooksで処理）
    {
      code: `
        function useCustomHook() {
          const obj = { foo: 'bar' };
          return obj;
        }
      `,
    },
  ],
  invalidUseCallbackCases: [
    // ケース1: React importがない場合 - 新しいimport文を追加
    {
      code: `
        function useCustomHook() {
          const handler = () => {
            console.log('clicked');
          };
          return handler;
        }
      `,
      errors: [
        {
          messageId: 'useCallback',
          suggestions: [
            {
              messageId: 'useCallback',
              output: `
        import { useCallback } from 'react';
        function useCustomHook() {
          const handler = useCallback(() => {
            console.log('clicked');
          }, []);
          return handler;
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useCallback } from 'react';
        function useCustomHook() {
          const handler = useCallback(() => {
            console.log('clicked');
          }, []);
          return handler;
        }
      `,
    },
    // ケース2: 既存のnamed importがある場合 - 既存のnamed importに追加
    {
      code: `
        import { useState } from 'react';
        function useCustomHook() {
          const [state, setState] = useState(null);
          const handler = () => {
            setState('new state');
          };
          return handler;
        }
      `,
      errors: [
        {
          messageId: 'useCallback',
          suggestions: [
            {
              messageId: 'useCallback',
              output: `
        import { useState, useCallback } from 'react';
        function useCustomHook() {
          const [state, setState] = useState(null);
          const handler = useCallback(() => {
            setState('new state');
          }, []);
          return handler;
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useState, useCallback } from 'react';
        function useCustomHook() {
          const [state, setState] = useState(null);
          const handler = useCallback(() => {
            setState('new state');
          }, []);
          return handler;
        }
      `,
    },
    // ケース3: 通常の関数式も対象
    {
      code: `
        function useCustomHook() {
          const handler = function() {
            console.log('clicked');
          };
          return handler;
        }
      `,
      errors: [
        {
          messageId: 'useCallback',
          suggestions: [
            {
              messageId: 'useCallback',
              output: `
        import { useCallback } from 'react';
        function useCustomHook() {
          const handler = useCallback(function() {
            console.log('clicked');
          }, []);
          return handler;
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useCallback } from 'react';
        function useCustomHook() {
          const handler = useCallback(function() {
            console.log('clicked');
          }, []);
          return handler;
        }
      `,
    },
    // ケース4: Reactコンポーネント内の関数（import無し）
    {
      code: `
        function Button() {
          const handleClick = () => {
            console.log('clicked');
          };
          return <button onClick={handleClick}>Click</button>;
        }
      `,
      errors: [
        {
          messageId: 'useCallback',
          suggestions: [
            {
              messageId: 'useCallback',
              output: `
        import { useCallback } from 'react';
        function Button() {
          const handleClick = useCallback(() => {
            console.log('clicked');
          }, []);
          return <button onClick={handleClick}>Click</button>;
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useCallback } from 'react';
        function Button() {
          const handleClick = useCallback(() => {
            console.log('clicked');
          }, []);
          return <button onClick={handleClick}>Click</button>;
        }
      `,
    },
    // ケース5: Reactコンポーネント内の関数（既存import有り）
    {
      code: `
        import { useState } from 'react';
        function TodoItem({ todo }) {
          const [done, setDone] = useState(false);
          const handleToggle = () => {
            setDone(!done);
          };
          return (
            <div>
              <input type="checkbox" checked={done} onChange={handleToggle} />
              {todo.text}
            </div>
          );
        }
      `,
      errors: [
        {
          messageId: 'useCallback',
          suggestions: [
            {
              messageId: 'useCallback',
              output: `
        import { useState, useCallback } from 'react';
        function TodoItem({ todo }) {
          const [done, setDone] = useState(false);
          const handleToggle = useCallback(() => {
            setDone(!done);
          }, []);
          return (
            <div>
              <input type="checkbox" checked={done} onChange={handleToggle} />
              {todo.text}
            </div>
          );
        }
      `,
            },
          ],
        },
      ],
      output: `
        import { useState, useCallback } from 'react';
        function TodoItem({ todo }) {
          const [done, setDone] = useState(false);
          const handleToggle = useCallback(() => {
            setDone(!done);
          }, []);
          return (
            <div>
              <input type="checkbox" checked={done} onChange={handleToggle} />
              {todo.text}
            </div>
          );
        }
      `,
    },
    // ケース6: アロー関数形式のコンポーネント
    {
      code: `
        const Modal = ({ isOpen, onClose }) => {
          const handleBackdropClick = (e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          };
          return isOpen ? <div onClick={handleBackdropClick}>Modal</div> : null;
        };
      `,
      errors: [
        {
          messageId: 'useCallback',
          suggestions: [
            {
              messageId: 'useCallback',
              output: `
        import { useCallback } from 'react';
        const Modal = ({ isOpen, onClose }) => {
          const handleBackdropClick = useCallback((e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }, []);
          return isOpen ? <div onClick={handleBackdropClick}>Modal</div> : null;
        };
      `,
            },
          ],
        },
      ],
      output: `
        import { useCallback } from 'react';
        const Modal = ({ isOpen, onClose }) => {
          const handleBackdropClick = useCallback((e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }, []);
          return isOpen ? <div onClick={handleBackdropClick}>Modal</div> : null;
        };
      `,
    },
  ],
});
