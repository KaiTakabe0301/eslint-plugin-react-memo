import type { Rule } from 'eslint';
import type {
  Node,
  FunctionExpression,
  ArrowFunctionExpression,
  ImportDeclaration,
  ImportSpecifier,
} from 'estree';

/**
 * Check if a name is a React hook name
 */
export function isReactHookName(name: string = ''): boolean {
  // 先頭が use + 英数字 の命名を "カスタムフック" とみなす
  return /^use[A-Z0-9].*/.test(name);
}

/**
 * Check if a name is a React component name
 */
export function isReactComponentName(name: string = ''): boolean {
  // 大文字で始まる名前を "Reactコンポーネント" とみなす
  return /^[A-Z]/.test(name);
}

/**
 * Check if a node is a newly created function
 */
export function isNewFunction(
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

/**
 * Check if a node is wrapped with useCallback
 */
export function isUseCallbackWrapped(node: Node | null | undefined): boolean {
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
export function buildUseCallbackWrapper(
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
export function ensureReactImport(
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
