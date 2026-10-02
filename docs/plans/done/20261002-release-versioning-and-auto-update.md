# リリースごとのバージョン管理と、アプリ内アップデートに対応する

- 作成日: 2026-10-02
- ステータス: ドラフト

## 概要

リリースのたびに手で行っている「`npm version` → push → GitHub で Release 作成」を、リリース PR を
起点にタグ・GitHub Release（リリースノート自動生成）まで自動で作られる流れにする。
あわせて、アプリが起動時・定期・手動で新しいバージョンを確認し、GitHub Releases 配布版
（macOS DMG / Windows）では `electron-updater` でバックグラウンドダウンロード → 再起動で
適用できるようにする。App Store 版は App Store の更新に任せる。

## 背景・前提（コンテキスト）

- tell は Electron 34 + React + TypeScript。`electron-builder` 25.1.8 で Windows portable exe と
  macOS Universal DMG（Developer ID 署名・公証済み）を生成し、GitHub Release の publish を
  トリガーに `.github/workflows/release.yml` が成果物をアップロードする。
- バージョンは `package.json` の `version`（現在 0.1.0）が唯一の正。CI の `check-version`
  ジョブがリリースタグ（`v{version}` または `release/v{version}`）と一致することを検証する。
  過去のタグは `v0.0.2` `v0.0.3` `v0.1.0` と `release/v0.0.2` `release/v0.1.0` が混在している。
- リリースノートは GitHub の自動生成（PR タイトル一覧）をそのまま使っており、カテゴリ分けの
  設定（`.github/release.yml`）は無い。`CHANGELOG.md` も無い。
- `main` ブランチにはルールセット「default branch rules」があり、PR 経由でしか変更できない
  （直接 push 不可、`GITHUB_TOKEN` も同様）。レビュー必須人数は 0。
- アプリは `app.getVersion()` を `app:getVersion` IPC で取得し、サイドバー下部に `v{version}`
  を表示している。設定画面は `/settings`（General: テーマ切替のみ）と `/settings/github`。
  通知は `useMessage` + `TSnackbar`、ダイアログは `TDialog`、進捗は `TLinearProgress` が
  `@renderer/components/` にある。文言は `useText` フックで扱う。
- `electron-updater` 6.3.9 は依存に入っているが未使用。`dev-app-update.yml` はテンプレートの
  `example.com` を指したまま。electron-builder の `publish` 設定は無く、`--publish never` で
  ビルドしているため `latest.yml` / `latest-mac.yml` は生成されていない。
- 直前のプラン（`docs/plans/done/20260809-release-macos-dmg.md`）で「自動更新を使わないため
  macOS の ZIP を廃止し DMG のみ配布」と決めている。本プランで自動更新を導入するため、
  この前提は更新する。
- 進行中のプラン（`docs/plans/done/20261002-distribute-app-store-and-lp.md`、issue #180〜#184）で
  Mac App Store 向けの `electron-builder.mas.yml` と `build-mas` ジョブを追加する。MAS ビルドは
  Apple が配布・更新を担うため、`electron-updater` を動かしてはならない。
- `.github/workflows/` の編集は `docs/rules/ci-workflow.md`（`run:` に `${{ }}` を直接書かない、
  permissions 最小化、成果物が無ければ失敗させる、検証をアップロードより前に置く）に従う。
  分岐や状態遷移を含むロジックには `docs/rules/testing.md` に従いテストを付ける。
- `docs/CONTEXT.md`・`docs/PLAN.md` は存在しないため、README / CONTRIBUTING / ビルド設定 /
  Release workflow / 既存プランから文脈を補い、標準書式で記述する。

## 要件

### バージョン管理

- `workflow_dispatch`（patch / minor / major を選択）で `package.json` のバージョンを更新する
  リリース PR が自動作成される。
- リリース PR が `main` にマージされると、タグ `v{version}` と GitHub Release が自動作成され、
  既存のビルド・アップロード処理が走る。成果物がそろうまで Release は Draft のままにし、
  アップロード完了後に公開する。
- リリースノートは GitHub の自動生成を使い、`.github/release.yml` で PR ラベル別
  （新機能 / 不具合修正 / ドキュメント / その他）に分類する。`CHANGELOG.md` は作らない。
- バージョンの正は引き続き `package.json` のみ。タグ形式は `v{version}` に統一する。

### アプリ内アップデート

- GitHub Releases 配布版（macOS DMG / Windows）は、起動時・定期（6 時間ごと）・設定画面の
  手動ボタンで新バージョンを確認する。
- 新バージョンがあればバックグラウンドでダウンロードし、完了後に「今すぐ再起動 / 後で」を
  提示する。「後で」の場合は次回終了時に適用する。
