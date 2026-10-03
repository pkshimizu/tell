// release-state.mjs の判定をワークフローから呼ぶための CLI。
// 入力は環境変数とファイル、結果は標準出力と $GITHUB_OUTPUT に書く。失敗したら
// ::error:: を出して終了コード 1 で終わる。依存パッケージは使わない。
//
//   node .github/scripts/release-cli.mjs <command> [args...]

import { createHash } from 'node:crypto'
import { appendFileSync, createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  assetsToDelete,
  branchExistsIn,
  checkUpdateInfo,
  flattenPages,
  latestPublished,
  parseUpdateInfo,
  releaseAssets,
  resolveRelease,
  verifyPrepare,
  verifyUpload
} from './release-state.mjs'

const PLATFORMS = ['windows', 'macos']

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function readReleases(env) {
  return flattenPages(readJson(env.RELEASES_FILE))
}

function writeOutputs(env, outputs) {
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`)
  for (const line of lines) console.log(line)
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `${lines.join('\n')}\n`)
}

function sha512(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha512')
    createReadStream(path)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('base64')))
      .on('error', reject)
  })
}

function requireFile(path) {
  if (!existsSync(path)) throw new Error(`Missing release asset: ${path}`)
}

/** 1 つの OS の成果物がそろい、更新情報ファイルが実際のファイルを指していることを確かめる。 */
async function verifyUpdateInfo(platform, dir, version) {
  const assets = releaseAssets(platform, version)
  for (const name of [...assets.binaries, assets.updateInfo]) requireFile(join(dir, name))

  const info = parseUpdateInfo(readFileSync(join(dir, assets.updateInfo), 'utf8'))
  const actualFiles = {}
  for (const file of info.files) {
    const path = join(dir, file.url)
    if (existsSync(path)) {
      actualFiles[file.url] = { sha512: await sha512(path), size: statSync(path).size }
    }
  }
  checkUpdateInfo(info, { version, main: assets.main, actualFiles })
  console.log(`Verified ${join(dir, assets.updateInfo)}`)
}

async function main(argv, env) {
  const [command, ...args] = argv

  if (command === 'resolve') {
    const releases = readReleases(env)
    const result = resolveRelease({
      mode: env.MODE,
      version: env.VERSION,
      previousVersion: env.PREVIOUS_VERSION || null,
      releases
    })
    console.log(result.reason)
    writeOutputs(env, {
      action: result.action,
      tag: result.tag,
      build: result.action !== 'skip',
      previous_tag: latestPublished(releases)?.tag ?? ''
    })
  } else if (command === 'verify-upload') {
    const result = verifyUpload({
      mode: env.MODE,
      tag: env.TAG,
      sha: env.SHA,
      releases: readReleases(env)
    })
    writeOutputs(env, { publish: result.publish, latest: result.latest })
  } else if (command === 'verify-prepare') {
    const releases = readReleases(env)
    verifyPrepare({
      currentVersion: env.CURRENT_VERSION,
      nextVersion: env.VERSION,
      branch: env.BRANCH,
      releases,
      openReleasePrs: readJson(env.OPEN_PRS_FILE),
      branchExists: branchExistsIn(readJson(env.BRANCH_REFS_FILE), env.BRANCH)
    })
    writeOutputs(env, { previous_tag: latestPublished(releases)?.tag ?? '' })
  } else if (command === 'assets') {
    // 指定 OS の成果物のファイル名を、本体 → 更新情報ファイルの順に 1 行ずつ出す
    const assets = releaseAssets(args[0], env.VERSION)
    for (const name of [...assets.binaries, assets.updateInfo]) console.log(name)
  } else if (command === 'verify-update-info') {
    await verifyUpdateInfo(args[0], args[1], env.VERSION)
  } else if (command === 'upload-list') {
    // 全 OS の成果物のパスを、本体をすべて先に、更新情報ファイルを最後にして 1 行ずつ出す。
    // 各 OS のファイルは <root>/<platform>/ からだけ取る。
    const root = args[0]
    const all = PLATFORMS.map((platform) => ({ platform, ...releaseAssets(platform, env.VERSION) }))
    const paths = [
      ...all.flatMap(({ platform, binaries }) =>
        binaries.map((name) => join(root, platform, name))
      ),
      ...all.map(({ platform, updateInfo }) => join(root, platform, updateInfo))
    ]
    for (const path of paths) {
      requireFile(path)
      console.log(path)
    }
  } else if (command === 'assets-to-delete') {
    const all = PLATFORMS.map((platform) => releaseAssets(platform, env.VERSION))
    const existing = readFileSync(env.EXISTING_FILE, 'utf8').split('\n').filter(Boolean)
    const names = assetsToDelete({
      mode: env.MODE,
      existing,
      expected: all.flatMap(({ binaries, updateInfo }) => [...binaries, updateInfo]),
      updateInfo: all.map(({ updateInfo }) => updateInfo)
    })
    for (const name of names) console.log(name)
  } else {
    throw new Error(`Unknown command: ${command}`)
  }
}

try {
  await main(process.argv.slice(2), process.env)
} catch (error) {
  console.log(`::error::${error.message}`)
  process.exit(1)
}
