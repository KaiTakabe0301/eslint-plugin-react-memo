# @kaitakabe0301/eslint-plugin-react-memo

[English README](./README.md)

React のカスタムフックとコンポーネント内で作成される関数に `useCallback` の使用を強制し、関数呼び出しやオブジェクト型の値に `useMemo` の使用を強制する ESLint プラグインです。

## 概要

このプラグインは、React アプリケーションのパフォーマンスを最適化するために設計されています。カスタムフックやコンポーネント内で新しく作成される関数や値は、再レンダリング時に異なる参照を持つため、不要な再レンダリングや副作用の再実行を引き起こす可能性があります。このプラグインは、関数を `useCallback` で、関数呼び出しやオブジェクト型の値を `useMemo` でラップすることを強制します。

## インストール

まず、[ESLint](https://eslint.org/) をインストールする必要があります：

```sh
npm install eslint --save-dev
# または
pnpm add -D eslint
```

次に、`@kaitakabe0301/eslint-plugin-react-memo` をインストールします：

```sh
npm install @kaitakabe0301/eslint-plugin-react-memo --save-dev
# または
pnpm add -D @kaitakabe0301/eslint-plugin-react-memo
```

## 使用方法

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

推奨設定を使用する場合：

```javascript
// eslint.config.js
import { flatConfig } from '@kaitakabe0301/eslint-plugin-react-memo';

export default [
  // Other configs...
  flatConfig.configs.recommended,
];
```

### ESLint v8 (Legacy Config)

`.eslintrc` に対して、以下のように `@kaitakabe0301/react-memo` を追加します：

```json
{
  "plugins": ["@kaitakabe0301/react-memo"],
  "rules": {
    "@kaitakabe0301/react-memo/require-use-callback-in-hooks": "error",
    "@kaitakabe0301/react-memo/require-use-memo": "error"
  }
}
```

## ルール

### require-use-callback-in-hooks / require-usecallback

カスタムフックと React コンポーネント内で新しく作成される関数を `useCallback` でラップすることを強制します。

このルールは、カスタムフックやコンポーネント内で作成された関数が、レンダリング間で参照の等価性を保持することを保証し、不要な再レンダリングを防ぎます。

**❌ 間違った例：**

```javascript
// カスタムフック
function useCustomHook() {
  const handler = () => {
    console.log('clicked');
  };
  return handler;
}

// React コンポーネント
function Button({ onClick }) {
  const handleClick = () => {
    console.log('Button clicked');
    onClick();
  };
  return <button onClick={handleClick}>Click me</button>;
}

// アロー関数コンポーネント
const Modal = ({ onClose }) => {
  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return <div onClick={handleBackdropClick}>Modal</div>;
};
```

**✅ 正しい例：**

```javascript
import { useCallback } from 'react';

// カスタムフック
function useCustomHook() {
  const handler = useCallback(() => {
    console.log('clicked');
  }, []);
  return handler;
}

// React コンポーネント
function Button({ onClick }) {
  const handleClick = useCallback(() => {
    console.log('Button clicked');
    onClick();
  }, [onClick]);
  return <button onClick={handleClick}>Click me</button>;
}

// アロー関数コンポーネント
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

カスタムフックと React コンポーネント内で関数呼び出しやオブジェクト型の値（オブジェクト、配列、JSX要素）を `useMemo` でラップすることを強制します。

このルールは以下の2つのパターンを検出します：

1. 関数呼び出し - 再計算コストや参照の安定性が必要な場合
2. オブジェクト型の値 - 毎回新しい参照が作成されるのを防ぐ

**❌ 間違った例：**

```javascript
// カスタムフック
function useCustomHook(value) {
  const result = calculateSomething(value);
  const config = { theme: 'dark', size: 'large' };
  const items = [1, 2, 3];
  return { result, config, items };
}

// React コンポーネント
function MyComponent({ data }) {
  const processed = processData(data);
  const styles = { padding: '10px', border: '1px solid #ccc' };
  const element = <div>Hello</div>;
  return <div style={styles}>{element}</div>;
}
```

**✅ 正しい例：**

```javascript
import { useMemo } from 'react';

// カスタムフック
function useCustomHook(value) {
  const result = useMemo(() => calculateSomething(value), [value]);
  const config = useMemo(() => ({ theme: 'dark', size: 'large' }), []);
  const items = useMemo(() => [1, 2, 3], []);
  return { result, config, items };
}

// React コンポーネント
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

両方のルールは自動修正機能を提供します。ESLint は自動的に：

1. 関数を `useCallback` で、値を `useMemo` でラップします
2. 必要に応じて React から `useCallback` や `useMemo` をインポートします
3. 空の依存配列 `[]` を初期値として設定します

```sh
# 自動修正を実行
eslint --fix .
```

## このルールを使用すべき場合

このルールは以下のような場合に特に有用です：

1. パフォーマンスが重要なアプリケーションを構築している場合
2. カスタムフックが依存関係として使用される関数を返す場合
3. 一貫したメモ化パターンを強制したい場合
4. チームで作業しており、コード品質を維持したい場合
5. メモ化された子コンポーネントに関数を props として渡すコンポーネントがある場合
6. コンポーネントツリー全体で不要な再レンダリングを防ぎたい場合

## 開発

### セットアップ

```sh
# 依存関係のインストール
pnpm install

# 開発時のビルド
pnpm build
```

### スクリプト

```sh
# TypeScript のコンパイル
pnpm build

# テストの実行
pnpm test

# テストをウォッチモードで実行
pnpm test:watch

# リントの実行
pnpm lint

# フォーマットの実行
pnpm format

# 型チェック
pnpm tsc --noEmit
```

### プロジェクト構造

```
src/
├── rules/
│   ├── require-usecallback/
│   │   ├── index.ts        # ルールの実装
│   │   └── type.ts         # 型定義
│   └── index.ts            # ルールのエクスポート
├── flat-config.ts          # ESLint v9 flat config サポート
└── index.ts                # メインエントリーポイント
```

## 貢献

バグレポートや機能リクエストは、GitHub の Issue でお知らせください。プルリクエストも歓迎します！

### 開発フロー

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

Copyright (c) 2025 Kai Takabe (KaiTakabe0301)
This software is released under the MIT License, see LICENSE.
