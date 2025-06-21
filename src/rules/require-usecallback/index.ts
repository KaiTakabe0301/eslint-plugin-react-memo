import type { Rule } from 'eslint';
import type {
  Node,
  FunctionExpression,
  ArrowFunctionExpression,
  VariableDeclaration,
  ImportDeclaration,
  ImportSpecifier,
  FunctionDeclaration,
} from 'estree';
import { NodeWithParent } from './type';

// ---------------------------------------------------------------------------
// utilities
// ---------------------------------------------------------------------------
function isHookOrComponentName(name: string = ''): boolean {
  // 先頭が use + 英数字 の命名を "カスタムフック" とみなす
  // または、大文字で始まる名前を "Reactコンポーネント" とみなす
  return /^use[A-Z0-9].*/.test(name) || /^[A-Z]/.test(name);
}

function isNewFunction(
  node: Node | null | undefined
): node is FunctionExpression | ArrowFunctionExpression {
  // "新しく生成された" 関数
  return (
    node !== null &&
    node !== undefined &&
    (node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionExpression')
  );
}

function isUseCallbackWrapped(node: Node | null | undefined): boolean {
  // useCallback(…) 呼び出しか
  return (
    node?.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'useCallback'
  );
}

/**
 * useCallbackラッパー文字列を生成
 */
function buildUseCallbackWrapper(
  node: Node,
  sourceCode: Rule.RuleContext['sourceCode']
): { text: string; hookName: string } {
  const original = sourceCode.getText(node);
  return { text: `useCallback(${original}, [])`, hookName: 'useCallback' };
}

/**
 * ファイル内の `import … from 'react'` を解析し、
 * useCallback が未インポートなら Fixer 配列を返す
 */
function ensureReactImport(
  fixer: Rule.RuleFixer,
  sourceCode: Rule.RuleContext['sourceCode'],
  hookName: string
): Rule.Fix[] {
  const program = sourceCode.ast; // ESTree Program
  const reactImport = program.body.find(
    (n): n is ImportDeclaration =>
      n.type === 'ImportDeclaration' && n.source.value === 'react'
  );

  // import が無い場合は先頭に追加
  if (!reactImport) {
    const sourceText = sourceCode.getText();

    // コードが改行で始まるかチェック
    if (sourceText.startsWith('\n')) {
      // 改行で始まる場合、最初の改行の後にインデント付きでimport文を挿入
      const firstNewlineEnd = 1;
      const afterNewline = sourceText.substring(firstNewlineEnd);
      const indentMatch = afterNewline.match(/^[ ]*/);
      const indent = indentMatch ? indentMatch[0] : '';

      return [
        fixer.insertTextAfterRange(
          [0, firstNewlineEnd],
          `${indent}import { ${hookName} } from 'react';\n`
        ),
      ];
    } else {
      // 改行で始まらない場合は単純に先頭に追加
      return [
        fixer.insertTextAfterRange(
          [0, 0],
          `import { ${hookName} } from 'react';\n`
        ),
      ];
    }
  }

  // 既に同 hook が import 済みか？
  const hasNamed = reactImport.specifiers.some(
    (s): s is ImportSpecifier =>
      s.type === 'ImportSpecifier' &&
      'imported' in s &&
      s.imported.type === 'Identifier' &&
      s.imported.name === hookName
  );
  if (hasNamed) return []; // 追加不要

  // ----------------------------------------------------------
  // ① すでに { foo } がある → '... foo }' の直前に `, hookName`
  // ----------------------------------------------------------
  const namedSpecs = reactImport.specifiers.filter(
    (s): s is ImportSpecifier => s.type === 'ImportSpecifier'
  );

  if (namedSpecs.length > 0) {
    // 最後のnamed importを取得
    const lastSpec = namedSpecs[namedSpecs.length - 1];

    // 既存のnamed importに追加
    if (lastSpec) {
      return [fixer.insertTextAfter(lastSpec, `, ${hookName}`)];
    }
  }

  // ----------------------------------------------------------
  // ② default / namespace の場合の処理
  // ----------------------------------------------------------
  const lastSpecifier =
    reactImport.specifiers[reactImport.specifiers.length - 1];

  // namespace import の場合は新しいimport文を追加
  if (lastSpecifier && lastSpecifier.type === 'ImportNamespaceSpecifier') {
    return [
      fixer.insertTextAfter(
        reactImport,
        `\n        import { ${hookName} } from 'react';`
      ),
    ];
  }

  // default import の場合は { hookName } を追加
  if (lastSpecifier) {
    return [fixer.insertTextAfter(lastSpecifier, `, { ${hookName} }`)];
  }

  return [];
}

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

        if (!isHookOrComponentName(name)) return; // カスタムフック・コンポーネント以外は無視

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
