# Mac App Store と LP（tell.noncore.net）で配布できるようにする

- 作成日: 2026-10-02
- ステータス: ドラフト

## 概要

現在 GitHub Releases だけで配布している tell を、Mac App Store からもインストールできるようにし、
あわせて配布導線（App Store / GitHub Releases の DMG / Windows exe）をまとめたランディングページ
（LP）を `https://tell.noncore.net/` で公開する。LP は App Store Connect が必須とする
サポート URL・プライバシーポリシー URL の受け皿も兼ねる。

## 背景・前提（コンテキスト）

- tell は Electron 34 + React + TypeScript、`electron-builder` 25.1.8 で Windows portable exe と
  macOS Universal DMG を生成し、GitHub Release の publish をトリガーに
  `.github/workflows/release.yml` が成果物をアップロードしている。
- electron-builder 設定は `electron-builder.base.yml`（共通）を `electron-builder.yml`（ローカル:
  未署名 ZIP）と `electron-builder.release.yml`（CI: Developer ID 署名 + 公証 DMG）が `extends`
  している。`mac.target` は配列結合される仕様のため各派生側で定義する、という既存の判断がある。
- 署名まわりの Secrets（`CSC_LINK` / `CSC_KEY_PASSWORD` / `APPLE_ID` /
  `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID`）は設定済みで、Developer ID 署名・公証・
  staple・Gatekeeper 検証まで CI で通っている（v0.1.0）。
- アプリは GitHub API（`https://api.github.com`）への HTTPS 通信、`electron-store` による設定保存
  （PAT を含む）、`shell.openExternal`、`globalShortcut`（デバッグ用）を使う。カメラ・マイク・
  Documents・Downloads へのアクセスは無いが、テンプレート由来の `NS*UsageDescription` が
  `mac.extendInfo` に残っている。ファイルシステムやネイティブモジュールへの依存は無く、
  App Sandbox 化の障壁は小さい。
- `package.json` の `author` は `example.com`、`homepage` は `https://electron-vite.org` と
  テンプレートのまま。リポジトリに `LICENSE` ファイルは無い。
- 既存の別アプリ LP（`fv/site`）はプレーンな静的 HTML / CSS / JS（EN/JA 切替あり）で構成されて
  おり、tell の LP も同じ構成に揃える。ホスティングは Cloudflare Pages の Git 連携を使う。
- `docs/CONTEXT.md`・`docs/PLAN.md` は存在しないため、README / CONTRIBUTING / ビルド設定 /
  Release workflow / 既存プランから文脈を補い、標準書式で記述する。
- `.github/workflows/` を編集するときは `docs/rules/ci-workflow.md`（`${{ }}` を `run:` に直接
  書かない、permissions 最小化、成果物が無いときは失敗させる、検証をアップロードより前に置く）
  に従う。

## 要件

- Mac App Store 向けに App Sandbox 対応・Apple Distribution 署名済みの Universal `.pkg` を生成する。
- Release workflow で `.pkg` をビルド・検証し、App Store Connect へ自動アップロードする。
  審査提出（Submit for Review）は App Store Connect 上で手動で行う。
- App Store 版は無料で配布する。
- 既存の GitHub Releases 配布（Developer ID 署名 DMG / Windows portable exe）はそのまま維持する。
- リポジトリ直下 `site/` に静的 LP を置き、Cloudflare Pages（Git 連携、Root directory `site`）で
  `https://tell.noncore.net/` として公開する。
- LP は機能紹介・スクリーンショット・ダウンロード導線（Mac App Store / DMG / Windows exe）・
  サポート（GitHub Issues）・プライバシーポリシーページを持ち、EN/JA を切り替えられる。
- README / CONTRIBUTING を新しい配布形態とリリース手順に合わせて更新する。
- スコープ外: Microsoft Store 配布、有料化・アプリ内課金、自動更新（electron-updater）の導入、
  既存 DMG 版から App Store 版への設定データ移行、PAT の暗号化保存（`safeStorage`）、
  LP の独自デザインシステム構築、既存リリース成果物の差し替え。

## 確定した論点

### ユーザー確認で決まった事項

