import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import {
  shouldEnableGuards,
  enableNavigationGuards,
  disableNavigationGuards,
  cleanupNavigationGuards,
  navigationBlocked
} from './navigationGuard.js'
import { languageSwitchingDisabled } from './i18n.js'

describe('navigationGuard', () => {
  describe('shouldEnableGuards', () => {
    it('should return true for IN_PROGRESS state', () => {
      expect(shouldEnableGuards('IN_PROGRESS')).toBe(true)
    })

    it('should return true for REVIEW state', () => {
      expect(shouldEnableGuards('REVIEW')).toBe(true)
    })

    it('should return false for NOT_STARTED state', () => {
      expect(shouldEnableGuards('NOT_STARTED')).toBe(false)
    })

    it('should return false for COMPLETED state', () => {
      expect(shouldEnableGuards('COMPLETED')).toBe(false)
    })

    it('should return false for invalid states', () => {
      expect(shouldEnableGuards('')).toBe(false)
      expect(shouldEnableGuards('INVALID')).toBe(false)
      expect(shouldEnableGuards(null)).toBe(false)
      expect(shouldEnableGuards(undefined)).toBe(false)
    })
  })

  describe('enableNavigationGuards', () => {
    let mockWindow

    beforeEach(() => {
      // Reset stores
      navigationBlocked.set(false)
      languageSwitchingDisabled.set(false)

      // Create mock window object
      mockWindow = {
        onbeforeunload: null
      }
    })

    it('should set window.onbeforeunload handler', () => {
      enableNavigationGuards({ window: mockWindow })

      expect(mockWindow.onbeforeunload).toBeTypeOf('function')
      expect(mockWindow.onbeforeunload()).toContain('exam progress will be lost')
    })

    it('should use custom warning message', () => {
      const customMessage = 'Custom warning message'
      enableNavigationGuards({
        window: mockWindow,
        warningMessage: customMessage
      })

      expect(mockWindow.onbeforeunload()).toBe(customMessage)
    })

    it('should set languageSwitchingDisabled to true', () => {
      enableNavigationGuards({ window: mockWindow })

      expect(get(languageSwitchingDisabled)).toBe(true)
    })

    it('should set navigationBlocked to true', () => {
      enableNavigationGuards({ window: mockWindow })

      expect(get(navigationBlocked)).toBe(true)
    })

    it('should handle missing window object gracefully', () => {
      expect(() => {
        enableNavigationGuards({ window: null })
      }).not.toThrow()

      // Stores should still be set
      expect(get(navigationBlocked)).toBe(true)
      expect(get(languageSwitchingDisabled)).toBe(true)
    })

    it('should set all guards together', () => {
      enableNavigationGuards({ window: mockWindow })

      expect(mockWindow.onbeforeunload).toBeTypeOf('function')
      expect(get(languageSwitchingDisabled)).toBe(true)
      expect(get(navigationBlocked)).toBe(true)
    })
  })

  describe('disableNavigationGuards', () => {
    let mockWindow

    beforeEach(() => {
      // Set up initial state (guards enabled)
      mockWindow = {
        onbeforeunload: () => 'warning'
      }
      navigationBlocked.set(true)
      languageSwitchingDisabled.set(true)
    })

    it('should remove window.onbeforeunload handler', () => {
      disableNavigationGuards({ window: mockWindow })

      expect(mockWindow.onbeforeunload).toBeNull()
    })

    it('should set languageSwitchingDisabled to false', () => {
      disableNavigationGuards({ window: mockWindow })

      expect(get(languageSwitchingDisabled)).toBe(false)
    })

    it('should set navigationBlocked to false', () => {
      disableNavigationGuards({ window: mockWindow })

      expect(get(navigationBlocked)).toBe(false)
    })

    it('should handle missing window object gracefully', () => {
      expect(() => {
        disableNavigationGuards({ window: null })
      }).not.toThrow()

      // Stores should still be updated
      expect(get(navigationBlocked)).toBe(false)
      expect(get(languageSwitchingDisabled)).toBe(false)
    })

    it('should disable all guards together', () => {
      disableNavigationGuards({ window: mockWindow })

      expect(mockWindow.onbeforeunload).toBeNull()
      expect(get(languageSwitchingDisabled)).toBe(false)
      expect(get(navigationBlocked)).toBe(false)
    })
  })

  describe('cleanupNavigationGuards', () => {
    it('should be an alias for disableNavigationGuards', () => {
      const mockWindow = {
        onbeforeunload: () => 'warning'
      }
      navigationBlocked.set(true)
      languageSwitchingDisabled.set(true)

      cleanupNavigationGuards({ window: mockWindow })

      expect(mockWindow.onbeforeunload).toBeNull()
      expect(get(languageSwitchingDisabled)).toBe(false)
      expect(get(navigationBlocked)).toBe(false)
    })
  })

  describe('enable and disable cycle', () => {
    it('should correctly enable and then disable guards', () => {
      const mockWindow = { onbeforeunload: null }

      // Initially disabled
      expect(get(navigationBlocked)).toBe(false)
      expect(get(languageSwitchingDisabled)).toBe(false)
      expect(mockWindow.onbeforeunload).toBeNull()

      // Enable
      enableNavigationGuards({ window: mockWindow })
      expect(get(navigationBlocked)).toBe(true)
      expect(get(languageSwitchingDisabled)).toBe(true)
      expect(mockWindow.onbeforeunload).toBeTypeOf('function')

      // Disable
      disableNavigationGuards({ window: mockWindow })
      expect(get(navigationBlocked)).toBe(false)
      expect(get(languageSwitchingDisabled)).toBe(false)
      expect(mockWindow.onbeforeunload).toBeNull()
    })

    it('should handle multiple enable/disable cycles', () => {
      const mockWindow = { onbeforeunload: null }

      for (let i = 0; i < 3; i++) {
        enableNavigationGuards({ window: mockWindow })
        expect(get(navigationBlocked)).toBe(true)

        disableNavigationGuards({ window: mockWindow })
        expect(get(navigationBlocked)).toBe(false)
      }
    })
  })

  describe('integration with exam states', () => {
    it('should enable guards when exam is in progress', () => {
      const mockWindow = { onbeforeunload: null }
      const examState = 'IN_PROGRESS'

      if (shouldEnableGuards(examState)) {
        enableNavigationGuards({ window: mockWindow })
      }

      expect(get(navigationBlocked)).toBe(true)
    })

    it('should not enable guards when exam is not started', () => {
      const mockWindow = { onbeforeunload: null }
      const examState = 'NOT_STARTED'

      if (shouldEnableGuards(examState)) {
        enableNavigationGuards({ window: mockWindow })
      } else {
        disableNavigationGuards({ window: mockWindow })
      }

      expect(get(navigationBlocked)).toBe(false)
    })

    it('should enable guards in review mode', () => {
      const mockWindow = { onbeforeunload: null }
      const examState = 'REVIEW'

      if (shouldEnableGuards(examState)) {
        enableNavigationGuards({ window: mockWindow })
      }

      expect(get(navigationBlocked)).toBe(true)
    })

    it('should disable guards when exam is completed', () => {
      const mockWindow = { onbeforeunload: null }

      // Enable first
      enableNavigationGuards({ window: mockWindow })
      expect(get(navigationBlocked)).toBe(true)

      // Then complete exam
      const examState = 'COMPLETED'
      if (!shouldEnableGuards(examState)) {
        disableNavigationGuards({ window: mockWindow })
      }

      expect(get(navigationBlocked)).toBe(false)
    })
  })
})
