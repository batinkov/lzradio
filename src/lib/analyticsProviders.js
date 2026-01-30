/**
 * Analytics Providers
 *
 * Register analytics providers here. Each provider is a function that receives
 * a path (e.g., '/logbook') and sends tracking data to an analytics service.
 *
 * Providers are called automatically whenever analytics.trackPageview() is invoked.
 */

import { analytics } from './analytics.js'

/**
 * Development Logger Provider
 *
 * Logs pageview tracking to console in development mode.
 * Useful for debugging and verifying that tracking is working correctly.
 */
export const devLoggerProvider = (path) => {
  console.log('[Analytics] Tracked pageview:', path)
}

// Register dev logger only in development mode
if (import.meta.env.DEV) {
  analytics.register(devLoggerProvider)
}

/*
 * =============================================================================
 * PROVIDER TEMPLATES
 * =============================================================================
 *
 * When you're ready to add analytics providers, uncomment and configure
 * the examples below. Remember to:
 * 1. Add the analytics script tag to index.html first
 * 2. Configure the provider with your account details
 * 3. Test that tracking works in development mode
 */

/*
 * GoatCounter Provider
 * Free, open-source, privacy-friendly analytics
 *
 * Setup:
 * 1. Sign up at https://www.goatcounter.com
 * 2. Add to index.html:
 *    <script>window.goatcounter = { no_onload: true }</script>
 *    <script data-goatcounter="https://YOURCODE.goatcounter.com/count"
 *            async src="//gc.zgo.at/count.js"></script>
 * 3. Uncomment below:
 *
 * export const goatcounterProvider = (path) => {
 *   if (window.goatcounter) {
 *     window.goatcounter.count({
 *       path: '/#' + path  // Add hash prefix for hash-based routing
 *     })
 *   }
 * }
 * analytics.register(goatcounterProvider)
 */

/*
 * Plausible Analytics Provider (Manual Mode)
 * Privacy-friendly analytics with beautiful UI
 *
 * Setup:
 * 1. Sign up at https://plausible.io or self-host
 * 2. Add to index.html:
 *    <script>window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script>
 *    <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
 * 3. Uncomment below:
 *
 * export const plausibleProvider = (path) => {
 *   if (window.plausible) {
 *     window.plausible('pageview', {
 *       u: window.location.origin + '/#' + path  // Build full URL
 *     })
 *   }
 * }
 * analytics.register(plausibleProvider)
 */

/*
 * Plausible Analytics Provider (Auto Hash Mode)
 * Alternative approach using Plausible's built-in hash tracking
 *
 * Setup:
 * 1. Add to index.html (note the .hash.js file):
 *    <script defer data-domain="yourdomain.com"
 *            src="https://plausible.io/js/script.hash.js"></script>
 * 2. That's it! No provider registration needed - Plausible automatically
 *    tracks hash changes. You can remove the manual provider if using this.
 */

/*
 * Umami Analytics Provider
 * Open-source, privacy-focused analytics
 *
 * Setup:
 * 1. Sign up at https://umami.is or self-host
 * 2. Add to index.html:
 *    <script defer src="https://your-umami-instance.com/script.js"
 *            data-website-id="your-website-id"></script>
 * 3. Uncomment below:
 *
 * export const umamiProvider = (path) => {
 *   if (window.umami) {
 *     window.umami.track({
 *       url: '/#' + path
 *     })
 *   }
 * }
 * analytics.register(umamiProvider)
 */
