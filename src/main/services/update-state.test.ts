import { describe, expect, it } from 'vitest'
import { reduceUpdate, shouldCheck, shouldPromptRestart, type UpdateStatus } from './update-state'

const downloading: UpdateStatus = { state: 'downloading', version: '0.2.0', percent: 40 }
const ready: UpdateStatus = { state: 'ready', version: '0.2.0' }

describe('reduceUpdate', () => {
  it('goes through checking, downloading and ready for a new version', () => {
    let status: UpdateStatus = { state: 'idle' }
    status = reduceUpdate(status, { type: 'check-started' })
    expect(status).toEqual({ state: 'checking' })
    status = reduceUpdate(status, { type: 'update-available', version: '0.2.0' })
    expect(status).toEqual({ state: 'downloading', version: '0.2.0', percent: 0 })
    status = reduceUpdate(status, { type: 'download-progress', percent: 55.5 })
    expect(status).toEqual({ state: 'downloading', version: '0.2.0', percent: 55.5 })
    status = reduceUpdate(status, { type: 'update-downloaded', version: '0.2.0' })
    expect(status).toEqual(ready)
  })

  it('becomes up-to-date when no update is available', () => {
    expect(reduceUpdate({ state: 'checking' }, { type: 'update-not-available' })).toEqual({
      state: 'up-to-date'
    })
  })

  it('can check again after an error', () => {
    const error = reduceUpdate({ state: 'checking' }, { type: 'error', message: 'offline' })
    expect(error).toEqual({ state: 'error', message: 'offline' })
    expect(shouldCheck(error)).toBe(true)
    expect(reduceUpdate(error, { type: 'check-started' })).toEqual({ state: 'checking' })
  })

  it('returns to idle on a quiet error from an automatic check', () => {
    expect(
      reduceUpdate({ state: 'checking' }, { type: 'error', message: 'offline', quiet: true })
    ).toEqual({ state: 'idle' })
  })

  it('reports a quiet error that happens while downloading', () => {
    expect(
      reduceUpdate(downloading, { type: 'error', message: 'checksum mismatch', quiet: true })
    ).toEqual({ state: 'error', message: 'checksum mismatch' })
  })

  it('reports an error that happens while downloading', () => {
    expect(reduceUpdate(downloading, { type: 'error', message: 'checksum mismatch' })).toEqual({
      state: 'error',
      message: 'checksum mismatch'
    })
  })

  it('keeps the download progress when a check starts or the same version is announced again', () => {
    expect(reduceUpdate(downloading, { type: 'check-started' })).toBe(downloading)
    expect(reduceUpdate(downloading, { type: 'update-available', version: '0.2.0' })).toBe(
      downloading
    )
  })

  it('ignores progress outside of downloading and clamps it to 0-100', () => {
    expect(reduceUpdate({ state: 'checking' }, { type: 'download-progress', percent: 10 })).toEqual(
      { state: 'checking' }
    )
    expect(reduceUpdate(downloading, { type: 'download-progress', percent: 120 })).toMatchObject({
      percent: 100
    })
    expect(reduceUpdate(downloading, { type: 'download-progress', percent: NaN })).toMatchObject({
      percent: 0
    })
  })

  it('ignores update-not-available unless a check is running', () => {
    expect(reduceUpdate(downloading, { type: 'update-not-available' })).toBe(downloading)
  })

  it('keeps a downloaded update through later checks and errors', () => {
    for (const event of [
      { type: 'check-started' },
      { type: 'update-not-available' },
      { type: 'update-available', version: '0.2.1' },
      { type: 'download-progress', percent: 10 },
      { type: 'error', message: 'offline' }
    ] as const) {
      expect(reduceUpdate(ready, event)).toBe(ready)
    }
  })

  it('replaces a downloaded update with a newer downloaded one', () => {
    expect(reduceUpdate(ready, { type: 'update-downloaded', version: '0.2.1' })).toEqual({
      state: 'ready',
      version: '0.2.1'
    })
  })

  it('never leaves the unsupported state', () => {
    const unsupported: UpdateStatus = { state: 'unsupported', reason: 'mas' }
    for (const event of [
      { type: 'check-started' },
      { type: 'update-available', version: '0.2.0' },
      { type: 'update-downloaded', version: '0.2.0' },
      { type: 'error', message: 'offline' }
    ] as const) {
      expect(reduceUpdate(unsupported, event)).toBe(unsupported)
    }
  })
})

describe('shouldCheck', () => {
  it('checks only from idle, up-to-date and error', () => {
    const statuses: [UpdateStatus, boolean][] = [
      [{ state: 'idle' }, true],
      [{ state: 'up-to-date' }, true],
      [{ state: 'error', message: 'offline' }, true],
      [{ state: 'checking' }, false],
      [downloading, false],
      [ready, false],
      [{ state: 'unsupported', reason: 'development' }, false]
    ]
    for (const [status, expected] of statuses) {
      expect(shouldCheck(status)).toBe(expected)
    }
  })
})

describe('shouldPromptRestart', () => {
  it('prompts for a ready version until it is dismissed', () => {
    expect(shouldPromptRestart(ready, null)).toBe(true)
    expect(shouldPromptRestart(ready, '0.2.0')).toBe(false)
    expect(shouldPromptRestart({ state: 'ready', version: '0.2.1' }, '0.2.0')).toBe(true)
  })

  it('does not prompt unless an update is ready', () => {
    expect(shouldPromptRestart(downloading, null)).toBe(false)
    expect(shouldPromptRestart({ state: 'idle' }, null)).toBe(false)
  })
})
