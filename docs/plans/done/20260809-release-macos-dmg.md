# macOSリリースをインストール可能なDMGで配布する

- 作成日: 2026-08-09
- ステータス: ドラフト

## 概要

GitHub Releaseで配布するmacOS向け成果物をZIPからUniversal DMGへ変更する。DMGを開くと`tell.app`と`Applications`フォルダへのリンクが表示され、ユーザーがアプリをApplicationsへドラッグしてインストールできるようにする。署名・Apple公証の検証対象をビルド途中のappだけでなく、実際に配布するDMG内のappまで拡張する。

## 背景・前提（コンテキスト）

- tellはElectron、React、TypeScriptで構成され、`electron-builder` 25.1.8でWindows/macOS成果物を生成している。
- 通常のmacOSビルドは`electron-builder.yml`、リリース時の署名・公証設定は`electron-builder.release.yml`に分離されている。共通設定は実装時に両設定から参照できる基底ファイルへ分離する。
- 現在のmacOS targetはUniversal ZIPで、Release workflowは`dist/*.zip`をGitHub Actions artifactとGitHub Releaseへアップロードしている。
- `v0.1.0`では`tell-0.1.0-universal-mac.zip`の生成、Developer ID Application署名、Apple公証、staple、Gatekeeper判定には成功した。一方、CIの検証対象はZIP生成元の`dist/mac-universal/tell.app`であり、ユーザーが取得する配布ファイルを開いて中身を検証する工程はない。
- READMEはローカルビルド後のappを直接開く手順を案内し、CONTRIBUTINGはリリース成果物としてUniversal DMGを記載している。実装とリリース文書の想定が一致していない。
- `build/`にはアプリアイコンとentitlementsがあり、DMG専用の背景画像はない。electron-builderにはDMG生成に必要な`dmg-builder`が既にlockfile経由で含まれている。
- アプリ内に`electron-updater`の利用実装はなく、Squirrel.Mac向けZIPを同時生成する要件は現時点でない。
- `docs/CONTEXT.md`と`docs/PLAN.md`は存在しないため、README、CONTRIBUTING、ビルド設定、Release workflow、既存プランから文脈を補い、標準書式を使用する。

## 要件

- GitHub ReleaseのmacOS向け配布ファイルをUniversal ZIPからUniversal DMGへ置き換える。
- DMG内に`tell.app`と`Applications`フォルダへのリンクを配置し、ドラッグ＆ドロップでインストールできるようにする。
- DMG内の`tell.app`はIntel（x64）とApple Silicon（arm64）の両方を含むUniversal binaryとする。
- リリース専用設定でDeveloper ID Application署名、Hardened Runtime、entitlements、Apple公証、stapleを維持する。
- GitHub Releaseへアップロードする前に、生成したDMGをマウントし、DMG内のアプリについてアーキテクチャ、コード署名、公証チケット、Gatekeeper受理を検証する。
- GitHub Actions artifactとGitHub ReleaseにはDMGだけをmacOS成果物としてアップロードする。
- DMGのファイル名はバージョンとUniversal版であることが分かる`tell-${version}-universal-mac.dmg`とする。
- 通常のローカル`npm run build:mac`は現状の未署名・非公証ZIPビルドを維持し、リリース時だけDMGを生成する。
- 関連するREADME/CONTRIBUTINGの成果物名とインストール手順を実装に合わせる。
- スコープ外: Mac App Store配布、PKGインストーラー、自動更新の導入、DMGの独自背景デザイン、Windows配布形式の変更、既存`v0.1.0`リリースの成果物差し替え。

## 確定した論点

- **DMGのみを配布する**: アプリ内に自動更新処理がなく、electron-builderがSquirrel.Mac向けに要求するZIPを維持する必要がないため、リリースのmacOS成果物はDMGへ置き換える。
- **リリース設定だけtargetを上書きする**: 要件はリリース配布形式の変更であり、通常のローカルビルドへ署名・公証やDMG作成コストを持ち込まない。`electron-builder.release.yml`の`mac.target`でUniversal DMGを指定する。
- **標準的なドラッグ＆ドロップUIを使う**: DMG専用の背景アセットは追加せず、`contents`で`tell.app`と`/Applications`へのlinkを明示配置する。独自デザインなしでもインストール方法が伝わる最小構成とする。
- **DMG自体は署名しない**: electron-builderのDMG設定ではDMG署名は不要で、公証との組み合わせで不要なエラーを招く旨が示されている。DMG内のappをDeveloper IDで署名・公証する既存方式を維持する。
- **配布物を展開・マウント後に検証する**: ビルドディレクトリのapp検証だけでは、パッケージングやアップロード対象の誤りを検出できない。`hdiutil attach`で実際のDMGを読み取り専用マウントし、その中のappを検証してからアップロードする。
- **Info.plistの追加情報を正しいmap形式にする**: 現在の`mac.extendInfo`は配列で、生成されたInfo.plistに`0`〜`3`の辞書として使用目的文言が入る。DMGからコピーしたappがLaunch Servicesで正しく扱われる前提を固めるため、各`NS*UsageDescription`を`extendInfo`直下のキーへ修正する。

## 実装方針

