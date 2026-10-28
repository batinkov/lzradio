import { describe, it, expect, beforeAll } from 'vitest'
import { loadCodes } from './codes.js'
import { createCodesIndex, normalizeCodeQuery, searchCodes, splitCodeMatch } from './codesSearch.js'

let codes
let index

beforeAll(async () => {
  codes = await loadCodes()
  index = createCodesIndex(codes)
})

/**
 * Codes of the matching entries in one category
 */
function codesIn(result, categoryId) {
  return result.categories.find((category) => category.id === categoryId).entries.map((e) => e.code)
}

/**
 * Codes of all matching entries, category by category
 */
function allCodes(result) {
  return result.categories.flatMap((category) => category.entries.map((e) => e.code))
}

describe('codesSearch', () => {
  describe('normalizeCodeQuery', () => {
    it('should ignore case and surrounding whitespace', () => {
      expect(normalizeCodeQuery('  qth ')).toBe('QTH')
    })

    it('should drop a trailing question mark', () => {
      expect(normalizeCodeQuery('qrm?')).toBe('QRM')
      expect(normalizeCodeQuery('qrm ? ')).toBe('QRM')
    })

    it('should return an empty string for a blank query', () => {
      expect(normalizeCodeQuery('   ')).toBe('')
      expect(normalizeCodeQuery('?')).toBe('')
    })
  })

  describe('splitCodeMatch', () => {
    it('should split off the matched prefix', () => {
      expect(splitCodeMatch('QTH', 'qt')).toEqual({ match: 'QT', rest: 'H' })
    })

    it('should match the whole code', () => {
      expect(splitCodeMatch('QTH', 'QTH')).toEqual({ match: 'QTH', rest: '' })
    })

    it('should match a single letter and ignore a trailing question mark', () => {
      expect(splitCodeMatch('K', 'k')).toEqual({ match: 'K', rest: '' })
      expect(splitCodeMatch('QRM', ' qrm? ')).toEqual({ match: 'QRM', rest: '' })
    })

    it('should return null when the code does not start with the query', () => {
      expect(splitCodeMatch('QTH', 'th')).toBeNull()
      expect(splitCodeMatch('QTH', 'location')).toBeNull()
    })

    it('should return null for an empty query', () => {
      expect(splitCodeMatch('QTH', '  ')).toBeNull()
    })
  })

  describe('searchCodes', () => {
    describe('empty query', () => {
      it('should return everything in data order', () => {
        const result = searchCodes(codes, '', index)
        expect(result.categories).toEqual(codes.categories)
        expect(result.rst).toBe(true)
      })

      it('should treat whitespace as empty', () => {
        expect(searchCodes(codes, '   ', index).categories).toEqual(codes.categories)
      })
    })

    describe('code matches', () => {
      it('should return QRM and not QRN or QRP for QRM', () => {
        const result = searchCodes(codes, 'QRM', index)
        expect(allCodes(result)).toEqual(['QRM'])
        expect(result.rst).toBe(false)
      })

      it('should ignore case and a trailing question mark', () => {
        expect(allCodes(searchCodes(codes, 'qrm?', index))).toEqual(['QRM'])
      })

      it('should find a prosign by its alias', () => {
        expect(codesIn(searchCodes(codes, 'va', index), 'prosigns')).toEqual(['SK'])
      })

      it('should find a number code', () => {
        expect(allCodes(searchCodes(codes, '73', index))).toEqual(['73'])
      })

      it('should find a single-letter code, exact match first', () => {
        const abbreviations = codesIn(searchCodes(codes, 'k', index), 'abbreviations')
        expect(abbreviations[0]).toBe('K')
        expect(abbreviations).toContain('KN')
      })

      it('should list prefix matches after the exact match', () => {
        const result = searchCodes(codes, 'qr', index)
        const qCodes = codesIn(result, 'q-codes')
        expect(qCodes.length).toBeGreaterThan(1)
        expect(qCodes.every((code) => code.startsWith('QR'))).toBe(true)
      })

      it('should keep categories without matches, empty', () => {
        const result = searchCodes(codes, 'QRM', index)
        expect(result.categories.map((c) => c.id)).toEqual(codes.categories.map((c) => c.id))
        expect(codesIn(result, 'prosigns')).toEqual([])
      })
    })

    describe('RST', () => {
      it.each(['59', '599', '5nn', 'rst', 'RST?'])('should match RST for %s', (query) => {
        expect(searchCodes(codes, query, index).rst).toBe(true)
      })

      it('should also return the 5NN abbreviation for 5nn', () => {
        expect(codesIn(searchCodes(codes, '5nn', index), 'abbreviations')).toEqual(['5NN'])
      })

      it('should match RST by its description', () => {
        expect(searchCodes(codes, 'signal report', index).rst).toBe(true)
      })

      it('should match RST by its scale names', () => {
        expect(searchCodes(codes, 'readability', index).rst).toBe(true)
        expect(searchCodes(codes, 'strength', index).rst).toBe(true)
      })
    })

    describe('meaning matches', () => {
      it('should return QTH for location', () => {
        expect(codesIn(searchCodes(codes, 'location', index), 'q-codes')).toContain('QTH')
      })

      it('should match words in abbreviation meanings', () => {
        expect(allCodes(searchCodes(codes, 'thanks', index))).toContain('TNX')
      })

      it('should not run for a single character without a code match', () => {
        const result = searchCodes(codes, 'ж', index)
        expect(allCodes(result)).toEqual([])
        expect(result.rst).toBe(false)
      })
    })

    describe('no matches', () => {
      it('should return empty categories', () => {
        const result = searchCodes(codes, 'xyzzyplugh', index)
        expect(result.categories.every((category) => category.entries.length === 0)).toBe(true)
        expect(result.rst).toBe(false)
      })
    })

    describe('Bulgarian data', () => {
      let bg
      let bgIndex

      beforeAll(async () => {
        bg = await loadCodes('bg')
        bgIndex = createCodesIndex(bg)
      })

      it('should find QTH by its official Bulgarian meaning, in any case and with a typo', () => {
        for (const query of ['местонахождение', 'Местонахождение', 'местонахождене']) {
          expect(codesIn(searchCodes(bg, query, bgIndex), 'q-codes')).toContain('QTH')
        }
      })

      it('should find codes by the wording of the exam questions', () => {
        expect(allCodes(searchCodes(bg, 'викам всички', bgIndex))).toContain('CQ')
        expect(allCodes(searchCodes(bg, 'най-добри пожелания', bgIndex))).toContain('73')
        expect(allCodes(searchCodes(bg, 'смущения', bgIndex))).toEqual(
          expect.arrayContaining(['QRM', 'QRN'])
        )
      })

      it('should find RST by its Bulgarian scale names', () => {
        expect(searchCodes(bg, 'разбираемост', bgIndex).rst).toBe(true)
      })

      it('should match codes the same way as in English', () => {
        expect(allCodes(searchCodes(bg, 'qth', bgIndex))).toEqual(['QTH'])
        expect(searchCodes(bg, '5nn', bgIndex).rst).toBe(true)
      })

      it('should not match English meaning text', () => {
        const result = searchCodes(bg, 'location', bgIndex)
        expect(allCodes(result)).toEqual([])
        expect(result.rst).toBe(false)
      })
    })

    it('should build its own index when none is given', () => {
      expect(allCodes(searchCodes(codes, 'QRM'))).toEqual(['QRM'])
    })
  })
})
