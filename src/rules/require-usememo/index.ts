import type { Rule } from 'eslint';
import type {
  Node,
  FunctionExpression,
  ArrowFunctionExpression,
  VariableDeclaration,
  FunctionDeclaration,
  CallExpression,
  ObjectExpression,
  ArrayExpression,
} from 'estree';
import { NodeWithParent } from './type';
import {
  isReactHookName,
  isReactComponentName,
  ensureReactImport,
} from '../utils';

// ---------------------------------------------------------------------------
// helper functions
// ---------------------------------------------------------------------------

/**
 * Check if a node is a value that should be memoized
 */
function shouldBeMemoized(
  node: Node | null | undefined
): node is CallExpression | ObjectExpression | ArrayExpression {
  if (!node) return false;

  // パターン1: 関数呼び出し
  if (node.type === 'CallExpression') {
    // React Hooksは除外
    if (node.callee.type === 'Identifier') {
      const name = node.callee.name;
      if (
        name.startsWith('use') ||
        name === 'useState' ||
        name === 'useEffect' ||
        name === 'useCallback' ||
        name === 'useMemo' ||
        name === 'useRef' ||
        name === 'useContext' ||
        name === 'useReducer' ||
        name === 'useLayoutEffect'
      ) {
        return false;
      }
      // console系は除外
      if (name === 'console' || name.startsWith('console.')) {
        return false;
      }
    }
    // console.logなどのメソッド呼び出しも除外
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'console'
    ) {
      return false;
    }
    return true;
  }

  // パターン2: オブジェクト型の値
  // JSXElementとJSXFragmentはESTreeの標準型にないため、型アサーションでチェック
  const nodeType = (node as unknown as { type: string }).type;
  return (
    node.type === 'ObjectExpression' ||
    node.type === 'ArrayExpression' ||
    nodeType === 'JSXElement' ||
    nodeType === 'JSXFragment'
  );
}

/**
 * Check if a node is wrapped with useMemo
 */
function isUseMemoWrapped(node: Node | null | undefined): boolean {
  return (
    node?.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'useMemo'
  );
}

/**
 * Build useMemo wrapper string
 */
function buildUseMemoWrapper(
  node: Node,
  sourceCode: Rule.RuleContext['sourceCode']
): { text: string; hookName: string } {
  const original = sourceCode.getText(node);
  // オブジェクトリテラルの場合は括弧で囲む必要がある
  if (node.type === 'ObjectExpression') {
    return { text: `useMemo(() => (${original}), [])`, hookName: 'useMemo' };
  }
  return { text: `useMemo(() => ${original}, [])`, hookName: 'useMemo' };
}

// ---------------------------------------------------------------------------
// rule
// ---------------------------------------------------------------------------
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce wrapping function calls and object-type values with useMemo inside custom hooks and components.',
      recommended: false,
      url: 'https://github.com/kaitakabe0301/eslint-plugin-react-memo/blob/main/docs/rules/require-use-memo.md',
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      useMemo:
        'Wrap this value with useMemo inside custom hooks and components.',
    },
    schema: [],
  },
  create(context: Rule.RuleContext) {
    return {
      // すべての関数 (宣言 / 式 / アロー) を捕捉
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        const typedNode = node as Rule.Node &
          NodeWithParent &
          (FunctionDeclaration | FunctionExpression | ArrowFunctionExpression);

        // 関数名を取得
        const name =
          (typedNode.type === 'FunctionDeclaration' && typedNode.id?.name) ||
          (typedNode.parent?.type === 'VariableDeclarator' &&
          typedNode.parent.id &&
          typedNode.parent.id.type === 'Identifier'
            ? typedNode.parent.id.name
            : undefined);

        if (!isReactHookName(name) && !isReactComponentName(name)) return;

        // フック本体の直下文を走査
        const body = typedNode.body;
        if (!body || body.type !== 'BlockStatement') return;

        body.body.forEach((statement: Node) => {
          // 変数宣言だけを見る
          if (statement.type !== 'VariableDeclaration') return;

          (statement as VariableDeclaration).declarations.forEach(decl => {
            const init = decl.init;
            if (!init || isUseMemoWrapped(init) || !shouldBeMemoized(init))
              return;

            context.report({
              node: init,
              messageId: 'useMemo',
              fix: fixer => {
                const src = context.sourceCode ?? context.getSourceCode();
                const { text, hookName } = buildUseMemoWrapper(init, src);
                return [
                  fixer.replaceText(init, text),
                  ...ensureReactImport(fixer, src, hookName),
                ];
              },
              suggest: [
                {
                  messageId: 'useMemo',
                  fix: fixer => {
                    const src = context.sourceCode ?? context.getSourceCode();
                    const { text, hookName } = buildUseMemoWrapper(init, src);
                    return [
                      fixer.replaceText(init, text),
                      ...ensureReactImport(fixer, src, hookName),
                    ];
                  },
                },
              ],
            });
          });
        });
      },
    };
  },
};

export = rule;
