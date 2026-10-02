# アプリアイコンを新デザイン（ベル）で作成し、各プラットフォーム向けに生成する

- 作成日: 2026-10-02
- ステータス: ドラフト

## 概要

現在の「青の角丸四角に白の t」のアイコンを、GitHub や PR に依存しない「通知アプリ」を表す
ベルのモチーフで作り直す。デザインは Pencil（`.pen`）でリポジトリ管理し、書き出した
マスター画像からスクリプトで macOS（icns）/ Windows（ico）/ アプリ内・README・LP 用の
PNG を再現可能に生成する。あわせて、App Store 提出に必要な 1024px を含めた資産構成に
整える。

## 背景・前提（コンテキスト）

- tell は Electron + React + TypeScript、`electron-builder` 25.1.8 でパッケージングしている。
  アイコンの参照先は `electron-builder.base.yml` の `win.icon: build/icon.ico`、
  `mac.icon: build/icon.png`、メインプロセスの `@resources/icon.png?asset`
  （`BrowserWindow` の `icon`。開発時の macOS では `build/icon.png` を `nativeImage` で読む）、
  README の `resources/icon.png`。
- 既存資産はすべて 512×512 の PNG から作られており、ベクターの元データは無い。
  `build/icon.icns` には `512x512@2x`（1024px）が含まれておらず、Mac App Store 提出
  （issue #180〜#184）で必要になる 1024px を満たしていない。`build/icon.ico` は 16 / 32 / 48 /
  256 のみ。
- `src/renderer/assets/icon.png` はレンダラーから参照されておらず未使用。`build/icon-sizes/`
  は `.gitignore`（`build/*` のうち `icon.png` / `icon.ico` / `icon.icns` /
  `entitlements.mac.plist` だけ追跡）の対象で、手元にしか無い。
- 全プラットフォームで同じ画像を使っているため、macOS の Dock では Apple ガイドライン
  （角丸四角の周囲に約 10% の透明余白）に沿った他アプリより大きく見える。
- アプリのテーマカラーは primary `#1976d2`（light `#4791db` / dark `#115293`）、
  secondary `#2196f3`、warning `#ff9800`（`src/renderer/theme.ts`）。
- LP（issue #182）と App Store の掲載（#184）でもアイコンを使うため、両方に渡せる
  フルサイズ版（余白なし）が必要。
- Pencil は MCP でこのセッションに接続されているが、利用には Pencil のデスクトップアプリが
  起動している必要がある（今回のプラン作成時点では未起動で接続できなかった）。
  `export_nodes` の出力は PNG / JPEG / WEBP / PDF で、SVG 書き出しは無い。
- ローカルには `rsvg-convert`、`magick`（ImageMagick）、`sips`、`iconutil` がある。
- `docs/CONTEXT.md`・`docs/PLAN.md` は存在しないため、README / ビルド設定 / 既存プランから
  文脈を補い、標準書式で記述する。

## 要件

- 「通知アプリ」を表すベルのモチーフで、文字を含まない新しいアイコンをデザインする。
  基調色はテーマカラーの青系とする。
- デザインの元データは Pencil の `.pen` ファイルとしてリポジトリに置き、以後の修正は
  そのファイルを起点にする。
- 1024×1024 のマスター PNG を 2 種類書き出す。
  - フルサイズ版（余白なし・角丸四角いっぱい）: Windows ico、アプリ内ウィンドウアイコン、
    README、LP、App Store 掲載用
  - macOS 版（Apple ガイドラインの余白付き）: icns と macOS Dock 用
- スクリプト 1 本で `build/icon.icns`（16〜1024、@2x 含む）、`build/icon.ico`
  （16 / 24 / 32 / 48 / 64 / 128 / 256）、`build/icon.png`、`resources/icon.png` を再生成できる。
- `electron-builder` の macOS 側が icns（余白付き）を、Windows 側が ico（フルサイズ）を使う。
- 16px まで縮小してもベルと判別できる（細い線や小さい装飾に依存しない）。
- 未使用の `src/renderer/assets/icon.png` を削除する。
- スコープ外: macOS 26 のレイヤーアイコン（Icon Composer の `.icon`。electron-builder 25 が
  未対応）、ダークモード / ティント対応の別バリアント、メニューバー（Tray）アイコン、
  アプリ内 UI アイコンの変更、DMG 背景画像、LP・App Store 側の掲載作業自体（#182 / #184）。