- **配布チャネルは Mac App Store + LP**: Microsoft Store は証明書・Partner Center 登録が別途必要で
  工数が大きいため今回は含めない。
- **LP は同リポジトリ `site/` + Cloudflare Pages（Git 連携）**: 既存の別アプリ LP と同じ運用に
  揃える。Cloudflare 側でリポジトリを接続し Root directory を `site` にするだけで、リポジトリに
  CI やシークレットを追加しない。
- **ドメインは `tell.noncore.net`**: App ID `net.noncore.tell` と対応するサブドメインを使う。
  App Store Connect のサポート URL / プライバシーポリシー URL もこのドメイン配下にする。
- **App Store 提出は CI でビルド + アップロードまで自動**: 審査提出は App Store Connect で手動。
- **価格は無料**: Paid Apps Agreement や税務情報の登録は不要。

### 調査で確定した事項

- **MAS 用の electron-builder 設定を別ファイル `electron-builder.mas.yml` に分離する**:
  MAS ビルドは Developer ID ビルドと署名 ID・entitlements・Hardened Runtime の有無・公証の
  要否がすべて異なる。`mac.target` が配列結合される既存の制約もあるため、base を `extends` する
  3 つ目の派生設定として独立させ、CI では `--config electron-builder.mas.yml` で指定する。
- **entitlements は MAS 専用に 3 つ用意する**: App Sandbox は Mac App Store の必須要件。
  `build/entitlements.mas.plist`（`app-sandbox` + `network.client`）、
  `build/entitlements.mas.inherit.plist`（`app-sandbox` + `inherit`: Helper プロセス用）、
  `build/entitlements.mas.loginhelper.plist`（`app-sandbox`）を追加する。既存の
  `build/entitlements.mac.plist`（JIT 等、Hardened Runtime 用）は DMG ビルドで引き続き使う。
  アプリは GitHub API 通信以外に外部リソースを使わないため、追加の entitlement は不要。
- **Hardened Runtime・公証は MAS ビルドでは使わない**: MAS は Apple が署名し直すため
  Developer ID 公証の対象外。`hardenedRuntime: false`、`notarize: false` とし、検証も
  `stapler` / `spctl` ではなく `codesign --verify` と entitlements・`pkgutil --check-signature`
  で行う。
- **Provisioning Profile を埋め込む**: Mac App Store 配布用の Provisioning Profile を
  Developer ポータルで発行し、CI では base64 の Secret から `build/embedded.provisionprofile`
  に復元して `provisioningProfile` で指定する。ファイル自体は `.gitignore` に入れる。
- **`CFBundleVersion`（ビルド番号）はアップロードごとに一意にする**: App Store Connect は同じ
  バージョン・ビルド番号の再アップロードを拒否する。electron-builder の `buildVersion` に
  `GITHUB_RUN_NUMBER` を渡し、`CFBundleShortVersionString` は `package.json` の version のまま
  とする。
- **App Store 向けの Info.plist 項目を追加する**: `LSApplicationCategoryType`
  （`public.app-category.developer-tools`）は App Store 審査の必須項目。
  `ITSAppUsesNonExemptEncryption: false` を入れ、HTTPS 以外の暗号を使わないアプリとして
  アップロードごとの輸出コンプライアンス質問を省く。
- **未使用の `NS*UsageDescription` を削除する**: カメラ・マイク・Documents・Downloads は
  アプリで使っておらず、App Sandbox でも許可しない。残しておくと審査で用途を問われるため、
  base 設定から外す（DMG 版にも影響するが挙動の変化は無い）。
- **MAS の `.pkg` は GitHub Release に添付しない**: App Store 以外から入手した MAS ビルドは
  レシート検証で起動できず、ユーザーが誤って取得すると混乱する。Actions artifact にのみ残す。
- **App Store Connect API キーでアップロードする**: 既存の Apple ID + App 用パスワード方式では
  なく、API キー（Key ID / Issuer ID / `.p8`）を使う。CI での認証が 2FA に依存せず、
  アップロードコマンド（`xcrun altool --upload-package` もしくは `iTMSTransporter`）で
  共通に使える。
