// release-state.mjs の判定をワークフローから呼ぶための CLI。依存パッケージは使わない。
// 対象の OS とディレクトリは引数、実行時の文脈（VERSION・MODE など）と入力ファイルは環境変数で
// 受け取る。結果は標準出力と $GITHUB_OUTPUT に書き、失敗したら ::error:: を標準エラーに出して
// 終了コード 1 で終わる（標準出力を $(...) で受ける呼び出し側でもエラーがログに残るように）。
//
//   node .github/scripts/release-cli.mjs <command> [args...]
//
//   resolve                         MODE, VERSION, PREVIOUS_VERSION, RELEASES_FILE
//   verify-upload                   MODE, TAG, SHA, RELEASES_FILE
//   verify-prepare                  CURRENT_VERSION, VERSION, BRANCH, RELEASES_FILE,
//                                   OPEN_PRS_FILE, BRANCH_REFS_FILE
//   assets <platform>               VERSION                 ファイル名を 1 行ずつ出す
//   verify-update-info <platform> <dir>  VERSION            成果物と latest*.yml を照合する
//   upload-list <root>              VERSION                 アップロードするパスを順に出す
//   assets-to-delete                MODE, VERSION, EXISTING_FILE

import { createHash } from 'node:crypto'
import { appendFileSync, createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  PLATFORMS,
  assetNames,
  assetsToDelete,
  branchExistsIn,
  flattenPages,
  latestPublished,
  parseUpdateInfo,
  releaseAssets,
  resolveRelease,
  uploadOrder,
  verifyPrepare,
  verifyUpdateInfo,
  verifyUpload
} from './release-state.mjs'

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
async function verifyPlatformAssets(platform, dir, version) {
  const assets = releaseAssets(platform, version)
  for (const name of assetNames(assets)) requireFile(join(dir, name))

  const info = parseUpdateInfo(readFileSync(join(dir, assets.updateInfo), 'utf8'))
  const actualFiles = {}
  for (const file of info.files) {
    const path = join(dir, file.url)
    if (existsSync(path)) {
      actualFiles[file.url] = { sha512: await sha512(path), size: statSync(path).size }
    }
  }
  verifyUpdateInfo(info, { version, main: assets.main, actualFiles })
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
    for (const name of assetNames(releaseAssets(args[0], env.VERSION))) console.log(name)
  } else if (command === 'verify-update-info') {
    await verifyPlatformAssets(args[0], args[1], env.VERSION)
  } else if (command === 'upload-list') {
    // 全 OS の成果物のパスを、本体をすべて先に、更新情報ファイルを最後にして 1 行ずつ出す。
    // 各 OS のファイルは <root>/<platform>/ からだけ取る。
    for (const { platform, name } of uploadOrder(env.VERSION)) {
      const path = join(args[0], platform, name)
      requireFile(path)
      console.log(path)
    }
  } else if (command === 'assets-to-delete') {
    const all = PLATFORMS.map((platform) => releaseAssets(platform, env.VERSION))
    const existing = readFileSync(env.EXISTING_FILE, 'utf8').split('\n').filter(Boolean)
    const names = assetsToDelete({
      mode: env.MODE,
      existing,
      expected: all.flatMap(assetNames),
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
  console.error(`::error::${error.message}`)
  process.exit(1)
}
