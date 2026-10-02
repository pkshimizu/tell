import { describe, expect, it } from 'vitest'
import {
  branchExistsIn,
  compareVersions,
  flattenPages,
  latestPublished,
  resolveRelease,
  tagVersion,
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
