# スタックされたプルリクエストの階層表示

- 作成日: 2026-08-09
- ステータス: ドラフト

## 概要

同一リポジトリ内で、別のオープンプルリクエストの source branch を target branch にしているプルリクエストを親子として扱い、現在の PR カードを階層表示する。たとえば PR #1 の source branch に PR #2 が向き、PR #2 の source branch に PR #3 が向く場合、`PR #1 > PR #2 > PR #3` のツリーとして関係を把握できるようにする。

## 背景・前提（コンテキスト）

- tell は Electron、React、TypeScript で構成された GitHub ダッシュボードで、登録リポジトリのオープン PR を GitHub GraphQL API から取得している。
- PR 一覧は `src/renderer/features/github/pull-requests-panel.tsx` が担当し、owner/repository 単位にグループ化した後、`GitHubPullRequestView` をフラットに並べている。
- 各 PR には既に `sourceBranch`（GraphQL の `headRefName`）と `targetBranch`（`baseRefName`）が含まれており、`src/main/repositories/github/api-repository.ts` から renderer まで受け渡されている。
- PR ごとのカード、リンク、レビュー、チェック、ブランチ情報は `src/renderer/features/github/pull-request-view.tsx` にまとまっているため、カード自体の表示内容は再利用する。
- `docs/CONTEXT.md` と `docs/PLAN.md` は存在しないため、README と既存コードから文脈を補い、本プランは標準書式で記載する。
- 現在の `package.json` には自動テスト用スクリプトやテストフレームワークがなく、検証コマンドは lint、typecheck、build が中心である。

## 要件

- 同一 owner・同一 repository の表示対象 PR について、子の `targetBranch` と親候補の `sourceBranch` が一致したらスタック関係として扱う。
- `PR #1 -> PR #2 -> PR #3` の関係を、PR #1 をルート、PR #2 と PR #3 を順に子とする階層で表示する。
- スタックされていない PR は従来どおり単独の PR カードとして表示する。
- 各階層でも既存の PR カード内容と操作（GitHub リンク、URL コピー、ブランチ、チェック、担当者、レビュー情報）を維持する。
- 現在の owner/repository グループ、Only my PRs フィルター、ソート、再読み込みを維持する。
- フィルターなどにより親 PR が表示対象外の場合、表示対象の子 PR をルートとして残し、一覧から欠落させない。
- スコープ外: GitHub 上での PR 作成・並べ替え、スタック情報の永続化、異なるリポジトリ間の関連付け、閉じた/マージ済みの親 PR の追加取得、折りたたみ UI の追加。

## 確定した論点

- **関係の判定方法**: GitHub GraphQL から既に取得済みの `headRefName` / `baseRefName` を用い、`child.targetBranch === parent.sourceBranch` で判定する。追加 API、本文へのメタデータ記入、命名規約は不要である。
- **判定範囲**: owner/repository ごとに処理する。ブランチ名が同じでもリポジトリをまたいで親子にはしない。
- **フィルターとの順序**: 現行どおり Only my PRs を先に適用し、その結果をソートしてからツリー化する。親がフィルター外でも子を表示でき、フィルターの意味を変更しない。
- **ソートの扱い**: 現在の指定ソート順を各ツリーのルート順および同一親の子同士の順序に反映する。子は親の直後に表示されるため、全 PR の完全なフラットソートよりスタックの連続性を優先する。
- **不完全・異常な関係**: 親候補が表示対象にいなければルートとして扱う。同じ source branch の親候補が複数ある場合は、現在のソート順で先に現れる候補を親とする。循環を検出した場合は再帰を打ち切り、未描画 PR をルートとして描画して全件を一度だけ表示する。
- **データ契約**: 必要な branch 情報は main/renderer 両方の `GitHubApiPullRequest` に既にあるため、IPC や GitHub API のレスポンス型は変更しない。

## 実装方針

renderer 側に、リポジトリ内のソート済み PR 配列を表示用ツリーへ変換する純粋関数を追加する。ノードは `pullRequest` と `children` を持ち、PR ID を基準に一意性と描画済み状態を管理する。

