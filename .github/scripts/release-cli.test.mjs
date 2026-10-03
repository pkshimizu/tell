import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'

const CLI = fileURLToPath(new URL('./release-cli.mjs', import.meta.url))

let dir

function run(args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8'
  })
}

function writeAsset(path, contents) {
  writeFileSync(path, contents)
  return { sha512: createHash('sha512').update(contents).digest('base64'), size: contents.length }
}

function writeWindowsAssets(root, version = '0.2.0') {
  const windows = join(root, 'windows')
  mkdirSync(windows, { recursive: true })
  const main = `tell-${version}-win-setup.exe`
  const exe = writeAsset(join(windows, main), 'installer')
  writeAsset(join(windows, `${main}.blockmap`), 'blockmap')
  writeFileSync(
    join(windows, 'latest.yml'),
    [
      `version: ${version}`,
      'files:',
      `  - url: ${main}`,
      `    sha512: ${exe.sha512}`,
      `    size: ${exe.size}`,
      `path: ${main}`,
      `sha512: ${exe.sha512}`,
      "releaseDate: '2026-10-03T00:00:00.000Z'"
    ].join('\n')
  )
  return windows
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'release-cli-'))
})

describe('release-cli', () => {
  it('prints the assets of a platform with the update info last', () => {
    const result = run(['assets', 'windows'], { VERSION: '0.2.0' })
    expect(result.status).toBe(0)
    expect(result.stdout.trim().split('\n')).toEqual([
      'tell-0.2.0-win-setup.exe',
      'tell-0.2.0-win-setup.exe.blockmap',
      'latest.yml'
    ])
  })

  it('verifies update info against the actual files', () => {
    const windows = writeWindowsAssets(dir)
    const result = run(['verify-update-info', 'windows', windows], { VERSION: '0.2.0' })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Verified')
  })

  it('fails when a file changed after the update info was written', () => {
    const windows = writeWindowsAssets(dir)
    writeFileSync(join(windows, 'tell-0.2.0-win-setup.exe'), 'tampered')
    const result = run(['verify-update-info', 'windows', windows], { VERSION: '0.2.0' })
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('::error::Update info does not match the contents')
  })

  it('fails when an expected asset is missing', () => {
    const result = run(['verify-update-info', 'windows', dir], { VERSION: '0.2.0' })
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('::error::Missing release asset')
  })

  it('lists every binary before any update info file', () => {
    writeWindowsAssets(dir)
    const macos = join(dir, 'macos')
    mkdirSync(macos)
    for (const name of [
      'tell-0.2.0-universal-mac.dmg',
      'tell-0.2.0-universal-mac.zip',
      'tell-0.2.0-universal-mac.zip.blockmap',
      'latest-mac.yml'
    ]) {
      writeFileSync(join(macos, name), name)
    }
    const result = run(['upload-list', dir], { VERSION: '0.2.0' })
    expect(result.status).toBe(0)
    const names = result.stdout.trim().split('\n')
    expect(names.slice(-2)).toEqual([
      join(dir, 'windows', 'latest.yml'),
      join(macos, 'latest-mac.yml')
    ])
    expect(names).toHaveLength(7)
  })

  it('prints the assets to delete from a draft', () => {
    const existing = join(dir, 'existing.txt')
    writeFileSync(existing, 'latest.yml\ntell-0.2.0-win.exe\ntell-0.2.0-win-setup.exe\n')
    const result = run(['assets-to-delete'], {
      MODE: 'draft',
      VERSION: '0.2.0',
      EXISTING_FILE: existing
    })
    expect(result.stdout.trim().split('\n')).toEqual(['latest.yml', 'tell-0.2.0-win.exe'])
  })

  it('writes resolve results to GITHUB_OUTPUT', () => {
    const releases = join(dir, 'releases.json')
    const output = join(dir, 'output.txt')
    writeFileSync(releases, JSON.stringify([[{ tag_name: 'v0.1.0', draft: false }]]))
    writeFileSync(output, '')
    execFileSync(process.execPath, [CLI, 'resolve'], {
      env: {
        PATH: process.env.PATH,
        MODE: 'push',
        VERSION: '0.1.0',
        PREVIOUS_VERSION: '0.1.0',
        RELEASES_FILE: releases,
        GITHUB_OUTPUT: output
      }
    })
    expect(readFileSync(output, 'utf8')).toBe(
      'action=skip\ntag=v0.1.0\nbuild=false\nprevious_tag=v0.1.0\n'
    )
  })

  it('fails on an unknown command', () => {
    const result = run(['unknown'])
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('::error::Unknown command: unknown')
  })
})
