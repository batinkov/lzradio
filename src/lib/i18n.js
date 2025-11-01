/**
 * i18n Configuration
 *
 * Sets up svelte-i18n with:
 * - English (en) and Bulgarian (bg) support
 * - LocalStorage persistence for language preference
 * - Browser language detection as fallback
 */

import { register, init, getLocaleFromNavigator, locale } from 'svelte-i18n'

const STORAGE_KEY = 'lzradio-language'
const SUPPORTED_LOCALES = ['en', 'bg']
const DEFAULT_LOCALE = 'en'

// Register translation files
register('en', () => import('../locales/en.json'))
register('bg', () => import('../locales/bg.json'))

/**
 * Get initial locale from LocalStorage or browser
 */
function getInitialLocale() {
  // Try LocalStorage first
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored)) {
    return stored
  }

  // Try browser language
  const browserLocale = getLocaleFromNavigator()
  if (browserLocale) {
    // Extract language code (e.g., 'en-US' -> 'en', 'bg-BG' -> 'bg')
    const langCode = browserLocale.split('-')[0]
    if (SUPPORTED_LOCALES.includes(langCode)) {
      return langCode
    }
  }

  // Fallback to default
  return DEFAULT_LOCALE
}

/**
 * Initialize i18n
 */
export function setupI18n() {
  init({
    fallbackLocale: DEFAULT_LOCALE,
    initialLocale: getInitialLocale(),
  })
}

/**
 * Change language and persist to LocalStorage
 */
export function changeLanguage(newLocale) {
  if (!SUPPORTED_LOCALES.includes(newLocale)) {
    console.warn(`Unsupported locale: ${newLocale}`)
    return
  }

  locale.set(newLocale)
  localStorage.setItem(STORAGE_KEY, newLocale)
}

/**
 * Get current locale
 */
export { locale }

/**
 * Get list of supported locales
 */
export { SUPPORTED_LOCALES }