- 設定画面（General）に現在のバージョン・更新状態・「アップデートを確認」ボタン・ダウンロード
  進捗・「再起動して更新」ボタン・リリースノートへのリンクを表示する。サイドバーのバージョン
  表示には更新待ちを示すバッジを付ける。
- Windows の配布形式を portable exe から NSIS インストーラー（`tell-{version}-win-setup.exe`）
  に切り替え、`electron-updater` で自動更新できるようにする。portable は廃止する。
- macOS は DMG（手動インストール用）に加えて、`electron-updater` が必要とする Universal ZIP を
  再び生成・アップロードする。
- Mac App Store 版・開発モードでは更新確認を行わず、設定画面には「App Store で更新されます」
  等の状態を表示する。
- スコープ外: プレリリース（beta）チャネル、更新確認の ON/OFF 設定、特定バージョンのスキップ
  （永続化）、差分更新の最適化、Windows コード署名、`CHANGELOG.md` の生成、App Store 版の
  更新通知、MAS ビルド（#180〜#184 側で対応）。

## 確定した論点

### ユーザー確認で決まった事項

- **リリース PR 方式で自動化する**: `main` が PR 必須のため、バージョン更新はリリース PR として
  作り、マージをリリースの承認とみなす。マージ後のタグ・Release 作成は自動。
- **変更履歴は GitHub Release ノートのみ**: `.github/release.yml` でラベル別に分類し、アプリからは
  Release ページへリンクする。`CHANGELOG.md` は持たない。
- **Windows は NSIS インストーラーに切り替える**: portable exe は `electron-updater` が自己更新を
  サポートしないため、アプリ内アップデートの要件を満たすにはインストーラー配布にする。
- **自動ダウンロード → 再起動を促す**: 検知時にバックグラウンドでダウンロードし、完了後に
  再起動を促す。「後で」は次回終了時に適用（`autoInstallOnAppQuit`）。

### 調査で確定した事項

- **Release 作成は `release.yml` 内のジョブとして行う**: `GITHUB_TOKEN` で作成した Release は
  `release: published` イベントのワークフローを起動しない（GitHub の仕様）。別ワークフローで
  Release だけ作ると既存のビルドが走らないため、`release.yml` に `push`（`main`、
  `paths: package.json`）トリガーと `create-release` ジョブを追加し、同じワークフロー内で
  Release 作成 → ビルド → アップロード → 公開まで行う。既存の `release: published` トリガーは
  手動での再ビルド用に残す。
- **Release は Draft で作り、成果物アップロード後に公開する**: 公開済み Release に成果物が
  順次追加されると、`electron-updater` が `latest-mac.yml` だけ存在して ZIP が無い瞬間を
  見てしまう。Draft は未認証クライアントから見えないため、全成果物がそろってから
  `gh release edit --draft=false` で公開する。
- **タグ形式は `v{version}` に統一する**: `electron-updater` の GitHub プロバイダーはタグ名から
  バージョンを解釈し、`v` プレフィックス付きを想定している。`release/v...` 形式はタグの
  自動作成では使わず、`check-version` の互換処理は残す。
- **electron-builder の `publish` 設定を base に置く**: `latest.yml` / `latest-mac.yml` は
  `publish` プロバイダーが設定されているときにだけ生成される。Windows ジョブはローカルと同じ
  `electron-builder.yml` を使うため、base に `publish: github（owner: pkshimizu, repo: tell）`
  を置く。アップロードは引き続き `--publish never` + `gh release upload` で行い、CI の
  アップロード経路を変えない。MAS ターゲットは更新ファイルを生成しないため影響しない。
- **macOS は DMG + ZIP の両方を配布する**: `electron-updater` は macOS で ZIP を要求する。
  DMG は手動インストール用、ZIP は更新用として `electron-builder.release.yml` の `mac.target`
  に両方を定義し、`dmg` / `zip` / `zip.blockmap` / `latest-mac.yml` をアップロードする。
  前プランの「ZIP 廃止」判断は自動更新導入により更新する。
- **Universal ビルドで更新する**: 既存の Universal 構成を維持する。`electron-updater` は
  `latest-mac.yml` の Universal エントリをそのまま扱える。
- **Windows は未署名のまま NSIS を使う**: 現在の portable も未署名で SmartScreen 警告が出ており、
  NSIS に変えても状況は変わらない。`electron-updater` は `publisherName` を設定しない限り
  署名検証を行わないため、未署名でも更新は動く。Windows 署名は別件とする。
