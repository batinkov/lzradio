import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createAnalytics } from './analytics.js'

describe('Analytics Store', () => {
  let analytics

  beforeEach(() => {
    // Create fresh instance for each test to avoid shared state
    analytics = createAnalytics()
  })

  describe('Provider Registration', () => {
    it('should register a provider', () => {
      const provider = vi.fn()
      analytics.register(provider)
      expect(analytics._getProviderCount()).toBe(1)
    })

    it('should register multiple providers', () => {
      const provider1 = vi.fn()
      const provider2 = vi.fn()
      const provider3 = vi.fn()

      analytics.register(provider1)
      analytics.register(provider2)
      analytics.register(provider3)

      expect(analytics._getProviderCount()).toBe(3)
    })

    it('should throw TypeError when registering non-function', () => {
      expect(() => analytics.register('not a function')).toThrow(TypeError)
      expect(() => analytics.register('not a function')).toThrow('Provider must be a function')
      expect(() => analytics.register(null)).toThrow(TypeError)
      expect(() => analytics.register(undefined)).toThrow(TypeError)
      expect(() => analytics.register(123)).toThrow(TypeError)
      expect(() => analytics.register({})).toThrow(TypeError)
    })

    it('should allow registering the same provider multiple times', () => {
      const provider = vi.fn()
      analytics.register(provider)
      analytics.register(provider)
      expect(analytics._getProviderCount()).toBe(2)
    })
  })

  describe('Provider Unregistration', () => {
    it('should unregister a provider', () => {
      const provider = vi.fn()
      analytics.register(provider)
      expect(analytics._getProviderCount()).toBe(1)

      const result = analytics.unregister(provider)
      expect(result).toBe(true)
      expect(analytics._getProviderCount()).toBe(0)
    })

    it('should return false when unregistering non-existent provider', () => {
      const provider = vi.fn()
      const result = analytics.unregister(provider)
      expect(result).toBe(false)
    })

    it('should only remove first occurrence when provider registered multiple times', () => {
      const provider = vi.fn()
      analytics.register(provider)
      analytics.register(provider)
      expect(analytics._getProviderCount()).toBe(2)

      analytics.unregister(provider)
      expect(analytics._getProviderCount()).toBe(1)

      analytics.unregister(provider)
      expect(analytics._getProviderCount()).toBe(0)
    })

    it('should unregister correct provider when multiple exist', () => {
      const provider1 = vi.fn()
      const provider2 = vi.fn()
      const provider3 = vi.fn()

      analytics.register(provider1)
      analytics.register(provider2)
      analytics.register(provider3)

      analytics.unregister(provider2)

      expect(analytics._getProviderCount()).toBe(2)

      // Verify provider2 is actually removed by tracking pageview
      analytics.trackPageview('/test')
      expect(provider1).toHaveBeenCalled()
      expect(provider2).not.toHaveBeenCalled()
      expect(provider3).toHaveBeenCalled()
    })
  })

  describe('Pageview Tracking', () => {
    it('should call all registered providers when tracking pageview', () => {
      const provider1 = vi.fn()
      const provider2 = vi.fn()
      const provider3 = vi.fn()

      analytics.register(provider1)
      analytics.register(provider2)
      analytics.register(provider3)

      analytics.trackPageview('/logbook')

      expect(provider1).toHaveBeenCalledWith('/logbook')
      expect(provider2).toHaveBeenCalledWith('/logbook')
      expect(provider3).toHaveBeenCalledWith('/logbook')
    })

    it('should pass correct path to providers', () => {
      const provider = vi.fn()
      analytics.register(provider)

      analytics.trackPageview('/exam/class1')
      expect(provider).toHaveBeenCalledWith('/exam/class1')

      analytics.trackPageview('/')
      expect(provider).toHaveBeenCalledWith('/')

      analytics.trackPageview('/logbook/add')
      expect(provider).toHaveBeenCalledWith('/logbook/add')
    })

    it('should handle tracking with no providers registered', () => {
      // Should not throw
      expect(() => analytics.trackPageview('/test')).not.toThrow()
    })

    it('should call providers in registration order', () => {
      const callOrder = []
      const provider1 = vi.fn(() => callOrder.push('provider1'))
      const provider2 = vi.fn(() => callOrder.push('provider2'))
      const provider3 = vi.fn(() => callOrder.push('provider3'))

      analytics.register(provider1)
      analytics.register(provider2)
      analytics.register(provider3)

      analytics.trackPageview('/test')

      expect(callOrder).toEqual(['provider1', 'provider2', 'provider3'])
    })
  })

  describe('Error Handling', () => {
    let consoleErrorSpy

    beforeEach(() => {
      // Suppress console output during error handling tests
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      // Restore console
      consoleErrorSpy.mockRestore()
    })

    it('should handle provider errors gracefully', () => {
      const errorProvider = vi.fn(() => {
        throw new Error('Provider failed')
      })
      const goodProvider = vi.fn()

      analytics.register(errorProvider)
      analytics.register(goodProvider)

      // Should not throw - errors are caught internally
      expect(() => analytics.trackPageview('/test')).not.toThrow()

      // Good provider should still be called
      expect(goodProvider).toHaveBeenCalledWith('/test')
    })

    it('should log provider errors to console', () => {
      // Note: consoleErrorSpy is already set up in beforeEach
      const error = new Error('Provider failed')
      const errorProvider = vi.fn(() => {
        throw error
      })

      analytics.register(errorProvider)
      analytics.trackPageview('/test')

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Analytics] Provider error:', error)
    })

    it('should continue calling remaining providers after one fails', () => {
      const provider1 = vi.fn()
      const errorProvider = vi.fn(() => {
        throw new Error('fail')
      })
      const provider2 = vi.fn()

      analytics.register(provider1)
      analytics.register(errorProvider)
      analytics.register(provider2)

      analytics.trackPageview('/test')

      expect(provider1).toHaveBeenCalled()
      expect(provider2).toHaveBeenCalled()
    })

    it('should handle multiple failing providers', () => {
      const errorProvider1 = vi.fn(() => {
        throw new Error('fail1')
      })
      const errorProvider2 = vi.fn(() => {
        throw new Error('fail2')
      })
      const goodProvider = vi.fn()

      analytics.register(errorProvider1)
      analytics.register(errorProvider2)
      analytics.register(goodProvider)

      expect(() => analytics.trackPageview('/test')).not.toThrow()
      expect(goodProvider).toHaveBeenCalled()
    })
  })

  describe('Test Helpers', () => {
    it('should clear all providers with _clearProviders', () => {
      analytics.register(vi.fn())
      analytics.register(vi.fn())
      analytics.register(vi.fn())

      expect(analytics._getProviderCount()).toBe(3)

      analytics._clearProviders()

      expect(analytics._getProviderCount()).toBe(0)
    })

    it('should not call providers after clearing', () => {
      const provider = vi.fn()
      analytics.register(provider)
      analytics._clearProviders()

      analytics.trackPageview('/test')

      expect(provider).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty path string', () => {
      const provider = vi.fn()
      analytics.register(provider)

      analytics.trackPageview('')
      expect(provider).toHaveBeenCalledWith('')
    })

    it('should handle special characters in path', () => {
      const provider = vi.fn()
      analytics.register(provider)

      const specialPath = '/exam?query=test&foo=bar#section'
      analytics.trackPageview(specialPath)
      expect(provider).toHaveBeenCalledWith(specialPath)
    })

    it('should handle unicode characters in path', () => {
      const provider = vi.fn()
      analytics.register(provider)

      const unicodePath = '/екзамен/клас1'
      analytics.trackPageview(unicodePath)
      expect(provider).toHaveBeenCalledWith(unicodePath)
    })

    it('should handle rapid successive tracking calls', () => {
      const provider = vi.fn()
      analytics.register(provider)

      analytics.trackPageview('/page1')
      analytics.trackPageview('/page2')
      analytics.trackPageview('/page3')
      analytics.trackPageview('/page4')
      analytics.trackPageview('/page5')

      expect(provider).toHaveBeenCalledTimes(5)
    })
  })

  describe('Factory Pattern', () => {
    it('should create independent instances', () => {
      const instance1 = createAnalytics()
      const instance2 = createAnalytics()

      const provider1 = vi.fn()
      const provider2 = vi.fn()

      instance1.register(provider1)
      instance2.register(provider2)

      expect(instance1._getProviderCount()).toBe(1)
      expect(instance2._getProviderCount()).toBe(1)

      // Track in instance1 - only provider1 should be called
      instance1.trackPageview('/test')
      expect(provider1).toHaveBeenCalled()
      expect(provider2).not.toHaveBeenCalled()
    })
  })
})