共通のパッケージ設定を基底ファイルへ分離し、`electron-builder.yml`は通常ビルド用のUniversal ZIP targetと未署名設定、`electron-builder.release.yml`はUniversal DMG targetと署名・公証設定をそれぞれ定義する。electron-builderは継承元と子のtarget配列を結合するため、通常設定を直接継承してtargetだけを置換する構成は採用しない。リリース設定のトップレベル`dmg`には、成果物名、ウィンドウサイズ、アプリアイコンとApplicationsリンクの位置を定義する。

Release workflowではDMGのパスを単一の変数として扱う。ビルド完了後、`hdiutil attach -readonly -nobrowse`でDMGを一時マウントし、マウント内の`tell.app`を対象に`lipo`、`codesign`、`stapler`、`spctl`を実行する。成功・失敗にかかわらず確実にdetachするようshellのtrapを使う。すべての検証に成功したDMGだけをActions artifactとGitHub Releaseへアップロードする。

## 実装ステップ

1. 共通のelectron-builder設定を`electron-builder.base.yml`へ分離し、`mac.extendInfo`を配列からmapへ修正する。カメラ、マイク、Documents、Downloadsの使用目的文言がInfo.plistの正しいトップレベルキーとして出力されるようにする。
2. `electron-builder.yml`と`electron-builder.release.yml`から共通設定を継承する。通常設定はUniversal ZIP、`identity: null`、`notarize: false`を維持し、リリース設定は`dmg`・`universal` targetと既存の署名・公証設定を定義する。
3. 同リリース設定へ`dmg`セクションを追加し、`artifactName: tell-${version}-universal-mac.${ext}`、DMGタイトル、ウィンドウサイズ、アプリアイコンと`/Applications`リンクの座標を定義する。DMG署名は無効のままとする。
4. `.github/workflows/release.yml`のmacOS検証を、生成された`dist/tell-<version>-universal-mac.dmg`をマウントして検証する処理へ変更する。DMGの存在と一意性を確認し、`lipo -archs`でx86_64/arm64、`codesign --verify --deep --strict`で署名、`xcrun stapler validate`で公証チケット、`spctl --assess --type exec`でGatekeeper受理を検証する。
5. DMGマウント処理に一時マウントポイントと`trap`によるdetach/後始末を設け、検証失敗時にもrunnerへマウント状態を残さない。DMG内に`tell.app`とApplicationsリンクが存在することも検査する。
6. macOSのActions artifactとGitHub Release upload対象を`dist/*.zip`から検証済みの単一DMGへ変更し、ZIPやblockmapなど想定外のファイルをアップロードしない。
7. READMEにDMGを開いて`tell.app`をApplicationsへドラッグするインストール手順を追加し、CONTRIBUTINGの自動生成成果物を現行workflow（Windows portable EXE、macOS Universal DMG）と実際のファイル名に合わせる。
8. electron-builder 25.1.8の設定schemaで通常/リリース両設定を検証し、通常設定がZIP・未署名・非公証、リリース設定がDMG・Universal・署名必須・公証有効になる実効設定を確認する。`plutil`で生成Info.plistの使用目的キーも確認する。
9. `npm test`、`npm run lint`、`npm run typecheck`、`npm run build`を実行し、アプリコードに回帰がないことを確認する。資格情報なしのローカル環境では通常の`npm run build:mac`が引き続き成功することを確認する。
10. GitHub Secretsを設定したrelease workflowで検証用リリースを実行し、DMG生成、DMG内appのUniversal構成、署名、公証、staple、Gatekeeper、artifact/release uploadがすべて成功することを確認する。別のmacOS環境でDMGをダウンロードし、マウント、Applicationsへのコピー、初回起動まで手動確認する。

## 影響範囲・リスク

- 影響を受けるファイル: `electron-builder.base.yml`、`electron-builder.yml`、`electron-builder.release.yml`、`.github/workflows/release.yml`、`README.md`、`CONTRIBUTING.md`。
- 依存関係: 新規npm依存は不要。既存のelectron-builder/dmg-builderとmacOS標準の`hdiutil`、`lipo`、`codesign`、`xcrun stapler`、`spctl`を利用する。
- リスク: electron-builderの継承設定でbaseのZIP targetが残り、DMGとZIPの両方が生成される可能性がある。実効設定とdist内成果物を検査し、uploadを単一の期待DMGへ限定する。
- リスク: DMGのapp名、volume名、マウントパスに空白や動的値が入るとshell処理が壊れる可能性がある。パスを常にquoteし、`hdiutil -plist`または明示した一時マウントポイントで対象を決定する。
- リスク: 検証途中で失敗するとDMGがマウントされたままになる。trapでdetachを保証する。
- リスク: DMGウィンドウの座標によってアプリとApplicationsリンクが重なり、インストール方法が分かりにくくなる。標準サイズで左右に分け、実際にFinderで開いて確認する。
- リスク: `mac.extendInfo`の構造修正は生成Info.plistを変える。意図した4つの使用目的キー以外に差分がないことを生成物で確認する。
- リスク: 配布形式をZIPからDMGへ変更すると、ZIPを直接参照している外部利用者やスクリプトは影響を受ける。`v0.1.0`は変更せず、次バージョンのリリースノートで配布形式変更を明記する。
- リスク: DMG内のアプリを検証しても、ユーザー環境固有のGatekeeper・権限問題は完全には再現できない。CI検証に加えて別macOS環境でのダウンロードから初回起動までを受け入れ確認に含める。

## 未確定事項

- なし。DMGの独自背景やブランドデザインが必要になった場合は、インストール機能とは分離して後続対応とする。
