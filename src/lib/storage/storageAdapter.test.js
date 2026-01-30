import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createStorageAdapter, createMockStorage } from './storageAdapter.js'

describe('storageAdapter', () => {
  let storage
  let adapter

  beforeEach(() => {
    storage = createMockStorage()
    adapter = createStorageAdapter(storage)
  })

  describe('set and get', () => {
    it('should store and retrieve a string', () => {
      adapter.set('key', 'value')
      expect(adapter.get('key')).toBe('value')
    })

    it('should store and retrieve an object', () => {
      const obj = { name: 'John', age: 30 }
      adapter.set('user', obj)
      expect(adapter.get('user')).toEqual(obj)
    })

    it('should store and retrieve an array', () => {
      const arr = [1, 2, 3, 4, 5]
      adapter.set('numbers', arr)
      expect(adapter.get('numbers')).toEqual(arr)
    })

    it('should store and retrieve numbers', () => {
      adapter.set('count', 42)
      expect(adapter.get('count')).toBe(42)
    })

    it('should store and retrieve booleans', () => {
      adapter.set('flag', true)
      expect(adapter.get('flag')).toBe(true)

      adapter.set('flag', false)
      expect(adapter.get('flag')).toBe(false)
    })

    it('should store and retrieve null', () => {
      adapter.set('nullable', null)
      expect(adapter.get('nullable')).toBeNull()
    })

    it('should return default value for non-existent key', () => {
      expect(adapter.get('nonexistent')).toBeNull()
      expect(adapter.get('nonexistent', 'default')).toBe('default')
    })

    it('should return default value for custom defaults', () => {
      expect(adapter.get('missing', [])).toEqual([])
      expect(adapter.get('missing', {})).toEqual({})
      expect(adapter.get('missing', 0)).toBe(0)
    })
  })

  describe('remove', () => {
    it('should remove an item', () => {
      adapter.set('key', 'value')
      expect(adapter.has('key')).toBe(true)

      adapter.remove('key')
      expect(adapter.has('key')).toBe(false)
      expect(adapter.get('key')).toBeNull()
    })

    it('should return true on successful removal', () => {
      adapter.set('key', 'value')
      expect(adapter.remove('key')).toBe(true)
    })

    it('should handle removing non-existent key', () => {
      expect(adapter.remove('nonexistent')).toBe(true)
    })
  })

  describe('has', () => {
    it('should return true for existing keys', () => {
      adapter.set('exists', 'yes')
      expect(adapter.has('exists')).toBe(true)
    })

    it('should return false for non-existent keys', () => {
      expect(adapter.has('nonexistent')).toBe(false)
    })

    it('should return false after removal', () => {
      adapter.set('temp', 'value')
      adapter.remove('temp')
      expect(adapter.has('temp')).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all items', () => {
      adapter.set('key1', 'value1')
      adapter.set('key2', 'value2')
      adapter.set('key3', 'value3')

      expect(adapter.size()).toBe(3)

      adapter.clear()

      expect(adapter.size()).toBe(0)
      expect(adapter.has('key1')).toBe(false)
      expect(adapter.has('key2')).toBe(false)
      expect(adapter.has('key3')).toBe(false)
    })

    it('should return true on successful clear', () => {
      expect(adapter.clear()).toBe(true)
    })
  })

  describe('keys', () => {
    it('should return all storage keys', () => {
      adapter.set('key1', 'value1')
      adapter.set('key2', 'value2')
      adapter.set('key3', 'value3')

      const keys = adapter.keys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })

    it('should return empty array for empty storage', () => {
      expect(adapter.keys()).toEqual([])
    })

    it('should update after adding/removing keys', () => {
      adapter.set('key1', 'value')
      expect(adapter.keys()).toEqual(['key1'])

      adapter.set('key2', 'value')
      expect(adapter.keys()).toHaveLength(2)

      adapter.remove('key1')
      expect(adapter.keys()).toEqual(['key2'])
    })
  })

  describe('size', () => {
    it('should return 0 for empty storage', () => {
      expect(adapter.size()).toBe(0)
    })

    it('should return correct size after adding items', () => {
      adapter.set('key1', 'value1')
      expect(adapter.size()).toBe(1)

      adapter.set('key2', 'value2')
      expect(adapter.size()).toBe(2)

      adapter.set('key3', 'value3')
      expect(adapter.size()).toBe(3)
    })

    it('should update after removing items', () => {
      adapter.set('key1', 'value1')
      adapter.set('key2', 'value2')
      expect(adapter.size()).toBe(2)

      adapter.remove('key1')
      expect(adapter.size()).toBe(1)
    })

    it('should return 0 after clear', () => {
      adapter.set('key1', 'value1')
      adapter.set('key2', 'value2')
      adapter.clear()
      expect(adapter.size()).toBe(0)
    })
  })

  describe('complex data structures', () => {
    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            address: {
              city: 'Sofia',
              country: 'Bulgaria'
            }
          }
        }
      }

      adapter.set('nested', data)
      expect(adapter.get('nested')).toEqual(data)
    })

    it('should handle arrays of objects', () => {
      const contacts = [
        { callsign: 'LZ1ABC', frequency: '14.200' },
        { callsign: 'LZ2DEF', frequency: '21.050' },
        { callsign: 'LZ3GHI', frequency: '28.500' }
      ]

      adapter.set('contacts', contacts)
      expect(adapter.get('contacts')).toEqual(contacts)
    })

    it('should handle exam state', () => {
      const examState = {
        questions: Array(60).fill({ question: 'test' }),
        userAnswers: { 0: 'a', 5: 'b', 10: 'c' },
        currentQuestionIndex: 10,
        remainingSeconds: 1800,
        examResults: null
      }

      adapter.set('examState', examState)
      const retrieved = adapter.get('examState')

      expect(retrieved.questions).toHaveLength(60)
      expect(retrieved.userAnswers).toEqual({ 0: 'a', 5: 'b', 10: 'c' })
      expect(retrieved.currentQuestionIndex).toBe(10)
      expect(retrieved.remainingSeconds).toBe(1800)
    })
  })

  describe('error handling', () => {
    let consoleWarnSpy
    let consoleErrorSpy

    beforeEach(() => {
      // Suppress console output during error handling tests
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      // Restore console
      consoleWarnSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should handle JSON parse errors gracefully', () => {
      // Directly set invalid JSON
      storage.setItem('invalid', 'not valid json {[')

      expect(adapter.get('invalid')).toBeNull()
      expect(adapter.get('invalid', 'fallback')).toBe('fallback')

      // Verify error was logged (even though we mocked it)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get item "invalid" from storage'),
        expect.any(Error)
      )
    })

    it('should handle set failures gracefully', () => {
      // Create a storage that throws on setItem
      const failingStorage = {
        getItem: () => null,
        setItem: () => { throw new Error('Storage full') },
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      }

      const failingAdapter = createStorageAdapter(failingStorage)
      expect(failingAdapter.set('key', 'value')).toBe(false)

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set item "key" in storage'),
        expect.any(Error)
      )
    })
  })

  describe('createMockStorage', () => {
    it('should create a working mock storage', () => {
      const mock = createMockStorage()

      mock.setItem('test', 'value')
      expect(mock.getItem('test')).toBe('value')

      mock.removeItem('test')
      expect(mock.getItem('test')).toBeNull()
    })

    it('should track length correctly', () => {
      const mock = createMockStorage()

      expect(mock.length).toBe(0)

      mock.setItem('key1', 'value1')
      expect(mock.length).toBe(1)

      mock.setItem('key2', 'value2')
      expect(mock.length).toBe(2)

      mock.clear()
      expect(mock.length).toBe(0)
    })

    it('should support key() method', () => {
      const mock = createMockStorage()

      mock.setItem('key1', 'value1')
      mock.setItem('key2', 'value2')

      expect(mock.key(0)).toBeTruthy()
      expect(mock.key(1)).toBeTruthy()
      expect(mock.key(2)).toBeNull()
    })
  })
})
