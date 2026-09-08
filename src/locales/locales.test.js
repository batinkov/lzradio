import { describe, it, expect } from 'vitest'
import en from './en.json'
import bg from './bg.json'

/**
 * Locale file consistency tests
 *
 * A key present in one locale but missing from the other makes svelte-i18n
 * render the raw key path (e.g. "about.updatedTo") to users of that language.
 * Mismatched interpolation placeholders are worse: the string renders, but
 * silently drops the value it was supposed to show.
 */

/**
 * Flatten a nested translation object into dot-separated leaf paths.
 * { about: { version: 'Version' } } -> { 'about.version': 'Version' }
 */
function flatten(obj, prefix = '') {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, path))
    } else {
      result[path] = value
    }
  }
  return result
}

/**
 * Extract interpolation placeholder names from a message.
 * 'Min {count} correct to pass' -> ['count']
 */
function placeholders(message) {
  const matches = String(message).match(/\{[^}]+\}/g) || []
  return matches.map((m) => m.slice(1, -1).split(',')[0].trim()).sort()
}

const flatEn = flatten(en)
const flatBg = flatten(bg)

describe('locales', () => {
  describe('key parity', () => {
    it('should not have keys in English that are missing from Bulgarian', () => {
      const missing = Object.keys(flatEn).filter((key) => !(key in flatBg))
      expect(missing).toEqual([])
    })

    it('should not have keys in Bulgarian that are missing from English', () => {
      const missing = Object.keys(flatBg).filter((key) => !(key in flatEn))
      expect(missing).toEqual([])
    })
  })

  describe('interpolation placeholders', () => {
    it('should use the same placeholders in both locales for every shared key', () => {
      const mismatched = Object.keys(flatEn)
        .filter((key) => key in flatBg)
        .filter((key) => {
          const a = placeholders(flatEn[key])
          const b = placeholders(flatBg[key])
          return a.join('|') !== b.join('|')
        })
        .map((key) => ({
          key,
          en: placeholders(flatEn[key]),
          bg: placeholders(flatBg[key])
        }))

      expect(mismatched).toEqual([])
    })
  })

  describe('values', () => {
    it('should have a non-empty string for every English key', () => {
      const invalid = Object.entries(flatEn)
        .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
        .map(([key]) => key)

      expect(invalid).toEqual([])
    })

    it('should have a non-empty string for every Bulgarian key', () => {
      const invalid = Object.entries(flatBg)
        .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
        .map(([key]) => key)

      expect(invalid).toEqual([])
    })

    it('should not leave Bulgarian values copied verbatim from English', () => {
      // No key currently shares a value across locales. If a proper noun or
      // abbreviation legitimately does, add it to an exceptions list here
      // rather than deleting this check.
      const untranslated = Object.keys(flatEn)
        .filter((key) => key in flatBg)
        .filter((key) => flatEn[key] === flatBg[key])

      expect(untranslated).toEqual([])
    })
  })
})
