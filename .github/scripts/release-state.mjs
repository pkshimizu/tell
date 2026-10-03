// リリースワークフロー（prepare-release.yml / release.yml）の判定ロジック。
// GitHub API の取得とリリースの作成・更新はワークフロー側の gh が行い、ここでは
// 取得済みのデータから「何をすべきか」だけを決める純粋関数を置く。依存パッケージは
// 使わない（npm ci を実行しないジョブから呼ぶため）。CLI は release-cli.mjs。

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
    // electron-updater は v 形式のタグを前提にするため、旧形式のタグには成果物を上げない
    if (!/^v\d/.test(tag)) throw new Error(`Release ${tag} does not use the v{version} tag format.`)
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

/**
 * Release に載せる成果物のファイル名。electron-builder の artifactName と対応させる唯一の定義元。
 * 更新情報ファイル（updateInfo）は、参照先の本体より後にアップロードする。
 */
export function releaseAssets(platform, version) {
  if (!parseVersion(version)) throw new Error(`Invalid version: ${version}`)
  if (platform === 'windows') {
    const main = `tell-${version}-win-setup.exe`
    return { main, binaries: [main, `${main}.blockmap`], updateInfo: 'latest.yml' }
  }
  if (platform === 'macos') {
    const main = `tell-${version}-universal-mac.zip`
    return {
      main,
      binaries: [`tell-${version}-universal-mac.dmg`, main, `${main}.blockmap`],
      updateInfo: 'latest-mac.yml'
    }
  }
  throw new Error(`Unknown platform: ${platform}`)
}

function unquote(value) {
  const trimmed = value.trim()
  const quoted = /^(['"])(.*)\1$/.exec(trimmed)
  return quoted ? quoted[2] : trimmed
}

/**
 * electron-builder が書き出す latest.yml / latest-mac.yml を読む。
 * 依存を持たないため、この形式（トップレベルのキーと files の配列）に限って行単位で解釈する。
 */
export function parseUpdateInfo(text) {
  const info = { files: [] }
  let current = null
  let inFiles = false
  for (const line of text.split(/\r?\n/)) {
    const entry = /^ {2}- (\w+): (.*)$/.exec(line)
    const field = /^ {4}(\w+): (.*)$/.exec(line)
    const top = /^(\w+):(?: (.*))?$/.exec(line)
    if (inFiles && entry) {
      current = { [entry[1]]: unquote(entry[2]) }
      info.files.push(current)
    } else if (inFiles && field && current) {
      current[field[1]] = unquote(field[2])
    } else if (top) {
      inFiles = top[1] === 'files'
      current = null
      if (!inFiles && top[2] !== undefined) info[top[1]] = unquote(top[2])
    }
  }
  return info
}

/**
 * 更新情報ファイルが、今回のバージョンと実際のファイル（sha512・サイズ）を指しているかを確かめる。
 * actualFiles: ファイル名 → { sha512, size }（存在するファイルだけ）
 */
export function checkUpdateInfo(info, { version, main, actualFiles }) {
  if (info.version !== version) {
    throw new Error(`Update info version ${info.version} does not match ${version}.`)
  }
  if (info.path !== main) throw new Error(`Update info path ${info.path} is not ${main}.`)
  if (!info.files.some((file) => file.url === main)) {
    throw new Error(`Update info files do not include ${main}.`)
  }
  for (const file of info.files) {
    const actual = actualFiles[file.url]
    if (!actual) throw new Error(`Update info refers to a missing file: ${file.url}`)
    if (file.sha512 !== actual.sha512 || Number(file.size) !== actual.size) {
      throw new Error(`Update info does not match the contents of ${file.url}.`)
    }
  }
  const mainFile = info.files.find((file) => file.url === main)
  if (info.sha512 !== mainFile.sha512) {
    throw new Error(`Update info sha512 does not match the entry for ${main}.`)
  }
}

/**
 * アップロード前に Release から削除するアセット。
 * - 更新情報ファイルは常に削除し、本体を上げ終えてから最後に上げ直す（再実行で sha512 が
 *   食い違う時間を作らないため）
 * - draft モードでは、今回の一覧に無い古いアセット（前の実行やファイル名変更の名残）も消す
 */
export function assetsToDelete({ mode, existing, expected, updateInfo }) {
  return existing.filter(
    (name) => updateInfo.includes(name) || (mode !== 'event' && !expected.includes(name))
  )
}
