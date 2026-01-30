/**
 * Analytics Observer Pattern
 *
 * Provides a centralized system for tracking pageviews across multiple analytics providers.
 * Uses the observer pattern - register providers once, track pageviews everywhere.
 *
 * @example
 * // Register providers
 * analytics.register(goatcounterProvider)
 * analytics.register(plausibleProvider)
 *
 * // Track pageviews
 * analytics.trackPageview('/logbook')
 */

/**
 * Create an analytics instance with observer pattern
 *
 * @returns {Object} Analytics instance with register, unregister, and trackPageview methods
 */
export const createAnalytics = () => {
  const providers = []

  return {
    /**
     * Register an analytics provider
     *
     * @param {Function} providerFn - Function that receives (path) => void
     * @throws {TypeError} If providerFn is not a function
     *
     * @example
     * analytics.register((path) => {
     *   window.goatcounter?.count({ path: '/#' + path })
     * })
     */
    register(providerFn) {
      if (typeof providerFn !== 'function') {
        throw new TypeError('Provider must be a function')
      }
      providers.push(providerFn)
    },

    /**
     * Unregister a provider
     *
     * @param {Function} providerFn - The provider function to remove
     * @returns {boolean} True if provider was found and removed, false otherwise
     */
    unregister(providerFn) {
      const index = providers.indexOf(providerFn)
      if (index > -1) {
        providers.splice(index, 1)
        return true
      }
      return false
    },

    /**
     * Track a pageview - notifies all registered providers
     *
     * Errors in individual providers are caught and logged to prevent
     * one failing provider from breaking others.
     *
     * @param {string} path - The route path (e.g., '/logbook', '/exam/class1')
     *
     * @example
     * analytics.trackPageview('/logbook')
     */
    trackPageview(path) {
      providers.forEach(provider => {
        try {
          provider(path)
        } catch (error) {
          // Isolate errors - one provider failing doesn't break others
          console.error('[Analytics] Provider error:', error)
        }
      })
    },

    /**
     * Get the number of registered providers
     * For testing purposes only
     *
     * @private
     * @returns {number} Number of registered providers
     */
    _getProviderCount() {
      return providers.length
    },

    /**
     * Clear all registered providers
     * For testing purposes only
     *
     * @private
     */
    _clearProviders() {
      providers.length = 0
    }
  }
}

/**
 * Singleton analytics instance for application use
 * Import this in your components to track pageviews
 */
export const analytics = createAnalytics()