- **MAS 用の署名証明書は既存の Developer ID とは別**: 「Apple Distribution」（アプリ署名）と
  「Mac Installer Distribution」（pkg 署名）の 2 枚が必要。既存の `CSC_LINK` とは別の
  Secret（`MAS_CSC_LINK` / `MAS_CSC_KEY_PASSWORD`）として登録し、ジョブ単位で使い分ける。
- **App Sandbox で設定ファイルの保存先が変わる**: `electron-store` の保存先が
  `~/Library/Containers/net.noncore.tell/...` 配下になり、DMG 版の
  `~/Library/Application Support/tell` とは共有されない。アプリの動作には影響しないため
  移行はスコープ外とし、LP と README で「別アプリとして設定される」旨を注記する。
- **LP の技術構成は `fv/site` と同じプレーンな静的サイト**: ビルド不要で Cloudflare Pages の
  Git 連携にそのまま乗る。スクリーンショットは `docs/images/capture_light.png` /
  `capture_dark.png` を流用し、アイコンは `resources/icon.png` を使う。
- **Mac App Store へのリンクは App Store Connect の App レコード作成後に確定する**:
  `https://apps.apple.com/app/id{Apple ID}` の数値 ID はレコード作成時に決まるため、LP 実装
  より先に App レコードを作成する。
- **プライバシーポリシーの内容**: tell は開発者側のサーバーを持たず、ユーザーが入力した PAT と
  GitHub から取得した情報は端末内（electron-store）にのみ保存され、送信先は GitHub API だけ。
  App Store Connect の App Privacy は「データを収集しない」で申告できる。

## 実装方針

MAS 配布は「設定ファイルの追加 → CI ジョブの追加 → App Store Connect 側の準備」の 3 層に
分け、既存の DMG リリースフローを一切変えずに並列ジョブとして足す。LP は Cloudflare Pages が
`site/` をそのまま配信する前提で、リポジトリ側はコンテンツだけを持つ。

CI の MAS ジョブは、既存の `build-macos` と同じく `check-version` の後に走る。Secrets 検証 →
証明書と Provisioning Profile の復元 → `electron-builder --mac --config electron-builder.mas.yml`
→ `.pkg` 検証 → App Store Connect アップロード → artifact 保存、の順にし、検証に失敗した
`.pkg` はアップロードしない。GitHub Release には書き込まないので permissions は
`contents: read` のままにする。

## 実装ステップ

### A. アプリ側（MAS ビルド設定）

1. `build/entitlements.mas.plist`・`build/entitlements.mas.inherit.plist`・
   `build/entitlements.mas.loginhelper.plist` を追加する。`app-sandbox` と `network.client`
   （本体のみ）を有効にし、それ以外の権限は付けない。
2. `electron-builder.base.yml` から未使用の `NS*UsageDescription` を削除し、
   `mac.category: public.app-category.developer-tools` と
   `extendInfo.ITSAppUsesNonExemptEncryption: false` を追加する（DMG 版と共通）。
3. `electron-builder.mas.yml` を新規作成する。`extends: electron-builder.base.yml`、
   `mac.target: [{ target: mas, arch: [universal] }]`、`mas` セクションに
   `identity: ''`（証明書自動検出）、`hardenedRuntime: false`、`notarize: false`、
   `entitlements` / `entitlementsInherit` / `entitlementsLoginHelper` に手順 1 のファイル、
   `provisioningProfile: build/embedded.provisionprofile`、
   `artifactName: ${name}-${version}-mas.${ext}` を定義する。`electronDownload.mirror` は
   release 設定と同じ公式配布元に上書きする。
4. `.gitignore` に `build/embedded.provisionprofile` を追加する。
5. `package.json` の `author`・`homepage`（`https://tell.noncore.net`）をテンプレート値から
   修正する。electron-builder が生成する copyright 表記にも反映される。
6. ローカルで `electron-builder --mac --config electron-builder.mas.yml --dir` を実行し、
   実効設定（`mas` ターゲット・Universal・entitlements のパス・`LSApplicationCategoryType`・
   `ITSAppUsesNonExemptEncryption`）と生成 `Info.plist` を確認する。証明書が無い環境では署名
   段階で止まることを許容し、設定の妥当性確認までを目的とする。

### B. Apple 側の準備（手動・CI 実装の前提）

