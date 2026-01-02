# ダークモード実装ガイド

## 概要

このドキュメントでは、Tellアプリケーションのダークモード機能について説明します。

## 機能

- 🌙 **ダークモード**: 目に優しい暗いテーマ
- ☀️ **ライトモード**: 明るい標準テーマ
- 🖥️ **システム連動**: OSの設定に自動で追従
- 💾 **設定の保存**: ユーザーの選択を記憶

## 使用方法

### ユーザー向け

1. アプリケーション右上のテーマ切り替えボタンをクリック
2. 以下の3つのモードから選択：
   - ライトモード
   - ダークモード
   - システム設定に従う

### 開発者向け

#### テーマコンテキストの使用

```typescript
import { useTheme } from '@renderer/contexts/theme-context'

function MyComponent() {
  const { mode, setMode, currentTheme } = useTheme()

  // 現在のテーマを取得
  console.log(currentTheme) // 'light' or 'dark'

  // テーマを変更
  setMode('dark')
}
```

#### カスタムコンポーネントでのテーマ対応

```css
/* ライトモード */
[data-theme='light'] .my-component {
  background-color: #ffffff;
  color: #000000;
}

/* ダークモード */
[data-theme='dark'] .my-component {
  background-color: #1e1e1e;
  color: #ffffff;
}
```

## ファイル構成

- `/src/renderer/contexts/theme-context.tsx` - テーマコンテキストプロバイダー
- `/src/renderer/components/theme/theme-toggle.tsx` - テーマ切り替えコンポーネント
- `/src/renderer/styles/dark-theme.css` - ダークモードスタイル定義
- `/src/renderer/utils/theme-utils.ts` - テーマ関連ユーティリティ関数

## 技術仕様

### カラーパレット

#### ライトモード
- Primary: `#1976d2`
- Background: `#ffffff`
- Surface: `#f5f5f5`
- Text: `#000000`

#### ダークモード
- Primary: `#90caf9`
- Background: `#121212`
- Surface: `#1e1e1e`
- Text: `#ffffff`

### ストレージ

テーマ設定は`localStorage`に保存され、アプリケーション再起動時にも設定が維持されます。

```javascript
localStorage.getItem('theme-preference') // 'light' | 'dark' | 'system'
```

## テスト

```bash
# テストの実行
npm test src/renderer/utils/__tests__/theme-utils.test.ts
```

## 今後の改善予定

- [ ] アニメーショントランジション
- [ ] カスタムテーマの作成機能
- [ ] テーマのエクスポート/インポート
- [ ] より詳細なカラーカスタマイズ