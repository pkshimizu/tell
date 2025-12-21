# tell

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Release Process

このプロジェクトでは、GitHub Actionsを使用して自動的にリリースバイナリを生成します。

### リリース手順

1. **バージョンの更新**

   ```bash
   # package.jsonのversionを更新（例: 0.0.1 -> 0.0.2）
   npm version patch  # パッチバージョンアップ
   npm version minor  # マイナーバージョンアップ
   npm version major  # メジャーバージョンアップ
   ```

2. **変更をコミットしてプッシュ**

   ```bash
   git add package.json
   git commit -m "バージョンを0.0.2に更新"
   git push
   ```

3. **GitHubでリリースを作成**
   - GitHubのリポジトリページで "Releases" → "Create a new release" をクリック
   - タグ名を入力（例: `v0.0.2`）
   - リリースタイトルと説明を入力
   - "Publish release" をクリック

4. **自動ビルド**
   - GitHub Actionsが自動的に起動し、以下のバイナリを生成します：
     - Windows: `tell-{version}-setup.exe`
     - macOS: `tell-{version}.dmg`
     - Linux: `tell-{version}.AppImage`, `tell-{version}.snap`, `tell-{version}.deb`
   - 生成されたバイナリは自動的にリリースページにアップロードされます

### バージョン管理

- リリース時には、package.jsonのバージョンとリリースタグが一致していることが自動的にチェックされます
- バージョンが一致していない場合、ワークフローがエラーで終了します
- バージョン番号はSemantic Versioning（`MAJOR.MINOR.PATCH`）に従ってください
- リリースタグは `v{version}` または `release/v{version}` の形式で作成してください（例: `v0.0.2`, `release/v0.0.2`）