7. Developer ポータルで App ID `net.noncore.tell` に App Sandbox を有効化し、
   「Apple Distribution」「Mac Installer Distribution」証明書と Mac App Store 用 Provisioning
   Profile を発行する。証明書は 1 つの `.p12` にまとめて base64 化する。
8. App Store Connect で App レコード（名称 tell、Bundle ID `net.noncore.tell`、価格 無料、
   カテゴリ Developer Tools）を作成し、Apple ID（数値）を控える。App Store Connect API キー
   （App Manager 以上）を発行し、Key ID / Issuer ID / `.p8` を控える。
9. GitHub Secrets に `MAS_CSC_LINK`・`MAS_CSC_KEY_PASSWORD`・`MAS_PROVISIONING_PROFILE`
   （base64）・`ASC_API_KEY_ID`・`ASC_API_ISSUER_ID`・`ASC_API_KEY`（`.p8` base64）・
   `ASC_APP_APPLE_ID` を登録する。

### C. CI（Release workflow）

10. `.github/workflows/release.yml` に `build-mas` ジョブ（`needs: check-version`、
    `runs-on: macos-latest`、`permissions: contents: read`）を追加する。先頭で手順 9 の
    Secrets を既存の `build-macos` と同じ方式で検証する。
11. Provisioning Profile と API キーを Secret から復元するステップを置く
    （`build/embedded.provisionprofile`、`~/private_keys/AuthKey_<KEY_ID>.p8`）。値は
    `env:` 経由で渡し、`run:` に `${{ }}` を直接書かない。
12. `BUILD_NUMBER=$GITHUB_RUN_NUMBER` を渡して
    `npm run build:mac -- --config electron-builder.mas.yml` を実行し、
    `dist/tell-<version>-mas.pkg` のパスを単一の step output に解決する。
13. 検証ステップ: `pkgutil --check-signature` で pkg 署名、`pkgutil --expand` で中の
    `tell.app` を取り出し、`lipo -archs` で x86_64 / arm64、`codesign --verify --deep --strict`、
    `codesign -d --entitlements :-` で `com.apple.security.app-sandbox` が true であること、
    `plutil` で `CFBundleVersion` が `GITHUB_RUN_NUMBER` と一致することを確認する。
    失敗時はアップロードに進まない。
14. アップロードステップ: `xcrun altool --upload-package` に `--apple-id`・`--bundle-id`・
    `--bundle-version`・`--bundle-short-version-string`・`--apiKey`・`--apiIssuer` を渡して
    App Store Connect へ送る。runner の Xcode で `altool` のアップロードが使えない場合は
    `iTMSTransporter -m upload` に切り替える（実装時に runner 上で確認する）。
15. `.pkg` を Actions artifact（`macos-mas-build`、`retention-days: 7`）として保存する。
    GitHub Release へは添付しない。

### D. LP（`site/`）

16. `site/index.html`・`site/style.css`・`site/app.js`・`site/images/` を `fv/site` と同じ
    構成で作成する。セクションは Hero / Features（README の主要機能）/ Screenshots
    （Light / Dark）/ Download（Mac App Store バッジ・GitHub Releases の DMG と Windows exe）/
    Support（GitHub Issues）/ Footer。EN/JA 切替を `data-en` / `data-ja` 属性で実装する。
17. `site/privacy.html` にプライバシーポリシー（EN/JA）を作成する。収集データなし、
    PAT と取得情報は端末内保存のみ、通信先は GitHub API のみ、問い合わせ先は GitHub Issues、
    を明記する。
18. Download セクションの Mac App Store リンクは手順 8 で得た Apple ID で
    `https://apps.apple.com/app/id<Apple ID>` を指す。バッジは Apple の公式マーケティング
    リソースの SVG を使う。GitHub Releases へのリンクはファイル名にバージョンが含まれるため
    `releases/latest` ページを指す。
19. Cloudflare Pages でリポジトリを接続し、Production branch `main`、Root directory `site`、
    ビルドコマンド無しで作成する。カスタムドメイン `tell.noncore.net` を追加し、
    `https://tell.noncore.net/` と `/privacy.html` が配信されることを確認する。
