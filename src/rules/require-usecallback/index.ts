import type { Rule } from 'eslint';
import type {
  Node,
  FunctionExpression,
  ArrowFunctionExpression,
  VariableDeclaration,
  FunctionDeclaration,
} from 'estree';
import { NodeWithParent } from './type';
import {
  isReactHookName,
  isReactComponentName,
  isNewFunction,
  isUseCallbackWrapped,
  buildUseCallbackWrapper,
  ensureReactImport,
} from '../utils';

// ---------------------------------------------------------------------------
// rule
// ---------------------------------------------------------------------------
const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce wrapping new functions with useCallback inside custom hooks and components.',
      recommended: false,
      url: 'https://github.com/your-org/eslint-plugin-react-hooks-best-practices/blob/main/docs/rules/require-use-callback-in-hooks.md',
    },

    fixable: 'code',
    hasSuggestions: true,
    messages: {
      useCallback:
        'Wrap this function with useCallback inside custom hooks and components.',
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

        if (!isReactHookName(name) && !isReactComponentName(name)) return; // カスタムフック・コンポーネント以外は無視

        // フック本体の直下文を走査
        const body = typedNode.body;
        if (!body || body.type !== 'BlockStatement') return;

        body.body.forEach((statement: Node) => {
          // ① 変数宣言だけを見る
          if (statement.type !== 'VariableDeclaration') return;

          (statement as VariableDeclaration).declarations.forEach(decl => {
            const init = decl.init;
            if (!init || isUseCallbackWrapped(init) || !isNewFunction(init))
              return;

            context.report({
              node: init,
              messageId: 'useCallback',
              fix: fixer => {
                // // ESLint v8/v9 互換性のため
                const src = context.sourceCode ?? context.getSourceCode();
                // const src = context.sourceCode;
                const { text, hookName } = buildUseCallbackWrapper(init, src);
                return [
                  // 1) 変数初期化子を置換
                  fixer.replaceText(init, text),
                  // 2) 必要に応じて import 追加 / 編集
                  ...ensureReactImport(fixer, src, hookName),
                ];
              },
              suggest: [
                {
                  messageId: 'useCallback',
                  fix: fixer => {
                    // // ESLint v8/v9 互換性のため
                    const src = context.sourceCode ?? context.getSourceCode();
                    // const src = context.sourceCode;
                    const { text, hookName } = buildUseCallbackWrapper(
                      init,
                      src
                    );
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