## 確定した論点

### ユーザー確認で決まった事項

- **新デザインにする**: GitHub や PR に依存しない「通知アプリ」を表す。
- **モチーフはベル**: 通知の定番で小さいサイズでも識別しやすく、tell → bell の音の
  つながりもある。
- **デザインツールは Pencil**: MCP 接続済みで、`.pen` をリポジトリ管理でき、デザイン案の
  作成からエクスポートまでこのセッションで完結する。
- **macOS は余白付き、他はフルサイズ**: Apple ガイドラインに合わせ、Dock 上で他アプリと
  大きさを揃える。

### 調査で確定した事項

- **マスターは PNG 1024px を正とし、ベクターは `.pen` に閉じる**: Pencil は SVG を書き出せない
  ため、ラスタ生成の入力は 1024px PNG にする。1024px あれば icns の最大（512@2x）と
  App Store の要件を満たし、それ以下のサイズは縮小で作れる。
- **`.pen` と書き出した 1024px PNG の両方をコミットする**: `.pen` が無いと修正できず、
  PNG が無いと Pencil を起動せずに資産を再生成できない。`design/app-icon.pen` と
  `design/exports/icon-full-1024.png` / `icon-macos-1024.png` を追跡する。
- **macOS 版の寸法は Apple のテンプレートに従う**: 1024px キャンバスに 824px の角丸四角
  （コーナー半径 ≒ 185px）を中央配置し、周囲 100px を透明にする。フルサイズ版は同じ
  図柄を 1024px いっぱいの角丸四角（半径 ≒ 230px、Windows / Web で自然に見える比率）に
  描く。両者は同じベル図形を共有し、背景の角丸四角だけ差し替える。
- **`mac.icon` は `build/icon.icns` を明示する**: electron-builder は `build/icon.png` を
  渡すと自前で icns 化するが、余白付き版を使っていることを設定から読み取れるよう、
  生成した icns を直接指定する。`build/icon.png` は開発時の macOS Dock 用に余白付き版
  （1024px）を置く。
- **`resources/icon.png` はフルサイズ版 512px**: `BrowserWindow` の `icon` は Windows /
  Linux のウィンドウ・タスクバー用で、余白なしが適切。README もこのファイルを参照しており
  現状と同じ見え方になる。
- **ico は 256px まで、icns は 1024px まで**: Windows の推奨サイズ（16 / 24 / 32 / 48 / 64 /
  128 / 256）を `magick` で 1 ファイルにまとめる。icns は `iconutil` が受け付ける
  `icon_16x16.png` 〜 `icon_512x512@2x.png` の 10 枚を `sips` で作って変換する。
- **生成はシェルスクリプトにする**: 既存の npm scripts は `electron-vite` / `electron-builder`
  のみで、画像処理の依存を npm に増やさない。`scripts/generate-icons.sh` を置き、
  `magick` / `sips` / `iconutil` の存在チェックを先頭で行う（macOS 前提。icns は macOS で
  しか作れない）。
- **小サイズでの判読性をデザイン要件にする**: ベルは単色のシルエットで、本体・舌（クラッパー）
  の 2 要素までに抑える。通知ドット（warning オレンジ）を添える場合は 16px / 32px で
  潰れないかを書き出して確認し、潰れるなら外す。
- **Pencil の起動は実装時の前提**: MCP は Pencil のデスクトップアプリが起動していないと
  接続できない。作業開始時にユーザーに起動してもらう。

## 実装方針

Pencil で 1024×1024 のフレームを 2 つ（`icon-full` / `icon-macos`）持つ `.pen` を作り、
同じベル図形（コンポーネント化）を角丸四角の背景に載せる。デザインは案を 1〜2 点作って
スクリーンショットでユーザーに確認し、承認後に `export_nodes` で 1024px PNG に書き出す。

書き出した PNG から `scripts/generate-icons.sh` で派生資産をすべて生成し、
`electron-builder.base.yml` の `mac.icon` を icns に向ける。生成物は `build/` と
`resources/` の既存パスに上書きするため、`electron-builder` や `src/main/index.ts` の参照は
`mac.icon` 以外変えない。

## 実装ステップ

1. Pencil を起動してもらい、`design/app-icon.pen` を新規作成する。1024×1024 のフレーム
   `icon-full`（背景: 角丸四角 1024px / 半径 ≒ 230px）と `icon-macos`（背景: 824px /
   半径 ≒ 185px を中央配置、周囲 100px 透明）を作る。