- **更新を無効化する条件をメインプロセスで判定する**: `process.mas`（App Store 版）、
  `is.dev`（開発モード）では `electron-updater` を初期化せず、状態 `unsupported`（理由付き）を
  レンダラーに返す。portable 判定（`PORTABLE_EXECUTABLE_DIR`）は廃止するため入れない。
- **状態遷移を純粋なモジュールに分けてテストする**: `electron-updater` のイベント
  （`checking-for-update` / `update-available` / `update-not-available` / `download-progress` /
  `update-downloaded` / `error`）から UI 向け状態（`idle` / `checking` / `downloading` /
  `ready` / `up-to-date` / `error` / `unsupported`）への変換と、定期チェックの判定を
  `electron` 非依存の関数にし、`docs/rules/testing.md` に従って vitest で検証する。
- **リリースノートは本文を描画せずリンクする**: GitHub プロバイダーから取れる
  `releaseNotes` は HTML で、レンダラーに流し込むと XSS 面のリスクがある。
  `https://github.com/pkshimizu/tell/releases/tag/v{version}` へのリンクに留める。
- **「後で」はセッション内だけ記憶する**: スキップしたバージョンの永続化は要件外。
  ダイアログを閉じたら同じバージョンについては再表示せず、`autoInstallOnAppQuit` で
  終了時に適用する。`electron-store` の変更は不要。
- **レンダラーへの状態通知は push 型 IPC を追加する**: 既存の preload は `invoke` のみ。
  `update:status` を `webContents.send` で配信し、preload に `ipcRenderer.on` を使った
  `onStatus(callback)`（解除関数を返す）を追加する。
- **`dev-app-update.yml` は GitHub プロバイダーに書き換える**: 開発中に更新 UI を確認したい
  場合に `forceDevUpdateConfig` で使えるようにする。既定では開発モードで更新確認しない。
- **MAS プラン（#180〜#184）との整合**: `electron-builder.mas.yml` は base の `publish` を
  継承するが、`mas` ターゲットは更新ファイルを生成しないため影響しない。Release の公開
  （`publish-release` ジョブ）は `build-windows` と `build-macos` の完了だけを待ち、
  `build-mas` は独立させる（App Store 側の失敗で GitHub 配布を止めない）。

## 実装方針

リリース自動化は 2 つのワークフローに分ける。`prepare-release.yml` は人が起動して
リリース PR を作るだけ、`release.yml` はマージ（`package.json` の変更を含む `main` への push）
を検知して Draft Release 作成 → 各 OS ビルド → 検証 → アップロード → 公開を一本で行う。
既存の `check-version` / `build-windows` / `build-macos` の構造と検証は維持し、Release を
参照する箇所をイベント由来のタグから `create-release` ジョブの出力に差し替える。

アプリ側は `src/main/services/update-service.ts` に `electron-updater` を閉じ込め、
`src/main/services/update-state.ts` に純粋な状態変換を置く。IPC は既存の
`settings:*` / `theme:*` と同じ `ipcMain.handle` + `{ success, data, error }` 形式で
`update:getStatus` / `update:check` / `update:install` を追加し、状態変化は `update:status`
で push する。レンダラーは `useUpdate` フックで状態を購読し、設定画面の About カードと
サイドバーのバッジ、ダウンロード完了時のダイアログに反映する。

## 実装ステップ

### A. リリースノートとリリース PR

1. `.github/release.yml` を追加し、ラベル `enhancement` → 新機能、`bug` → 不具合修正、
   `documentation` → ドキュメント、その他 → その他、ラベル `release` の PR は除外、と定義する。
   リポジトリに `release` ラベルを作成する。
2. `.github/workflows/prepare-release.yml` を追加する。`workflow_dispatch` で `bump`
   （patch / minor / major）を受け取り、`main` を checkout → `npm version <bump>
--no-git-tag-version` → ブランチ `release/v{version}` に「バージョンを {version} に更新」で
   コミット → push → `gh pr create`（ラベル `release`、本文に
   `gh api .../releases/generate-notes` で生成したノートのプレビュー）。permissions は
   `contents: write` と `pull-requests: write`。値は `env:` 経由で渡す。
3. 既に `v{version}` タグがある場合は PR を作らず失敗させる（同じバージョンの二重リリース防止）。

### B. Release の自動作成と公開（`release.yml`）

4. `release.yml` のトリガーに `push`（`branches: [main]`、`paths: [package.json]`）を追加する。
   `create-release` ジョブ（`permissions: contents: write`）で `package.json` のバージョンを
   読み、タグ `v{version}` が無ければ `gh release create v{version} --draft --generate-notes
--target "$GITHUB_SHA"` で Draft Release を作る。既に存在する場合（手動作成や再実行）は
   作らずそのまま使う。`tag` と `version` を output にする。
