import { describe, it, expect } from 'vitest'
import { calculateImportStatistics, buildDuplicateKey } from './importStatistics.js'

describe('importStatistics', () => {
  describe('buildDuplicateKey', () => {
    it('should build key from baseCallsign, date, and time', () => {
      const contact = {
        baseCallsign: 'W1ABC',
        date: '2025-01-20',
        time: '14:30:00'
      }
      const key = buildDuplicateKey(contact)
      expect(key).toBe('W1ABC|2025-01-20|14:30:00')
    })

    it('should handle different callsigns', () => {
      const contact1 = { baseCallsign: 'K2XYZ', date: '2025-01-20', time: '14:30:00' }
      const contact2 = { baseCallsign: 'DL5ABC', date: '2025-01-20', time: '14:30:00' }

      expect(buildDuplicateKey(contact1)).toBe('K2XYZ|2025-01-20|14:30:00')
      expect(buildDuplicateKey(contact2)).toBe('DL5ABC|2025-01-20|14:30:00')
    })

    it('should create different keys for same callsign on different dates', () => {
      const contact1 = { baseCallsign: 'W1ABC', date: '2025-01-20', time: '14:30:00' }
      const contact2 = { baseCallsign: 'W1ABC', date: '2025-01-21', time: '14:30:00' }

      expect(buildDuplicateKey(contact1)).not.toBe(buildDuplicateKey(contact2))
    })

    it('should create different keys for same callsign at different times', () => {
      const contact1 = { baseCallsign: 'W1ABC', date: '2025-01-20', time: '14:30:00' }
      const contact2 = { baseCallsign: 'W1ABC', date: '2025-01-20', time: '15:00:00' }

      expect(buildDuplicateKey(contact1)).not.toBe(buildDuplicateKey(contact2))
    })
  })

  describe('calculateImportStatistics', () => {
    it('should handle empty existing contacts', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        }
      ]
      const existingContacts = []

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.existingCount).toBe(0)
      expect(stats.importFileCount).toBe(1)
      expect(stats.newCount).toBe(1)
      expect(stats.duplicateCount).toBe(0)
      expect(stats.newContacts).toHaveLength(1)
      expect(stats.duplicates).toHaveLength(0)
    })

    it('should handle empty import contacts', () => {
      const importContacts = []
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-20',
          time: '14:30:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.existingCount).toBe(1)
      expect(stats.importFileCount).toBe(0)
      expect(stats.newCount).toBe(0)
      expect(stats.duplicateCount).toBe(0)
    })

    it('should detect all new contacts when no duplicates', () => {
      const importContacts = [
        {
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 7.1,
          mode: 'CW'
        },
        {
          baseCallsign: 'DL5ABC',
          prefix: null,
          suffix: 'P',
          date: '2025-01-22',
          time: '15:30:00',
          frequency: 21.2,
          mode: 'FT8'
        }
      ]
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-20',
          time: '14:30:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.existingCount).toBe(1)
      expect(stats.importFileCount).toBe(2)
      expect(stats.newCount).toBe(2)
      expect(stats.duplicateCount).toBe(0)
      expect(stats.newContacts).toHaveLength(2)
      expect(stats.duplicates).toHaveLength(0)
    })

    it('should detect single duplicate', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        }
      ]
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-20',
          time: '14:30:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.existingCount).toBe(1)
      expect(stats.importFileCount).toBe(1)
      expect(stats.newCount).toBe(0)
      expect(stats.duplicateCount).toBe(1)
      expect(stats.newContacts).toHaveLength(0)
      expect(stats.duplicates).toHaveLength(1)
    })

    it('should include callsign, date, and time in duplicate info', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: 'HB',
          suffix: 'M',
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        }
      ]
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-20',
          time: '14:30:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.duplicates[0]).toEqual({
        callsign: 'HB/W1ABC/M',
        date: '2025-01-20',
        time: '14:30:00'
      })
    })

    it('should detect mixed new and duplicate contacts', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        },
        {
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 7.1,
          mode: 'CW'
        },
        {
          baseCallsign: 'DL5ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-22',
          time: '15:30:00',
          frequency: 21.2,
          mode: 'FT8'
        }
      ]
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-20',
          time: '14:30:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.existingCount).toBe(1)
      expect(stats.importFileCount).toBe(3)
      expect(stats.newCount).toBe(2)
      expect(stats.duplicateCount).toBe(1)
      expect(stats.newContacts).toHaveLength(2)
      expect(stats.duplicates).toHaveLength(1)
    })

    it('should detect all duplicates when no new contacts', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        },
        {
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 7.1,
          mode: 'CW'
        }
      ]
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-20',
          time: '14:30:00'
        },
        {
          baseCallsign: 'K2XYZ',
          date: '2025-01-21',
          time: '10:00:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.existingCount).toBe(2)
      expect(stats.importFileCount).toBe(2)
      expect(stats.newCount).toBe(0)
      expect(stats.duplicateCount).toBe(2)
      expect(stats.newContacts).toHaveLength(0)
      expect(stats.duplicates).toHaveLength(2)
    })

    it('should treat same callsign at different times as different contacts', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        },
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '15:00:00',
          frequency: 14.25,
          mode: 'SSB'
        }
      ]
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-20',
          time: '14:30:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.newCount).toBe(1)
      expect(stats.duplicateCount).toBe(1)
      expect(stats.newContacts[0].time).toBe('15:00:00')
      expect(stats.duplicates[0].time).toBe('14:30:00')
    })

    it('should treat same callsign on different dates as different contacts', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        },
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        }
      ]
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-20',
          time: '14:30:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.newCount).toBe(1)
      expect(stats.duplicateCount).toBe(1)
      expect(stats.newContacts[0].date).toBe('2025-01-21')
      expect(stats.duplicates[0].date).toBe('2025-01-20')
    })

    it('should ignore prefix and suffix in duplicate detection', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: 'HB',
          suffix: 'M',
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        }
      ]
      const existingContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:30:00'
        }
      ]

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.duplicateCount).toBe(1)
      expect(stats.newCount).toBe(0)
    })

    it('should handle large datasets efficiently', () => {
      const importContacts = Array.from({ length: 1000 }, (_, i) => ({
        baseCallsign: `W1${i.toString().padStart(3, '0')}`,
        prefix: null,
        suffix: null,
        date: '2025-01-20',
        time: `${Math.floor(i / 60).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}:00`,
        frequency: 14.25,
        mode: 'SSB'
      }))

      const existingContacts = Array.from({ length: 500 }, (_, i) => ({
        baseCallsign: `W1${i.toString().padStart(3, '0')}`,
        date: '2025-01-20',
        time: `${Math.floor(i / 60).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}:00`
      }))

      const start = performance.now()
      const stats = calculateImportStatistics(importContacts, existingContacts)
      const duration = performance.now() - start

      expect(stats.existingCount).toBe(500)
      expect(stats.importFileCount).toBe(1000)
      expect(stats.newCount).toBe(500)
      expect(stats.duplicateCount).toBe(500)
      expect(duration).toBeLessThan(100) // Should complete in less than 100ms
    })

    it('should preserve all contact data in newContacts array', () => {
      const importContacts = [
        {
          baseCallsign: 'K2XYZ',
          prefix: 'HB',
          suffix: 'M',
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 7.1,
          mode: 'CW',
          power: 50,
          rstSent: '599',
          rstReceived: '599',
          qslSent: true,
          qslReceived: false,
          remarks: 'Test'
        }
      ]
      const existingContacts = []

      const stats = calculateImportStatistics(importContacts, existingContacts)

      expect(stats.newContacts[0]).toEqual(importContacts[0])
    })

    /**
     * IMMUTABILITY TEST
     *
     * This test ensures that callers cannot accidentally break the function by modifying
     * the returned statistics object. It verifies that calculateImportStatistics() creates
     * fresh arrays on each call rather than returning references to shared/cached state.
     *
     * Why this matters:
     * - Without immutability, if a caller modifies stats.newContacts (e.g., adding/removing items),
     *   it could corrupt future calls to the function if those arrays were shared
     * - This is a defensive programming practice that prevents subtle bugs
     * - Example bug scenario: User displays preview, modifies the data in UI,
     *   then recalculates - without immutability, the second calculation could be corrupted
     *
     * What we're testing:
     * 1. Call calculateImportStatistics() and get results
     * 2. MUTATE the returned data (push a fake contact)
     * 3. Call calculateImportStatistics() again with same inputs
     * 4. Verify the second call returns correct data (not affected by mutation from step 2)
     */
    it('should return immutable statistics', () => {
      const importContacts = [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:30:00',
          frequency: 14.25,
          mode: 'SSB'
        }
      ]
      const existingContacts = []

      const stats = calculateImportStatistics(importContacts, existingContacts)

      // Modifying returned arrays should not affect future calculations
      stats.newContacts.push({
        baseCallsign: 'FAKE',
        date: '2025-01-01',
        time: '00:00:00'
      })

      const stats2 = calculateImportStatistics(importContacts, existingContacts)
      expect(stats2.newContacts).toHaveLength(1)
      expect(stats2.newContacts[0].baseCallsign).toBe('W1ABC')
    })
  })
})
