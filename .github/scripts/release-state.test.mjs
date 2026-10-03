import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  assetNames,
  assetsToDelete,
  branchExistsIn,
  verifyUpdateInfo,
  compareVersions,
  flattenPages,
  latestPublished,
  parseUpdateInfo,
  releaseAssets,
  resolveRelease,
  tagVersion,
  uploadOrder,
  verifyPrepare,
  verifyUpload
} from './release-state.mjs'

const SHA = 'a'.repeat(40)
const OTHER_SHA = 'b'.repeat(40)

function release(tag, { draft = false, target = 'main' } = {}) {
  return { tag_name: tag, draft, target_commitish: target }
}

describe('compareVersions', () => {
  it('compares each component numerically', () => {
    expect(compareVersions('0.10.0', '0.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0)
    expect(compareVersions('2.3.4', '2.3.4')).toBe(0)
  })

  it('rejects versions that are not x.y.z', () => {
    expect(() => compareVersions('1.0', '1.0.0')).toThrow('Invalid version: 1.0')
    expect(() => compareVersions('1.0.0', '1.0.0-beta.1')).toThrow('Invalid version')
  })
})

describe('tagVersion', () => {
  it('accepts v and the legacy release/v prefix', () => {
    expect(tagVersion('v0.2.0')).toBe('0.2.0')
    expect(tagVersion('release/v0.2.0')).toBe('0.2.0')
  })

  it('returns null for tags that are not versions', () => {
    expect(tagVersion('nightly')).toBeNull()
    expect(tagVersion(undefined)).toBeNull()
  })
})

describe('flattenPages', () => {
  it('merges the pages returned by gh api --paginate --slurp', () => {
    expect(flattenPages([[release('v0.1.0')], [release('v0.0.3')]])).toHaveLength(2)
  })

  it('returns an empty list when there are no releases', () => {
    expect(flattenPages([[]])).toEqual([])
  })

  it('returns a list that is not paginated as is', () => {
    const releases = [release('v0.1.0')]
    expect(flattenPages(releases)).toBe(releases)
  })
})

describe('branchExistsIn', () => {
  it('matches the branch exactly, not by prefix', () => {
    const refs = [{ ref: 'refs/heads/release/v0.2.0-rc' }]
    expect(branchExistsIn(refs, 'release/v0.2.0')).toBe(false)
    expect(branchExistsIn([...refs, { ref: 'refs/heads/release/v0.2.0' }], 'release/v0.2.0')).toBe(
      true
    )
  })
})

describe('latestPublished', () => {
  it('ignores drafts, non-version tags and the excluded tag', () => {
    const releases = [
      release('v0.3.0', { draft: true }),
      release('nightly'),
      release('v0.2.0'),
      release('release/v0.1.0')
    ]
    expect(latestPublished(releases)).toEqual({ version: '0.2.0', tag: 'v0.2.0' })
    expect(latestPublished(releases, 'v0.2.0')).toEqual({
      version: '0.1.0',
      tag: 'release/v0.1.0'
    })
  })

  it('returns null when nothing is published', () => {
    expect(latestPublished([release('v0.1.0', { draft: true })])).toBeNull()
  })
})

describe('resolveRelease', () => {
  const published = [release('v0.1.0')]

  describe('push', () => {
    it('skips when the version did not change', () => {
      const result = resolveRelease({
        mode: 'push',
        version: '0.1.0',
        previousVersion: '0.1.0',
        releases: published
      })
      expect(result.action).toBe('skip')
    })

    it('skips an unchanged version even while its releases are duplicated', () => {
      const result = resolveRelease({
        mode: 'push',
        version: '0.1.0',
        previousVersion: '0.1.0',
        releases: [release('v0.1.0'), release('release/v0.1.0')]
      })
      expect(result.action).toBe('skip')
    })

    it('skips when the version went down, e.g. a reverted release pull request', () => {
      const result = resolveRelease({
        mode: 'push',
        version: '0.1.0',
        previousVersion: '0.2.0',
        releases: published
      })
      expect(result).toMatchObject({ action: 'skip', reason: 'Version went down to 0.1.0.' })
    })

    it('creates a draft when the previous version is unknown', () => {
      const result = resolveRelease({
        mode: 'push',
        version: '0.2.0',
        previousVersion: null,
        releases: published
      })
      expect(result.action).toBe('create')
    })

    it('creates a draft when the version was bumped', () => {
      const result = resolveRelease({
        mode: 'push',
        version: '0.2.0',
        previousVersion: '0.1.0',
        releases: published
      })
      expect(result).toMatchObject({ action: 'create', tag: 'v0.2.0' })
    })

    it('refuses to reuse an existing release, including the legacy tag format', () => {
      for (const existing of [release('v0.2.0', { draft: true }), release('release/v0.2.0')]) {
        expect(() =>
          resolveRelease({
            mode: 'push',
            version: '0.2.0',
            previousVersion: '0.1.0',
            releases: [...published, existing]
          })
        ).toThrow('A release for 0.2.0 already exists')
      }
    })

    it('refuses a bumped version that is not newer than the latest published one', () => {
      expect(() =>
        resolveRelease({
          mode: 'push',
          version: '0.2.0',
          previousVersion: '0.1.0',
          releases: [...published, release('v0.3.0')]
        })
      ).toThrow('not newer')
    })

    it('fails when several releases match the version', () => {
      expect(() =>
        resolveRelease({
          mode: 'push',
          version: '0.2.0',
          previousVersion: '0.1.0',
          releases: [release('v0.2.0', { draft: true }), release('release/v0.2.0')]
        })
      ).toThrow('Multiple releases')
    })

    it('rejects an invalid package.json version', () => {
      expect(() =>
        resolveRelease({ mode: 'push', version: '0.2', previousVersion: null, releases: [] })
      ).toThrow('Invalid package.json version')
    })
  })

  describe('dispatch', () => {
    it('retargets an existing draft', () => {
      const result = resolveRelease({
        mode: 'dispatch',
        version: '0.2.0',
        releases: [...published, release('v0.2.0', { draft: true, target: OTHER_SHA })]
      })
      expect(result).toMatchObject({ action: 'retarget', tag: 'v0.2.0' })
    })

    it('creates a draft when none exists yet', () => {
      const result = resolveRelease({ mode: 'dispatch', version: '0.2.0', releases: published })
      expect(result.action).toBe('create')
    })

    it('refuses to create a version that is not newer than the latest published one', () => {
      expect(() =>
        resolveRelease({ mode: 'dispatch', version: '0.0.9', releases: published })
      ).toThrow('not newer')
    })

    it('refuses to touch a published release', () => {
      expect(() =>
        resolveRelease({ mode: 'dispatch', version: '0.1.0', releases: published })
      ).toThrow('already published')
    })

    it('refuses a draft that uses the legacy tag format', () => {
      expect(() =>
        resolveRelease({
          mode: 'dispatch',
          version: '0.2.0',
          releases: [release('release/v0.2.0', { draft: true })]
        })
      ).toThrow('tag format')
    })
  })

  it('rejects an unknown mode', () => {
    expect(() => resolveRelease({ mode: 'other', version: '0.2.0', releases: [] })).toThrow(
      'Unknown mode'
    )
  })
})

describe('verifyUpload', () => {
  it('publishes a draft owned by this commit and marks a newer version as latest', () => {
    const releases = [release('v0.1.0'), release('v0.2.0', { draft: true, target: SHA })]
    expect(verifyUpload({ mode: 'draft', tag: 'v0.2.0', sha: SHA, releases })).toEqual({
      publish: true,
      latest: true
    })
  })

  it('does not mark an older version as latest when a newer one is already published', () => {
    const releases = [release('v0.2.1'), release('v0.2.0', { draft: true, target: SHA })]
    expect(verifyUpload({ mode: 'draft', tag: 'v0.2.0', sha: SHA, releases }).latest).toBe(false)
  })

  it('marks the first release as latest', () => {
    const releases = [release('v0.2.0', { draft: true, target: SHA })]
    expect(verifyUpload({ mode: 'draft', tag: 'v0.2.0', sha: SHA, releases }).latest).toBe(true)
  })

  it('does not mark a version as latest when the same version is published with the legacy tag', () => {
    const releases = [release('release/v0.2.0'), release('v0.2.0', { draft: true, target: SHA })]
    expect(verifyUpload({ mode: 'draft', tag: 'v0.2.0', sha: SHA, releases }).latest).toBe(false)
  })

  it('refuses when the draft was published in the meantime', () => {
    expect(() =>
      verifyUpload({
        mode: 'draft',
        tag: 'v0.2.0',
        sha: SHA,
        releases: [release('v0.2.0', { target: SHA })]
      })
    ).toThrow('no longer a draft')
  })

  it('refuses when another run retargeted the draft', () => {
    expect(() =>
      verifyUpload({
        mode: 'draft',
        tag: 'v0.2.0',
        sha: SHA,
        releases: [release('v0.2.0', { draft: true, target: OTHER_SHA })]
      })
    ).toThrow('a newer run owns it')
  })

  it('requires exactly one release with the tag', () => {
    expect(() => verifyUpload({ mode: 'draft', tag: 'v0.2.0', sha: SHA, releases: [] })).toThrow(
      'found 0'
    )
    const duplicated = [
      release('v0.2.0', { draft: true, target: SHA }),
      release('v0.2.0', { draft: true, target: SHA })
    ]
    expect(() =>
      verifyUpload({ mode: 'draft', tag: 'v0.2.0', sha: SHA, releases: duplicated })
    ).toThrow('found 2')
  })

  it('uploads to a published release for the manual release event without publishing', () => {
    expect(
      verifyUpload({ mode: 'event', tag: 'v0.2.0', sha: SHA, releases: [release('v0.2.0')] })
    ).toEqual({ publish: false, latest: false })
  })

  it.each(['release/v0.2.0', '0.2.0'])(
    'refuses the manual release event for the %s tag that is not in the v format',
    (tag) => {
      expect(() =>
        verifyUpload({ mode: 'event', tag, sha: SHA, releases: [release(tag)] })
      ).toThrow('tag format')
    }
  )

  it('refuses the manual release event while the release is a draft', () => {
    expect(() =>
      verifyUpload({
        mode: 'event',
        tag: 'v0.2.0',
        sha: SHA,
        releases: [release('v0.2.0', { draft: true })]
      })
    ).toThrow('still a draft')
  })
})

describe('verifyPrepare', () => {
  const base = {
    currentVersion: '0.1.0',
    nextVersion: '0.2.0',
    branch: 'release/v0.2.0',
    releases: [release('v0.1.0')],
    openReleasePrs: [],
    branchExists: false
  }

  it('passes when the current version is published and nothing is in flight', () => {
    expect(() => verifyPrepare(base)).not.toThrow()
  })

  it('accepts a current version published with the legacy tag format', () => {
    expect(() => verifyPrepare({ ...base, releases: [release('release/v0.1.0')] })).not.toThrow()
  })

  it('requires the current version to be published', () => {
    expect(() =>
      verifyPrepare({ ...base, releases: [release('v0.1.0', { draft: true })] })
    ).toThrow('has not been published')
  })

  it('refuses when the next version already has a release', () => {
    expect(() =>
      verifyPrepare({ ...base, releases: [...base.releases, release('v0.2.0', { draft: true })] })
    ).toThrow('A release for 0.2.0 already exists')
  })

  it('refuses when a newer version than the next one is already published', () => {
    expect(() =>
      verifyPrepare({ ...base, releases: [...base.releases, release('v0.3.0')] })
    ).toThrow('not newer')
  })

  it('refuses when another release pull request is open', () => {
    expect(() =>
      verifyPrepare({ ...base, openReleasePrs: [{ url: 'https://example.com/pull/1' }] })
    ).toThrow('Another release pull request')
  })

  it('refuses when the release branch already exists', () => {
    expect(() => verifyPrepare({ ...base, branchExists: true })).toThrow(
      'Branch release/v0.2.0 already exists'
    )
  })
})

describe('releaseAssets', () => {
  it('lists the Windows installer, its blockmap and latest.yml', () => {
    expect(releaseAssets('windows', '0.2.0')).toEqual({
      main: 'tell-0.2.0-win-setup.exe',
      binaries: ['tell-0.2.0-win-setup.exe', 'tell-0.2.0-win-setup.exe.blockmap'],
      updateInfo: 'latest.yml'
    })
  })

  it('lists the macOS DMG, the ZIP used for updates, its blockmap and latest-mac.yml', () => {
    expect(releaseAssets('macos', '0.2.0')).toEqual({
      main: 'tell-0.2.0-universal-mac.zip',
      binaries: [
        'tell-0.2.0-universal-mac.dmg',
        'tell-0.2.0-universal-mac.zip',
        'tell-0.2.0-universal-mac.zip.blockmap'
      ],
      updateInfo: 'latest-mac.yml'
    })
  })

  it('rejects unknown platforms and invalid versions', () => {
    expect(() => releaseAssets('linux', '0.2.0')).toThrow('Unknown platform')
    expect(() => releaseAssets('windows', '0.2')).toThrow('Invalid version')
  })

  // ファイル名は electron-builder の artifactName と releaseAssets の二重定義なので、
  // 設定を変えたときのずれをリリース本番より前に検出する
  describe('matches the electron-builder configs', () => {
    function section(file, key) {
      const text = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
      const match = new RegExp(`^${key}:\\n((?:(?: .*)?\\n)*)`, 'm').exec(text)
      if (!match) throw new Error(`Section ${key} is not in ${file}`)
      return match[1]
    }
    function artifactName(file, key) {
      const pattern = /^ {2}artifactName: (\S+)$/m.exec(section(file, key))?.[1]
      return pattern?.replace('${name}', 'tell').replace('${version}', '0.2.0')
    }
    function targets(file, key) {
      return [...section(file, key).matchAll(/- target: (\w+)/g)].map((match) => match[1])
    }

    it('builds the Windows installer that releaseAssets expects', () => {
      expect(targets('electron-builder.base.yml', 'win')).toEqual(['nsis'])
      expect(artifactName('electron-builder.base.yml', 'nsis')).toBe(
        releaseAssets('windows', '0.2.0').main.replace(/exe$/, '${ext}')
      )
    })

    it('builds the macOS DMG and ZIP that releaseAssets expects', () => {
      const [dmg, zip] = releaseAssets('macos', '0.2.0').binaries
      expect(targets('electron-builder.release.yml', 'mac')).toEqual(['dmg', 'zip'])
      expect(artifactName('electron-builder.release.yml', 'dmg')).toBe(
        dmg.replace(/dmg$/, '${ext}')
      )
      expect(artifactName('electron-builder.release.yml', 'mac')).toBe(
        zip.replace(/zip$/, '${ext}')
      )
    })
  })
})

describe('parseUpdateInfo', () => {
  const text = [
    'version: 0.2.0',
    'files:',
    '  - url: tell-0.2.0-universal-mac.zip',
    '    sha512: ZIPHASH==',
    '    size: 200',
    '  - url: tell-0.2.0-universal-mac.dmg',
    '    sha512: DMGHASH==',
    '    size: 300',
    'path: tell-0.2.0-universal-mac.zip',
    'sha512: ZIPHASH==',
    "releaseDate: '2026-10-03T09:57:51.716Z'"
  ]

  it('reads the top-level keys and every files entry', () => {
    expect(parseUpdateInfo(text.join('\n'))).toEqual({
      version: '0.2.0',
      path: 'tell-0.2.0-universal-mac.zip',
      sha512: 'ZIPHASH==',
      releaseDate: '2026-10-03T09:57:51.716Z',
      files: [
        { url: 'tell-0.2.0-universal-mac.zip', sha512: 'ZIPHASH==', size: '200' },
        { url: 'tell-0.2.0-universal-mac.dmg', sha512: 'DMGHASH==', size: '300' }
      ]
    })
  })

  it('does not mix keys of other top-level sections into files', () => {
    const info = parseUpdateInfo(
      [
        'version: 0.2.0',
        'files:',
        '  - url: a.zip',
        '    size: 1',
        'other:',
        '  - url: b.zip',
        '    size: 2',
        'empty:',
        'path: a.zip'
      ].join('\n')
    )
    expect(info.files).toEqual([{ url: 'a.zip', size: '1' }])
    expect(info).not.toHaveProperty('empty')
    expect(info.path).toBe('a.zip')
  })

  it('accepts CRLF line endings', () => {
    expect(parseUpdateInfo(text.join('\r\n')).files).toHaveLength(2)
  })
})

describe('verifyUpdateInfo', () => {
  const main = 'tell-0.2.0-win-setup.exe'
  const info = {
    version: '0.2.0',
    path: main,
    sha512: 'HASH==',
    files: [{ url: main, sha512: 'HASH==', size: '100' }]
  }
  const actualFiles = { [main]: { sha512: 'HASH==', size: 100 } }

  it('passes when the version, path and contents match', () => {
    expect(() => verifyUpdateInfo(info, { version: '0.2.0', main, actualFiles })).not.toThrow()
  })

  it('rejects another version', () => {
    expect(() => verifyUpdateInfo(info, { version: '0.2.1', main, actualFiles })).toThrow(
      'does not match 0.2.1'
    )
  })

  it('rejects a path that is not the expected main file', () => {
    expect(() =>
      verifyUpdateInfo(info, { version: '0.2.0', main: 'tell-0.2.0-win.exe', actualFiles })
    ).toThrow('is not tell-0.2.0-win.exe')
  })

  it('rejects update info whose files do not include the main file', () => {
    expect(() =>
      verifyUpdateInfo(
        { ...info, files: [{ url: 'other.exe', sha512: 'HASH==', size: '100' }] },
        { version: '0.2.0', main, actualFiles }
      )
    ).toThrow('files do not include')
  })

  it('checks every entry, not only the main file', () => {
    const zip = 'tell-0.2.0-universal-mac.zip'
    const dmg = 'tell-0.2.0-universal-mac.dmg'
    const macInfo = {
      version: '0.2.0',
      path: zip,
      sha512: 'ZIP==',
      files: [
        { url: zip, sha512: 'ZIP==', size: '1' },
        { url: dmg, sha512: 'DMG==', size: '2' }
      ]
    }
    expect(() =>
      verifyUpdateInfo(macInfo, {
        version: '0.2.0',
        main: zip,
        actualFiles: { [zip]: { sha512: 'ZIP==', size: 1 }, [dmg]: { sha512: 'OTHER==', size: 2 } }
      })
    ).toThrow(`does not match the contents of ${dmg}`)
  })

  it('rejects a referenced file that does not exist', () => {
    expect(() => verifyUpdateInfo(info, { version: '0.2.0', main, actualFiles: {} })).toThrow(
      'missing file'
    )
  })

  it('rejects a file whose contents changed after the update info was written', () => {
    for (const changed of [
      { sha512: 'OTHER==', size: 100 },
      { sha512: 'HASH==', size: 101 }
    ]) {
      expect(() =>
        verifyUpdateInfo(info, { version: '0.2.0', main, actualFiles: { [main]: changed } })
      ).toThrow('does not match the contents')
    }
  })

  it('rejects a top-level sha512 that differs from the main entry', () => {
    expect(() =>
      verifyUpdateInfo({ ...info, sha512: 'OTHER==' }, { version: '0.2.0', main, actualFiles })
    ).toThrow('sha512 does not match the entry')
  })
})

describe('assetsToDelete', () => {
  const expected = ['tell-0.2.0-win-setup.exe', 'latest.yml']
  const updateInfo = ['latest.yml', 'latest-mac.yml']
  const existing = ['tell-0.2.0-win-setup.exe', 'latest.yml', 'tell-0.2.0-win.exe']

  it('removes update info and stale assets from a draft', () => {
    expect(assetsToDelete({ mode: 'draft', existing, expected, updateInfo })).toEqual([
      'latest.yml',
      'tell-0.2.0-win.exe'
    ])
  })

  it('removes only update info from a manually published release', () => {
    expect(assetsToDelete({ mode: 'event', existing, expected, updateInfo })).toEqual([
      'latest.yml'
    ])
  })
})

describe('uploadOrder', () => {
  it('uploads every binary of every platform before any update info file', () => {
    const order = uploadOrder('0.2.0')
    const firstUpdateInfo = order.findIndex(({ name }) => name.endsWith('.yml'))
    expect(order.slice(firstUpdateInfo)).toEqual([
      { platform: 'windows', name: 'latest.yml' },
      { platform: 'macos', name: 'latest-mac.yml' }
    ])
    expect(order.slice(0, firstUpdateInfo).map(({ name }) => name)).toEqual([
      ...releaseAssets('windows', '0.2.0').binaries,
      ...releaseAssets('macos', '0.2.0').binaries
    ])
  })
})

describe('assetNames', () => {
  it('lists the binaries followed by the update info file', () => {
    expect(assetNames(releaseAssets('windows', '0.2.0'))).toEqual([
      'tell-0.2.0-win-setup.exe',
      'tell-0.2.0-win-setup.exe.blockmap',
      'latest.yml'
    ])
  })
})