2. ベル図形をコンポーネントとして作り、両フレームに配置する。基調色はテーマの青
   （`#1976d2` → `#2196f3` の緩やかなグラデーション）、ベルは白。通知ドット（`#ff9800`）は
   任意要素として別レイヤーに置く。
3. 候補をスクリーンショットで提示し、ユーザーの承認を得る（この時点で 16px / 32px 相当の
   縮小プレビューも添える）。修正があれば `.pen` 上で反映する。
4. `export_nodes` で両フレームを PNG 書き出しし、`design/exports/icon-full-1024.png` と
   `design/exports/icon-macos-1024.png` に 1024×1024 で保存する（scale は 1024px ちょうどに
   なるよう指定）。寸法とアルファを `magick identify` で確認する。
5. `scripts/generate-icons.sh` を追加する。入力は上記 2 枚、出力は
   `build/icon.icns`（macOS 版から iconset 10 枚 → `iconutil`）、`build/icon.png`
   （macOS 版 1024px）、`build/icon.ico`（フルサイズ版から 7 サイズ → `magick`）、
   `resources/icon.png`（フルサイズ版 512px）。必要コマンドが無ければ失敗させ、
   `set -euo pipefail` で途中失敗を握り潰さない。
6. スクリプトを実行して資産を生成し、`iconutil --convert iconset` の往復で
   `icon_512x512@2x.png` が含まれること、`magick identify build/icon.ico` で 7 サイズが
   あることを確認する。手元の `build/icon-sizes/` は不要になるため削除する。
7. `electron-builder.base.yml` の `mac.icon` を `build/icon.icns` に変更する。
   `src/renderer/assets/icon.png` を削除する。
8. `npm run dev` で macOS の Dock アイコンが余白付きの新デザインになること、
   `npm run build:unpack` で `dist/mac-universal/tell.app` のアイコン（Finder / Dock）と
   Windows 向けビルド（可能なら `build:win`）の exe アイコンが新デザインになることを確認する。
9. README のロゴ表示（`resources/icon.png`）が新デザインで崩れないことを確認し、
   CONTRIBUTING に「アイコンの更新手順」（`.pen` を編集 → 書き出し → `scripts/generate-icons.sh`）
   を追記する。
10. `npm run fix`・`npm test`・`npm run build` が通ることを確認する。

## 影響範囲・リスク

- 影響を受けるファイル: `design/app-icon.pen`（新規）、`design/exports/*.png`（新規）、
  `scripts/generate-icons.sh`（新規）、`build/icon.icns` / `icon.ico` / `icon.png`、
  `resources/icon.png`、`electron-builder.base.yml`、`src/renderer/assets/icon.png`（削除）、
  `CONTRIBUTING.md`。
- 関連 issue: #180〜#184（App Store 配布: 1024px icns と LP・掲載用のフルサイズ版を提供）、
  #186（NSIS インストーラーは `win.icon` をそのまま使う）。
- 依存関係: 新規 npm 依存は無し。生成は macOS 上の `magick` / `sips` / `iconutil` に依存する
  （CI では生成せず、コミット済みの資産を使う現行方式を維持）。
- リスク: Pencil が起動していないと MCP で作業できない。着手時に起動を依頼する。
- リスク: Pencil から SVG を書き出せないため、将来別ツールへ移す場合は `.pen` から描き直しが
  必要になる。1024px PNG を一緒にコミットすることで、資産の再生成だけはツール無しでできる。
- リスク: 書き出しの scale 指定を誤ると 2048px など想定外の寸法になる。手順 4 で寸法を検証する。
- リスク: 余白付き版を Windows や Web に誤って使うと小さく見える。スクリプトで入力と出力の
  対応を固定し、CONTRIBUTING に用途を明記する。
- リスク: ベルの形状が 16px で判別できない。手順 3 で縮小プレビューを確認し、要素を減らす。
- リスク: `mac.icon` の変更で electron-builder の挙動が変わる。手順 8 の `build:unpack` で確認する。

## 未確定事項

- 通知ドットを入れるかどうかは、手順 3 の縮小プレビューを見て決める。
- 配色の最終値（グラデーションの有無・角度）はデザイン案の提示時にユーザーが選ぶ。
