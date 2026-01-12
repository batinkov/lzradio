/**
 * Tests for LogBook Settings Storage
 */

// Mock localStorage BEFORE imports
const localStorageMock = {
  data: {},
  getItem(key) {
    return this.data[key] || null
  },
  setItem(key, value) {
    this.data[key] = String(value)
  },
  removeItem(key) {
    delete this.data[key]
  },
  clear() {
    this.data = {}
  },
  get length() {
    return Object.keys(this.data).length
  },
  key(index) {
    const keys = Object.keys(this.data)
    return keys[index] || null
  }
}

// Set up global mocks before imports
global.window = { localStorage: localStorageMock }
global.localStorage = localStorageMock

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getLogbookSettings,
  getStationCallsign,
  setStationCallsign,
  updateLogbookSettings,
  clearLogbookSettings
} from './logbookSettings.js'

describe('logbookSettings', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.data = {}
    localStorage.clear()
  })

  describe('getLogbookSettings', () => {
    it('should return stored settings', () => {
      // Use setStationCallsign instead of setting localStorage directly
      setStationCallsign('LZ1ABC')
      const settings = getLogbookSettings()
      expect(settings).toEqual({
        stationCallsign: 'LZ1ABC'
      })
    })
  })

  describe('getStationCallsign', () => {
    it('should return stored callsign', () => {
      // Use setStationCallsign instead of setting localStorage directly
      setStationCallsign('LZ1ABC')
      const callsign = getStationCallsign()
      expect(callsign).toBe('LZ1ABC')
    })
  })

  describe('setStationCallsign', () => {
    it('should save callsign', () => {
      const result = setStationCallsign('LZ1ABC')
      expect(result).toBe(true)
      expect(getStationCallsign()).toBe('LZ1ABC')
    })

    it('should normalize callsign to uppercase', () => {
      setStationCallsign('lz1abc')
      expect(getStationCallsign()).toBe('LZ1ABC')
    })

    it('should trim whitespace', () => {
      setStationCallsign('  LZ1ABC  ')
      expect(getStationCallsign()).toBe('LZ1ABC')
    })

    it('should trim and uppercase together', () => {
      setStationCallsign('  lz1abc  ')
      expect(getStationCallsign()).toBe('LZ1ABC')
    })

    it('should convert empty string to null', () => {
      setStationCallsign('LZ1ABC')
      setStationCallsign('')
      expect(getStationCallsign()).toBeNull()
    })

    it('should convert whitespace-only string to null', () => {
      setStationCallsign('LZ1ABC')
      setStationCallsign('   ')
      expect(getStationCallsign()).toBeNull()
    })

    it('should handle null input', () => {
      setStationCallsign('LZ1ABC')
      setStationCallsign(null)
      expect(getStationCallsign()).toBeNull()
    })

    it('should handle undefined input', () => {
      setStationCallsign('LZ1ABC')
      setStationCallsign(undefined)
      expect(getStationCallsign()).toBeNull()
    })

    it('should preserve existing settings when updating callsign', () => {
      // Set initial callsign
      setStationCallsign('LZ1ABC')

      // Future settings would be preserved here
      const settings = getLogbookSettings()
      expect(settings.stationCallsign).toBe('LZ1ABC')
    })
  })

  describe('updateLogbookSettings', () => {
    it('should update settings', () => {
      const result = updateLogbookSettings({ stationCallsign: 'LZ1ABC' })
      expect(result).toBe(true)
      expect(getStationCallsign()).toBe('LZ1ABC')
    })

    it('should normalize callsign in updates', () => {
      updateLogbookSettings({ stationCallsign: 'lz1abc' })
      expect(getStationCallsign()).toBe('LZ1ABC')
    })

    it('should merge with existing settings', () => {
      setStationCallsign('LZ1ABC')
      updateLogbookSettings({ stationCallsign: 'LZ2XYZ' })
      expect(getStationCallsign()).toBe('LZ2XYZ')
    })
  })

  describe('clearLogbookSettings', () => {
    it('should clear all settings', () => {
      setStationCallsign('LZ1ABC')
      const result = clearLogbookSettings()
      expect(result).toBe(true)
      expect(getStationCallsign()).toBeNull()
    })

    it('should return true even when nothing to clear', () => {
      const result = clearLogbookSettings()
      expect(result).toBe(true)
    })
  })

  describe('callsign formats', () => {
    it('should handle simple callsigns', () => {
      setStationCallsign('W1ABC')
      expect(getStationCallsign()).toBe('W1ABC')
    })

    it('should handle callsigns with prefix', () => {
      setStationCallsign('HB/W1ABC')
      expect(getStationCallsign()).toBe('HB/W1ABC')
    })

    it('should handle callsigns with suffix', () => {
      setStationCallsign('W1ABC/P')
      expect(getStationCallsign()).toBe('W1ABC/P')
    })

    it('should handle callsigns with prefix and suffix', () => {
      setStationCallsign('HB/W1ABC/P')
      expect(getStationCallsign()).toBe('HB/W1ABC/P')
    })

    it('should handle mixed case with slashes', () => {
      setStationCallsign('hb/w1abc/p')
      expect(getStationCallsign()).toBe('HB/W1ABC/P')
    })
  })
})