5. `check-version` を `create-release` の output を使う形に改め、`release: published` 起動時は
   従来どおりイベントのタグから、`push` 起動時は `create-release` のタグから検証する。
   後続ジョブの `RELEASE_TAG` 参照をすべてこの output に差し替える。
6. `publish-release` ジョブ（`needs: [build-windows, build-macos]`、`contents: write`）を追加し、
   Draft なら `gh release edit "$TAG" --draft=false` で公開する。`release: published` 起動時は
   何もしない。`build-mas`（#183 で追加）は `needs` に含めない。

### C. 配布形式と更新ファイル

7. `electron-builder.base.yml` に `publish: [{ provider: github, owner: pkshimizu, repo: tell }]`
   を追加する。`win.target` を `portable` から `nsis`（x64）に変え、`portable` セクションを
   `nsis` セクション（`artifactName: ${name}-${version}-win-setup.${ext}`、既定の oneClick）に
   置き換える。
8. `electron-builder.release.yml` の `mac.target` に `zip`（universal）を追加し、
   `zip` 側の `artifactName` を `${name}-${version}-universal-mac.${ext}` にそろえる。
9. `release.yml` の Windows ジョブで `dist/tell-{version}-win-setup.exe`・`.exe.blockmap`・
   `latest.yml` を、macOS ジョブで DMG に加えて `.zip`・`.zip.blockmap`・`latest-mac.yml` を
   アップロードする。各ファイルはパスを一意に確定し、無ければ失敗させる。DMG 内 app の
   既存検証に加え、`latest-mac.yml` が ZIP のファイル名・バージョンを参照していることを確認する。
10. `dev-app-update.yml` を `provider: github / owner: pkshimizu / repo: tell` に書き換える。

### D. メインプロセス

11. `src/main/services/update-state.ts` に、`electron-updater` のイベント → UI 状態の変換、
    定期チェックの間隔判定、「後で」を選んだバージョンの抑止判定を純粋関数で実装し、
    `update-state.test.ts` で各遷移・境界（error 後の再チェック、同一バージョンの再通知抑止、
    `unsupported` からは遷移しない）をテストする。
12. `src/main/services/update-service.ts` を追加する。`process.mas` / `is.dev` なら
    `unsupported` で初期化を終える。それ以外は `autoUpdater` に `autoDownload: true`、
    `autoInstallOnAppQuit: true`、`logger: electron-log` を設定し、イベントを
    `update-state` で状態に変換してすべての `BrowserWindow` に `update:status` を送る。
    `check()`（手動 / 定期）、`install()`（`quitAndInstall`）、`getStatus()` を公開する。
13. `src/main/index.ts` でアプリ ready 後 10 秒で初回チェック、以降 6 時間ごとに `check()` を
    呼ぶ。IPC `update:getStatus` / `update:check` / `update:install` を既存の
    `{ success, data, error }` 形式で追加する。
14. `src/preload/index.ts` に `update.getStatus` / `update.check` / `update.install` /
    `update.onStatus(callback)`（解除関数を返す）を追加し、`index.d.ts` に `UpdateStatus` 型と
    `UpdateAPI` を定義する。

### E. レンダラー

15. `src/renderer/hooks/update.ts`（`useUpdate`）を追加し、`getStatus` で初期化、`onStatus` で
    購読し、`check` / `install` を返す。
16. `src/renderer/features/settings/update-card.tsx` を追加し、`/settings`（General）に
    About カードとして配置する。現在のバージョン、状態文言、「アップデートを確認」ボタン、
    ダウンロード進捗（`TLinearProgress`）、「再起動して更新」ボタン、リリースノートリンク
    （`TLink` → Release ページ）、`unsupported` 時の説明（App Store で更新 / 開発モード）を
    表示する。文言は `useText` に追加する。
17. `src/renderer/features/system/side-bar.tsx` のバージョン表示に、`ready` 状態のときバッジを
    付け、クリックで `/settings` へ遷移させる。
18. `src/renderer/features/system/update-dialog.tsx` を追加し、`ready` になった初回に
    「v{version} の準備ができました。今すぐ再起動 / 後で」を `TDialog` で表示する。
    「後で」はセッション内で同じバージョンを再表示しない。`__root.tsx` に配置する。
19. `update:check` の手動実行で `up-to-date` / `error` になった場合は `useMessage` で
    スナックバー通知する（自動チェックでは通知しない）。

### F. ドキュメントと検証

