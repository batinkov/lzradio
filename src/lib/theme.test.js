import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getInitialTheme, applyTheme, toggleTheme, theme, THEMES } from './theme.js'
import { localStorageAdapter } from './storage/localStorage.js'

describe('theme', () => {
  let mockDocumentElement
  let mockMatchMedia
  let originalLocalStorage

  beforeEach(() => {
    // Save original localStorage contents
    originalLocalStorage = localStorageAdapter.get('lzradio-theme')

    // Mock document.documentElement
    mockDocumentElement = {
      setAttribute: vi.fn()
    }
    global.document = {
      documentElement: mockDocumentElement
    }

    // Mock window.matchMedia
    mockMatchMedia = vi.fn()
    global.window = {
      matchMedia: mockMatchMedia
    }
  })

  afterEach(() => {
    // Restore original localStorage
    if (originalLocalStorage) {
      localStorageAdapter.set('lzradio-theme', originalLocalStorage)
    } else {
      localStorageAdapter.remove('lzradio-theme')
    }
  })

  describe('getInitialTheme', () => {
    it('should return stored theme from localStorage', () => {
      localStorageAdapter.set('lzradio-theme', 'dark')
      const result = getInitialTheme()
      expect(result).toBe('dark')
    })

    it('should return light theme stored in localStorage', () => {
      localStorageAdapter.set('lzradio-theme', 'light')
      const result = getInitialTheme()
      expect(result).toBe('light')
    })

    it('should return dark when no storage but system prefers dark', () => {
      mockMatchMedia.mockReturnValue({ matches: true })
      const result = getInitialTheme()
      expect(result).toBe('dark')
    })

    it('should return light when no storage and system prefers light', () => {
      mockMatchMedia.mockReturnValue({ matches: false })
      const result = getInitialTheme()
      expect(result).toBe('light')
    })

    it('should ignore invalid stored values and fallback to system preference', () => {
      localStorageAdapter.set('lzradio-theme', 'invalid-theme')
      mockMatchMedia.mockReturnValue({ matches: true })
      const result = getInitialTheme()
      expect(result).toBe('dark')
    })

    it('should return light as final fallback when no storage and no system preference', () => {
      mockMatchMedia.mockReturnValue({ matches: false })
      const result = getInitialTheme()
      expect(result).toBe('light')
    })
  })

  describe('applyTheme', () => {
    it('should set document attribute to dark', () => {
      applyTheme('dark')
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('should set document attribute to light', () => {
      applyTheme('light')
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    })

    it('should save theme to localStorage', () => {
      applyTheme('dark')
      const stored = localStorageAdapter.get('lzradio-theme')
      expect(stored).toBe('dark')
    })

    it('should update the theme store', () => {
      const themeValues = []
      const unsubscribe = theme.subscribe(value => {
        themeValues.push(value)
      })

      applyTheme('dark')
      expect(themeValues).toContain('dark')

      unsubscribe()
    })

    it('should not apply invalid theme values', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      applyTheme('invalid-theme')

      expect(consoleSpy).toHaveBeenCalledWith('Invalid theme: invalid-theme')
      expect(mockDocumentElement.setAttribute).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      // Set initial theme to light
      applyTheme('light')

      // Toggle
      toggleTheme()

      // Should now be dark
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('should toggle from dark to light', () => {
      // Set initial theme to dark
      applyTheme('dark')

      // Toggle
      toggleTheme()

      // Should now be light
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    })
  })

  describe('THEMES constant', () => {
    it('should export supported themes', () => {
      expect(THEMES).toEqual(['light', 'dark'])
    })
  })
})
