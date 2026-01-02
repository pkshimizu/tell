import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveThemePreference,
  getThemePreference,
  getSystemTheme,
  resolveTheme,
  getThemeColor
} from '../theme-utils'

describe('theme-utils', () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear()
    // matchMediaのモック
    vi.clearAllMocks()
  })

  describe('saveThemePreference', () => {
    it('should save theme preference to localStorage', () => {
      saveThemePreference('dark')
      expect(localStorage.getItem('theme-preference')).toBe('dark')

      saveThemePreference('light')
      expect(localStorage.getItem('theme-preference')).toBe('light')

      saveThemePreference('system')
      expect(localStorage.getItem('theme-preference')).toBe('system')
    })
  })

  describe('getThemePreference', () => {
    it('should return saved theme preference', () => {
      localStorage.setItem('theme-preference', 'dark')
      expect(getThemePreference()).toBe('dark')
    })

    it('should return system as default when no preference saved', () => {
      expect(getThemePreference()).toBe('system')
    })

    it('should return system for invalid saved value', () => {
      localStorage.setItem('theme-preference', 'invalid')
      expect(getThemePreference()).toBe('system')
    })
  })

  describe('getSystemTheme', () => {
    it('should return dark when system prefers dark mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      })

      expect(getSystemTheme()).toBe('dark')
    })

    it('should return light when system does not prefer dark mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: '',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      })

      expect(getSystemTheme()).toBe('light')
    })
  })

  describe('resolveTheme', () => {
    it('should return the mode directly for light or dark', () => {
      expect(resolveTheme('light')).toBe('light')
      expect(resolveTheme('dark')).toBe('dark')
    })

    it('should resolve system theme when mode is system', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: true,
          media: '',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      })

      expect(resolveTheme('system')).toBe('dark')
    })
  })

  describe('getThemeColor', () => {
    it('should return correct color for light theme', () => {
      expect(getThemeColor('light', 'primary')).toBe('#1976d2')
      expect(getThemeColor('light', 'background')).toBe('#ffffff')
      expect(getThemeColor('light', 'text')).toBe('#000000')
    })

    it('should return correct color for dark theme', () => {
      expect(getThemeColor('dark', 'primary')).toBe('#90caf9')
      expect(getThemeColor('dark', 'background')).toBe('#121212')
      expect(getThemeColor('dark', 'text')).toBe('#ffffff')
    })
  })
})