20. CONTRIBUTING の Release Process を「`Prepare Release` ワークフローを起動 → リリース PR を
    レビュー・マージ → 自動で Release が公開される」に書き換え、タグ形式を `v{version}` のみに
    する。配布成果物一覧を NSIS インストーラー・DMG・ZIP・更新ファイルに更新し、
    手動で Release を作る場合の挙動（`release: published` での再ビルド）も記載する。
21. README の Installation を Windows インストーラーに合わせて更新し、アプリ内アップデートの
    説明（GitHub Releases 版は自動、App Store 版は App Store）を追加する。
    `electron-builder.*.yml` と CLAUDE.md の「Distributed artifacts」記述も合わせる。
22. `npm run fix`・`npm test`・`npm run build`、ローカルの `npm run build:win` /
    `npm run build:mac` が成功し、`dist/` に `latest*.yml` が生成されることを確認する。
23. 検証リリースを 2 回行う（例: `v0.2.0` → `v0.2.1`）。1 回目で `Prepare Release` → PR マージ →
    Draft 作成 → ビルド → 公開の流れと成果物一覧を確認し、`v0.2.0` を macOS / Windows に
    インストールする。2 回目でアプリ内に更新が検知・ダウンロードされ、再起動後に `v0.2.1` に
    なること、「後で」→ 終了で適用されること、設定画面の手動チェックが動くことを確認する。

## 影響範囲・リスク

- 影響を受けるファイル: `.github/release.yml`（新規）、`.github/workflows/prepare-release.yml`
  （新規）、`.github/workflows/release.yml`、`electron-builder.base.yml`、
  `electron-builder.release.yml`、`dev-app-update.yml`、`src/main/index.ts`、
  `src/main/services/update-service.ts` / `update-state.ts`（新規）、`src/preload/index.ts` /
  `index.d.ts`、`src/renderer/hooks/update.ts`（新規）、`src/renderer/features/settings/`、
  `src/renderer/features/system/`、`src/renderer/routes/settings/index.tsx` / `__root.tsx`、
  `README.md`、`CONTRIBUTING.md`、`CLAUDE.md`。
- 依存関係: 新規 npm 依存は不要（`electron-updater` は既存）。NSIS は electron-builder が同梱。
- リスク: `GITHUB_TOKEN` で作った PR には `pull_request` トリガーのワークフローが走らない。
  現在 PR 用 CI は無いため影響しないが、将来 CI を追加する場合はリリース PR だけ手動再実行
  か PAT / GitHub App が必要になる。CONTRIBUTING に注記する。
- リスク: ルールセットの `require_last_push_approval` 等により、リリース PR のマージに追加の
  承認操作が必要になる可能性がある。初回の検証リリースで確認し、必要ならルールセットの
  bypass か承認手順を CONTRIBUTING に記載する。
- リスク: ビルドが途中で失敗すると Draft Release が残る。再実行で `create-release` は既存の
  Draft を再利用するため、修正 PR のマージ後にやり直せる。古い Draft の手動削除手順を記載する。
- リスク: `electron-updater` は Draft を見ないが、公開前に `latest-mac.yml` の内容が誤っている
  と全ユーザーの更新が失敗する。手順 9 の yml 検証と、手順 23 の 2 段階リリースで確認する。
- リスク: Windows の配布形式変更で既存 portable 利用者は手動で乗り換える必要がある。
  リリースノートと README で案内する。portable 版はアプリ内から新バージョンを検知しない
  （更新ファイルは NSIS 用のみ）。
- リスク: macOS の自動更新は Developer ID 署名済みのビルド同士でのみ成立する。ローカルの
  未署名ビルドで検証できないため、必ず CI 成果物で検証する。
- リスク: `latest-mac.yml` と ZIP の再導入で macOS ジョブのアップロード対象が増え、
  アップロード漏れが更新失敗につながる。各ファイルを一意に確定し、無ければ失敗させる。
- リスク: 6 時間ごとのチェックは GitHub へのアクセスを増やす。`electron-updater` の GitHub
  プロバイダーは API ではなく `github.com` のリリースページを参照するため、レート制限の
  影響は小さい。
- リスク: `autoInstallOnAppQuit` は終了時に更新を適用するため、終了が普段より遅く感じられる。
  ダイアログで「後で選ぶと終了時に適用される」ことを明記する。

## 未確定事項

- `electron-builder` の `generate-notes` と `.github/release.yml` のカテゴリ分けが Draft 作成時の
  `--generate-notes` に反映されるかは実装時に確認する（反映されない場合は公開時に
  `gh release edit --notes` で再生成する）。
- NSIS の `oneClick` / `perMachine` などインストーラー挙動の細部は既定値で始め、利用者からの
  要望があれば調整する。