20. App Store Connect の App 情報に サポート URL `https://tell.noncore.net/`、
    プライバシーポリシー URL `https://tell.noncore.net/privacy.html` を設定する。

### E. ドキュメント・検証

21. README の Installation に Mac App Store からのインストールを追加し、LP の URL を載せる。
    App Store 版と DMG 版は設定を共有しない旨を注記する。
22. CONTRIBUTING の設定ファイル一覧に `electron-builder.mas.yml` を追加し、Release Process に
    MAS ジョブで必要な Secrets、App Store Connect でのビルド選択と審査提出、スクリーンショット
    等のストア掲載情報の更新手順を追記する。`site/` の更新は `main` への push で Cloudflare
    Pages が自動反映する旨も書く。
23. `npm run fix`・`npm test`・`npm run build` が通ること、ローカルの `npm run build:mac`
    （未署名 ZIP）が従来どおり成功することを確認する。
24. 検証用リリース（例: `v0.2.0`）を publish し、`build-windows` / `build-macos` /
    `build-mas` の 3 ジョブがすべて成功して App Store Connect にビルドが現れることを確認する。
    TestFlight（Mac）で配布し、別の Mac で App Store 経由インストール相当の起動・GitHub 連携・
    設定保存を確認してから審査に提出する。

## 影響範囲・リスク

- 影響を受けるファイル: `electron-builder.base.yml`、`electron-builder.mas.yml`（新規）、
  `build/entitlements.mas*.plist`（新規）、`.gitignore`、`package.json`、
  `.github/workflows/release.yml`、`site/**`（新規）、`README.md`、`CONTRIBUTING.md`。
- 依存関係: 新規 npm 依存は不要。macOS runner 標準の `codesign` / `pkgutil` / `lipo` /
  `plutil` / `xcrun altool`（または `iTMSTransporter`）を使う。
- リスク: `altool --upload-package` が runner の Xcode で非推奨・削除されている可能性がある。
  手順 14 のとおり `iTMSTransporter` を代替として実装時に確定する。
- リスク: electron-builder が `mas` + `universal` の組み合わせで Provisioning Profile や
  `ElectronTeamID` を正しく埋め込まない場合、App Sandbox のコンテナ作成に失敗して起動しない。
  手順 13 で entitlements と Info.plist を検査し、TestFlight で実機起動を確認する。
- リスク: 同じバージョンで Release workflow を再実行すると `CFBundleVersion` は変わるが
  `CFBundleShortVersionString` は同じため、App Store Connect 側で同一バージョンに複数ビルドが
  並ぶ。審査提出時に正しいビルドを選ぶ運用とし、CONTRIBUTING に明記する。
- リスク: App Sandbox 下で `electron-store` の保存先が変わるため、DMG 版からの乗り換えで設定が
  初期化されたように見える。README / LP に注記して回避する（データ移行はスコープ外）。
- リスク: PAT を平文で `config.json` に保存している点を審査で指摘される可能性がある。
  サンドボックスのコンテナ内に閉じているため致命的ではないが、指摘された場合は
  `safeStorage` による暗号化を後続 issue として対応する。
- リスク: `NS*UsageDescription` 削除は DMG 版の `Info.plist` にも影響する。該当 API を使って
  いないことはコードで確認済みで、挙動の変化は無い。
- リスク: Cloudflare Pages の設定はリポジトリ外（ダッシュボード）にあり、再現手順が残らない。
  CONTRIBUTING に設定値（Root directory / branch / ドメイン）を記録する。
- リスク: `LICENSE` ファイルが無いため LP フッターや App Store の説明でライセンスを示せない。
  ライセンスの選定はユーザー判断が必要（下記）。

## 未確定事項

- リポジトリのライセンス（`LICENSE` ファイル未作成）。LP フッターのリンク先として必要になる
  ため、実装着手時に確定する。確定しない場合は LP からライセンス表記を省く。
- App Store 掲載用スクリーンショット（1280×800 以上、Light / Dark）の撮り直しが必要か。
  既存の `docs/images/capture_*.png`（1012px 幅）はサイズ要件を満たさない可能性があるため、
  審査提出前に確認する。
- アップロードコマンドの最終形（`altool --upload-package` か `iTMSTransporter`）は runner の
  Xcode で確認してから決める。
