// リリースワークフロー（prepare-release.yml / release.yml）の判定ロジック。
// GitHub API の取得とリリースの作成・更新はワークフロー側の gh が行い、ここでは
// 取得済みのデータから「何をすべきか」だけを決める。依存パッケージは使わない
// （npm ci を実行しないジョブから呼ぶため）。

import { appendFileSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/

/** `x.y.z` を数値の配列にする。形式が違えば null。 */
export function parseVersion(version) {
  const match = VERSION_PATTERN.exec(version ?? '')
  return match ? match.slice(1).map(Number) : null
}

/** a < b なら負、a > b なら正、等しければ 0。 */
export function compareVersions(a, b) {
  const [pa, pb] = [parseVersion(a), parseVersion(b)]
  if (!pa || !pb) throw new Error(`Invalid version: ${!pa ? a : b}`)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

/** タグ名からバージョンを取り出す。`v1.2.3` と互換の `release/v1.2.3` を受け付ける。 */
export function tagVersion(tag) {
  const version = (tag ?? '').replace(/^release\//, '').replace(/^v/, '')
  return parseVersion(version) ? version : null
}

/** `gh api --paginate --slurp` の結果（ページの配列）を 1 つの配列にする。 */
export function flattenPages(pages) {
  return Array.isArray(pages) && pages.every(Array.isArray) ? pages.flat() : pages
}

/** 指定バージョンに対応する Release（Draft を含む）。 */
export function findReleases(releases, version) {
  return releases.filter((release) => tagVersion(release.tag_name) === version)
}

/** 公開済み Release の中で最大のもの。除外するタグを指定できる。無ければ null。 */
export function latestPublished(releases, excludeTag = null) {
  let latest = null
  for (const release of releases) {
    const version = tagVersion(release.tag_name)
    if (release.draft || !version || release.tag_name === excludeTag) continue
    if (!latest || compareVersions(version, latest.version) > 0) {
      latest = { version, tag: release.tag_name }
    }
  }
  return latest
}

function requireNewerThanPublished(version, releases) {
  const latest = latestPublished(releases)
  if (latest && compareVersions(version, latest.version) <= 0) {
    throw new Error(
      `Version ${version} is not newer than the latest published release ${latest.tag}.`
    )
  }
}

/**
 * release.yml の起動時に、Release をどうするかを決める。
 * - push: 直前のコミットからバージョンが上がったときだけ Draft を新規作成する
 * - dispatch: 現バージョンの Draft を今回のコミットに付け替えて作り直す（無ければ作成）
 * 戻り値の action: 'skip' | 'create' | 'retarget'
 */
export function resolveRelease({ mode, version, previousVersion, releases }) {
  if (!parseVersion(version)) throw new Error(`Invalid package.json version: ${version}`)
  const tag = `v${version}`

  // バージョンを上げていない push（依存更新や、リリース PR の revert）では何もしない
  if (mode === 'push' && previousVersion === version) {
    return { action: 'skip', tag, reason: `Version ${version} is unchanged.` }
  }
  if (
    mode === 'push' &&
    parseVersion(previousVersion) &&
    compareVersions(version, previousVersion) < 0
  ) {
    return { action: 'skip', tag, reason: `Version went down to ${version}.` }
  }

  const matches = findReleases(releases, version)
  if (matches.length > 1) {
    throw new Error(`Multiple releases exist for ${version}: ${matches.map((r) => r.tag_name)}`)
  }
  const existing = matches[0] ?? null

  if (mode === 'push') {
    if (existing) {
      throw new Error(
        `A release for ${version} already exists (${existing.tag_name}). ` +
          'Rebuild it with the workflow_dispatch trigger instead.'
      )
    }
    requireNewerThanPublished(version, releases)
    return { action: 'create', tag, reason: `Version changed to ${version}.` }
  }

  if (mode === 'dispatch') {
    if (!existing) {
      requireNewerThanPublished(version, releases)
      return { action: 'create', tag, reason: `No release for ${version} yet.` }
    }
    if (!existing.draft) {
      throw new Error(`Release ${existing.tag_name} is already published.`)
    }
    if (existing.tag_name !== tag) {
      throw new Error(`Draft ${existing.tag_name} does not use the ${tag} tag format.`)
    }
    return { action: 'retarget', tag, reason: `Rebuilding draft ${tag}.` }
  }

  throw new Error(`Unknown mode: ${mode}`)
}

/**
 * アップロード直前に Release の状態を確かめ、公開時に Latest にするかを返す。
 * - draft モード（push / dispatch）: 今回のコミットを対象にした Draft のままであること
 *   （手での公開や、別の実行による付け替え・公開の後に古い成果物を上書きしないため）
 * - event モード（手動の release: published）: 公開済みであること
 */
export function verifyUpload({ mode, tag, sha, releases }) {
  const matches = releases.filter((release) => release.tag_name === tag)
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one release for ${tag}, found ${matches.length}.`)
  }
  const release = matches[0]

  if (mode === 'event') {
    if (release.draft) throw new Error(`Release ${tag} is still a draft.`)
    return { publish: false, latest: false }
  }

  if (!release.draft) {
    throw new Error(`Release ${tag} is no longer a draft; refusing to overwrite its assets.`)
  }
  if (release.target_commitish !== sha) {
    throw new Error(
      `Draft ${tag} targets ${release.target_commitish}, not ${sha}; a newer run owns it.`
    )
  }
  const newestPublished = latestPublished(releases, tag)
  const version = tagVersion(tag)
  return {
    publish: true,
    latest: !newestPublished || compareVersions(version, newestPublished.version) > 0
  }
}

/** prepare-release.yml でリリース PR を作ってよいかを確かめる。 */
export function verifyPrepare({
  currentVersion,
  nextVersion,
  branch,
  releases,
  openReleasePrs,
  branchExists
}) {
  const current = findReleases(releases, currentVersion)
  if (!current.some((release) => !release.draft)) {
    throw new Error(
      `The current version ${currentVersion} has not been published yet. ` +
        'Finish or delete that release first.'
    )
  }
  if (findReleases(releases, nextVersion).length > 0) {
    throw new Error(`A release for ${nextVersion} already exists.`)
  }
  requireNewerThanPublished(nextVersion, releases)
  if (openReleasePrs.length > 0) {
    throw new Error(
      `Another release pull request is open: ${openReleasePrs.map((pr) => pr.url).join(', ')}`
    )
  }
  if (branchExists) {
    throw new Error(`Branch ${branch} already exists. Delete it and try again.`)
  }
}

/** `git/matching-refs/heads/<branch>` の結果（前方一致）から、そのブランチがあるかを判定する。 */
export function branchExistsIn(refs, branch) {
  return refs.some((ref) => ref.ref === `refs/heads/${branch}`)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeOutputs(outputs) {
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`)
  for (const line of lines) console.log(line)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`)
}

function main(command) {
  const env = process.env
  const releases = flattenPages(readJson(env.RELEASES_FILE))

  if (command === 'resolve') {
    const result = resolveRelease({
      mode: env.MODE,
      version: env.VERSION,
      previousVersion: env.PREVIOUS_VERSION || null,
      releases
    })
    console.log(result.reason)
    writeOutputs({
      action: result.action,
      tag: result.tag,
      build: result.action !== 'skip',
      previous_tag: latestPublished(releases)?.tag ?? ''
    })
  } else if (command === 'verify-upload') {
    const result = verifyUpload({ mode: env.MODE, tag: env.TAG, sha: env.SHA, releases })
    writeOutputs({ publish: result.publish, latest: result.latest })
  } else if (command === 'verify-prepare') {
    verifyPrepare({
      currentVersion: env.CURRENT_VERSION,
      nextVersion: env.VERSION,
      branch: env.BRANCH,
      releases,
      openReleasePrs: readJson(env.OPEN_PRS_FILE),
      branchExists: branchExistsIn(readJson(env.BRANCH_REFS_FILE), env.BRANCH)
    })
    writeOutputs({ previous_tag: latestPublished(releases)?.tag ?? '' })
  } else {
    throw new Error(`Unknown command: ${command}`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main(process.argv[2])
  } catch (error) {
    console.log(`::error::${error.message}`)
    process.exit(1)
  }
}
