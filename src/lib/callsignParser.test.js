import { describe, it, expect } from 'vitest'
import { parseCallsign, buildCallsign } from './callsignParser.js'

describe('callsignParser', () => {
  describe('parseCallsign', () => {
    it('should parse simple callsign without prefix or suffix', () => {
      const result = parseCallsign('W1ABC')
      expect(result).toEqual({
        base: 'W1ABC',
        prefix: null,
        suffix: null
      })
    })

    it('should parse callsign with suffix', () => {
      const result = parseCallsign('W1ABC/M')
      expect(result).toEqual({
        base: 'W1ABC',
        prefix: null,
        suffix: 'M'
      })
    })

    it('should parse callsign with prefix', () => {
      const result = parseCallsign('HB/W1ABC')
      expect(result).toEqual({
        base: 'W1ABC',
        prefix: 'HB',
        suffix: null
      })
    })

    it('should parse callsign with both prefix and suffix', () => {
      const result = parseCallsign('HB/W1ABC/P')
      expect(result).toEqual({
        base: 'W1ABC',
        prefix: 'HB',
        suffix: 'P'
      })
    })

    it('should convert callsign to uppercase', () => {
      const result = parseCallsign('w1abc/m')
      expect(result).toEqual({
        base: 'W1ABC',
        prefix: null,
        suffix: 'M'
      })
    })

    it('should trim whitespace', () => {
      const result = parseCallsign('  W1ABC/M  ')
      expect(result).toEqual({
        base: 'W1ABC',
        prefix: null,
        suffix: 'M'
      })
    })

    it('should handle various prefix lengths (1-3 chars)', () => {
      expect(parseCallsign('G/W1ABC')).toEqual({
        base: 'W1ABC',
        prefix: 'G',
        suffix: null
      })
      expect(parseCallsign('HB/W1ABC')).toEqual({
        base: 'W1ABC',
        prefix: 'HB',
        suffix: null
      })
      expect(parseCallsign('HB0/W1ABC')).toEqual({
        base: 'W1ABC',
        prefix: 'HB0',
        suffix: null
      })
    })

    it('should treat long first part as base callsign with suffix', () => {
      // If first part is > 3 chars, it's likely base/suffix
      const result = parseCallsign('W1ABC/QRP')
      expect(result).toEqual({
        base: 'W1ABC',
        prefix: null,
        suffix: 'QRP'
      })
    })

    it('should handle empty string', () => {
      const result = parseCallsign('')
      expect(result).toEqual({
        base: '',
        prefix: null,
        suffix: null
      })
    })

    it('should handle null input', () => {
      const result = parseCallsign(null)
      expect(result).toEqual({
        base: '',
        prefix: null,
        suffix: null
      })
    })

    it('should handle undefined input', () => {
      const result = parseCallsign(undefined)
      expect(result).toEqual({
        base: '',
        prefix: null,
        suffix: null
      })
    })

    it('should handle non-string input', () => {
      const result = parseCallsign(123)
      expect(result).toEqual({
        base: '',
        prefix: null,
        suffix: null
      })
    })

    it('should handle unusual formats with 4+ parts as base', () => {
      const result = parseCallsign('A/B/C/D')
      expect(result).toEqual({
        base: 'A/B/C/D',
        prefix: null,
        suffix: null
      })
    })
  })

  describe('buildCallsign', () => {
    it('should build simple callsign without prefix or suffix', () => {
      const result = buildCallsign('W1ABC', null, null)
      expect(result).toBe('W1ABC')
    })

    it('should build callsign with suffix only', () => {
      const result = buildCallsign('W1ABC', null, 'M')
      expect(result).toBe('W1ABC/M')
    })

    it('should build callsign with prefix only', () => {
      const result = buildCallsign('W1ABC', 'HB', null)
      expect(result).toBe('HB/W1ABC')
    })

    it('should build callsign with both prefix and suffix', () => {
      const result = buildCallsign('W1ABC', 'HB', 'P')
      expect(result).toBe('HB/W1ABC/P')
    })

    it('should handle undefined prefix/suffix as null', () => {
      const result = buildCallsign('W1ABC', undefined, undefined)
      expect(result).toBe('W1ABC')
    })

    it('should handle empty string prefix/suffix', () => {
      const result = buildCallsign('W1ABC', '', '')
      expect(result).toBe('W1ABC')
    })
  })

  describe('roundtrip parsing and building', () => {
    it('should correctly roundtrip simple callsign', () => {
      const original = 'W1ABC'
      const parsed = parseCallsign(original)
      const rebuilt = buildCallsign(parsed.base, parsed.prefix, parsed.suffix)
      expect(rebuilt).toBe(original)
    })

    it('should correctly roundtrip callsign with suffix', () => {
      const original = 'W1ABC/M'
      const parsed = parseCallsign(original)
      const rebuilt = buildCallsign(parsed.base, parsed.prefix, parsed.suffix)
      expect(rebuilt).toBe(original)
    })

    it('should correctly roundtrip callsign with prefix', () => {
      const original = 'HB/W1ABC'
      const parsed = parseCallsign(original)
      const rebuilt = buildCallsign(parsed.base, parsed.prefix, parsed.suffix)
      expect(rebuilt).toBe(original)
    })

    it('should correctly roundtrip callsign with prefix and suffix', () => {
      const original = 'HB/W1ABC/P'
      const parsed = parseCallsign(original)
      const rebuilt = buildCallsign(parsed.base, parsed.prefix, parsed.suffix)
      expect(rebuilt).toBe(original)
    })
  })
})
