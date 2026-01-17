import { describe, it, expect } from 'vitest'
import { createFuseInstance, filterContacts, highlightMatch } from './logbookSearch.js'

describe('logbookSearch', () => {
  describe('filterContacts', () => {
    const mockContacts = [
      { id: 1, fullCallsign: 'LZ1ABC', remarks: 'First contact' },
      { id: 2, fullCallsign: 'LZ2XYZ', remarks: 'Second contact' },
      { id: 3, fullCallsign: 'LZ1XBC', remarks: 'Third contact' },
      { id: 4, fullCallsign: 'W1AW', remarks: 'ARRL HQ station' },
      { id: 5, fullCallsign: 'K1ABC', remarks: '' }
    ]

    it('returns all contacts when query < 2 characters', () => {
      const fuse = createFuseInstance(mockContacts)
      const result = filterContacts(mockContacts, 'a', fuse)
      expect(result).toEqual(mockContacts)
    })

    it('returns all contacts when query is empty string', () => {
      const fuse = createFuseInstance(mockContacts)
      const result = filterContacts(mockContacts, '', fuse)
      expect(result).toEqual(mockContacts)
    })

    it('returns all contacts when query is only whitespace', () => {
      const fuse = createFuseInstance(mockContacts)
      const result = filterContacts(mockContacts, '   ', fuse)
      expect(result).toEqual(mockContacts)
    })

    it('filters contacts when query >= 2 characters', () => {
      const fuse = createFuseInstance(mockContacts)
      const result = filterContacts(mockContacts, 'LZ1', fuse)
      expect(result.length).toBeGreaterThan(0)
      expect(result.length).toBeLessThan(mockContacts.length)
    })

    it('performs case-insensitive search', () => {
      const fuse = createFuseInstance(mockContacts)
      const result = filterContacts(mockContacts, 'lz1abc', fuse)
      expect(result.length).toBeGreaterThan(0)
      const callsigns = result.map(c => c.fullCallsign)
      expect(callsigns).toContain('LZ1ABC')
    })

    it('fuzzy matches similar callsigns', () => {
      const fuse = createFuseInstance(mockContacts)
      const result = filterContacts(mockContacts, 'LZ1ABC', fuse)
      // Should find both LZ1ABC (exact) and LZ1XBC (fuzzy match)
      const callsigns = result.map(c => c.fullCallsign)
      expect(callsigns).toContain('LZ1ABC')
      expect(callsigns).toContain('LZ1XBC')
    })

    it('searches in callsign field', () => {
      const fuse = createFuseInstance(mockContacts)
      const result = filterContacts(mockContacts, 'W1AW', fuse)
      expect(result).toHaveLength(1)
      expect(result[0].fullCallsign).toBe('W1AW')
    })

    it('searches in remarks field', () => {
      const fuse = createFuseInstance(mockContacts)
      const result = filterContacts(mockContacts, 'ARRL', fuse)
      expect(result).toHaveLength(1)
      expect(result[0].remarks).toBe('ARRL HQ station')
    })
  })

  describe('highlightMatch', () => {
    it('highlights exact match in string', () => {
      const result = highlightMatch('LZ1ABC', 'ABC')
      expect(result).toBe('LZ1<mark>ABC</mark>')
    })

    it('highlights case-insensitively', () => {
      const result = highlightMatch('LZ1ABC', 'abc')
      expect(result).toBe('LZ1<mark>ABC</mark>')
    })

    it('returns original text when no match found', () => {
      const result = highlightMatch('LZ1ABC', 'XYZ')
      expect(result).toBe('LZ1ABC')
    })

    it('returns original text when query < 2 characters', () => {
      const result = highlightMatch('LZ1ABC', 'A')
      expect(result).toBe('LZ1ABC')
    })

    it('returns empty string when text is null', () => {
      const result = highlightMatch(null, 'AB')
      expect(result).toBe('')
    })

    it('returns empty string when text is undefined', () => {
      const result = highlightMatch(undefined, 'AB')
      expect(result).toBe('')
    })

    it('returns original text when query is empty', () => {
      const result = highlightMatch('LZ1ABC', '')
      expect(result).toBe('LZ1ABC')
    })

    it('highlights first occurrence when multiple matches exist', () => {
      const result = highlightMatch('ABC ABC ABC', 'ABC')
      expect(result).toBe('<mark>ABC</mark> ABC ABC')
    })

    it('handles whitespace-only query gracefully', () => {
      const result = highlightMatch('LZ1ABC', '   ')
      expect(result).toBe('LZ1ABC')
    })
  })

  describe('createFuseInstance', () => {
    it('creates a Fuse instance with correct configuration', () => {
      const mockContacts = [
        { fullCallsign: 'LZ1ABC', remarks: 'Test' }
      ]
      const fuse = createFuseInstance(mockContacts)

      expect(fuse).toBeDefined()
      expect(fuse.search).toBeDefined()
      expect(typeof fuse.search).toBe('function')
    })

    it('creates Fuse instance with empty array', () => {
      const fuse = createFuseInstance([])
      expect(fuse).toBeDefined()
      const result = fuse.search('test')
      expect(result).toEqual([])
    })
  })
})