`GitHubPullRequestsPanel` は owner/repository ごとの既存ループ内でこのツリーを構築し、再帰表示コンポーネントへ渡す。再帰表示コンポーネントは `GitHubPullRequestView` をそのまま使い、子階層に左インデントと親子を視認できるガイド線を付ける。階層装飾はテーマの palette/spacing に追従させ、ライト・ダーク両テーマで見えるようにする。

ツリー変換ロジックと再帰描画をパネル本体から分離し、フィルター・ソート・データ取得という既存責務を増やしすぎない構成にする。

## 実装ステップ

1. `src/renderer/features/github/` 配下に、`GitHubApiPullRequest` から表示用 `PullRequestTreeNode` を構築する純粋関数を追加する。repository ごとに source branch の索引を作り、target branch から親を特定して roots/children を構成する。
2. ツリー構築時に、親なし、複数親候補、自己参照、循環を安全に処理し、入力された全 PR が重複なく一度だけ結果へ含まれるようにする。入力順をルートおよび兄弟の表示順として維持する。
3. `GitHubPullRequestsPanel` の repository ごとのフラットな `map` をツリー単位の描画に置き換える。フィルターと `sortPullRequests` は既存順序のまま先に適用し、repository ごとにツリー化する。
4. PR ツリーを再帰表示する renderer コンポーネントを追加し、各ノードで既存の `GitHubPullRequestView` を再利用する。子ノードには深さに応じたインデントと階層ガイドを表示し、長いタイトルや狭いウィンドウでもカードの内容領域が不必要に潰れない上限を設ける。
5. 純粋なツリー変換について、テスト基盤を導入する場合は、単独 PR、3 段スタック、複数の子、複数ルート、親が一覧外、別 repository の同名 branch、複数親候補、自己参照/循環、入力順維持をケース化する。今回テスト基盤を追加しない場合も同じケースを実装時の手動確認項目として残す。
6. `npm run lint` と `npm run typecheck`（必要に応じて `npm run build`）を実行し、既存機能の型・静的検査に回帰がないことを確認する。
7. 開発アプリでライト/ダーク両テーマを確認し、3 段スタック、非スタック PR、複数スタック、Only my PRs で親だけが除外されるケース、各ソート条件、URL コピーとリンク操作を確認する。

## 影響範囲・リスク

- 影響を受けるモジュール: `src/renderer/features/github/pull-requests-panel.tsx`、新規のツリー構築ロジックおよび階層表示コンポーネント。PR カードの階層装飾に必要な場合のみ共通レイアウトコンポーネントを拡張する。
- API/IPC/保存データ: 変更なし。既存の `sourceBranch` と `targetBranch` を利用する。
- リスク: ブランチ名の一致だけでは、特殊な運用で意図しない親子判定が起こり得る。repository 単位に限定し、曖昧な複数候補は決定的な入力順で扱う。
- リスク: フィルターで中間 PR が消えると、残った子は上位スタックとの見た目上のつながりを失う。欠落よりフィルターの一貫性を優先し、残った PR をルート表示する。
- リスク: 深いスタックでインデントがカード幅を圧迫する。インデント幅を小さくし、表示上の最大インデントを設けつつ、ツリー走査自体は任意の深さを扱えるようにする。
- リスク: 循環や重複描画で無限再帰する可能性がある。PR ID の visiting/rendered 集合で再帰を防ぎ、最後に未描画ノードをルートへ補完する。
- リスク: PR 取得上限は現状 repository ごとに 100 件であり、親 PR が取得範囲外なら関係を復元できない。この場合は対象 PR を単独ルートとして表示し、既存の取得上限変更は本要件に含めない。

## 未確定事項

- 自動テスト基盤が現状ないため、この機能だけを契機にテストランナーを導入するかは実装時に判断する。導入しない場合は型検査・lint・build と上記の手動確認を受け入れ条件とする。
