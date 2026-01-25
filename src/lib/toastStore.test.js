import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { get } from 'svelte/store'
import { toast } from './toastStore.js'

describe('toastStore', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    toast.clear()
    // Use fake timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('show', () => {
    it('should add a toast to the store', () => {
      toast.show('Test message', 'info', 0)
      const toasts = get(toast)

      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Test message')
      expect(toasts[0].type).toBe('info')
    })

    it('should assign unique IDs to toasts', () => {
      const id1 = toast.show('First', 'info', 0)
      const id2 = toast.show('Second', 'info', 0)
      const toasts = get(toast)

      expect(toasts).toHaveLength(2)
      expect(toasts[0].id).toBe(id1)
      expect(toasts[1].id).toBe(id2)
      expect(id2).toBeGreaterThan(id1)
    })

    it('should default to info type', () => {
      toast.show('Test message')
      const toasts = get(toast)

      expect(toasts[0].type).toBe('info')
    })

    it('should default to 3000ms duration', () => {
      toast.show('Test message', 'info')
      const toasts = get(toast)

      expect(toasts).toHaveLength(1)

      // Fast-forward 2999ms (should still exist)
      vi.advanceTimersByTime(2999)
      expect(get(toast)).toHaveLength(1)

      // Fast-forward 1ms more (should be dismissed)
      vi.advanceTimersByTime(1)
      expect(get(toast)).toHaveLength(0)
    })

    it('should auto-dismiss after specified duration', () => {
      toast.show('Test message', 'info', 2000)

      expect(get(toast)).toHaveLength(1)

      // Fast-forward 1999ms (should still exist)
      vi.advanceTimersByTime(1999)
      expect(get(toast)).toHaveLength(1)

      // Fast-forward 1ms more (should be dismissed)
      vi.advanceTimersByTime(1)
      expect(get(toast)).toHaveLength(0)
    })

    it('should not auto-dismiss when duration is 0', () => {
      toast.show('Test message', 'info', 0)

      expect(get(toast)).toHaveLength(1)

      // Fast-forward a lot (should still exist)
      vi.advanceTimersByTime(10000)
      expect(get(toast)).toHaveLength(1)
    })

    it('should return the toast ID', () => {
      const id = toast.show('Test message', 'info', 0)
      expect(typeof id).toBe('number')
      expect(id).toBeGreaterThanOrEqual(0)
    })
  })

  describe('success', () => {
    it('should create a success toast', () => {
      toast.success('Success message')
      const toasts = get(toast)

      expect(toasts[0].type).toBe('success')
      expect(toasts[0].message).toBe('Success message')
    })

    it('should use default duration of 3000ms', () => {
      toast.success('Success message')

      vi.advanceTimersByTime(2999)
      expect(get(toast)).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(get(toast)).toHaveLength(0)
    })

    it('should accept custom duration', () => {
      toast.success('Success message', 5000)

      vi.advanceTimersByTime(4999)
      expect(get(toast)).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(get(toast)).toHaveLength(0)
    })
  })

  describe('error', () => {
    it('should create an error toast', () => {
      toast.error('Error message')
      const toasts = get(toast)

      expect(toasts[0].type).toBe('error')
      expect(toasts[0].message).toBe('Error message')
    })

    it('should use default duration of 4000ms', () => {
      toast.error('Error message')

      vi.advanceTimersByTime(3999)
      expect(get(toast)).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(get(toast)).toHaveLength(0)
    })

    it('should accept custom duration', () => {
      toast.error('Error message', 5000)

      vi.advanceTimersByTime(4999)
      expect(get(toast)).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(get(toast)).toHaveLength(0)
    })
  })

  describe('info', () => {
    it('should create an info toast', () => {
      toast.info('Info message')
      const toasts = get(toast)

      expect(toasts[0].type).toBe('info')
      expect(toasts[0].message).toBe('Info message')
    })

    it('should use default duration of 3000ms', () => {
      toast.info('Info message')

      vi.advanceTimersByTime(2999)
      expect(get(toast)).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(get(toast)).toHaveLength(0)
    })
  })

  describe('warning', () => {
    it('should create a warning toast', () => {
      toast.warning('Warning message')
      const toasts = get(toast)

      expect(toasts[0].type).toBe('warning')
      expect(toasts[0].message).toBe('Warning message')
    })

    it('should use default duration of 3000ms', () => {
      toast.warning('Warning message')

      vi.advanceTimersByTime(2999)
      expect(get(toast)).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(get(toast)).toHaveLength(0)
    })
  })

  describe('dismiss', () => {
    it('should remove a specific toast by ID', () => {
      const id1 = toast.show('First', 'info', 0)
      const id2 = toast.show('Second', 'info', 0)
      const id3 = toast.show('Third', 'info', 0)

      expect(get(toast)).toHaveLength(3)

      toast.dismiss(id2)

      const remaining = get(toast)
      expect(remaining).toHaveLength(2)
      expect(remaining[0].id).toBe(id1)
      expect(remaining[1].id).toBe(id3)
    })

    it('should do nothing if ID does not exist', () => {
      toast.show('Test', 'info', 0)

      toast.dismiss(999)

      expect(get(toast)).toHaveLength(1)
    })
  })

  describe('clear', () => {
    it('should remove all toasts', () => {
      toast.show('First', 'info', 0)
      toast.show('Second', 'info', 0)
      toast.show('Third', 'info', 0)

      expect(get(toast)).toHaveLength(3)

      toast.clear()

      expect(get(toast)).toHaveLength(0)
    })

    it('should work when no toasts exist', () => {
      toast.clear()
      expect(get(toast)).toHaveLength(0)
    })
  })

  describe('multiple toasts', () => {
    it('should handle multiple toasts simultaneously', () => {
      toast.success('Success 1', 0)
      toast.error('Error 1', 0)
      toast.warning('Warning 1', 0)

      const toasts = get(toast)
      expect(toasts).toHaveLength(3)
      expect(toasts[0].type).toBe('success')
      expect(toasts[1].type).toBe('error')
      expect(toasts[2].type).toBe('warning')
    })

    it('should dismiss toasts independently based on duration', () => {
      toast.show('Fast', 'info', 1000)
      toast.show('Medium', 'info', 2000)
      toast.show('Slow', 'info', 3000)

      expect(get(toast)).toHaveLength(3)

      // After 1000ms, first toast dismissed
      vi.advanceTimersByTime(1000)
      expect(get(toast)).toHaveLength(2)

      // After 2000ms total, second toast dismissed
      vi.advanceTimersByTime(1000)
      expect(get(toast)).toHaveLength(1)

      // After 3000ms total, third toast dismissed
      vi.advanceTimersByTime(1000)
      expect(get(toast)).toHaveLength(0)
    })

    it('should maintain order when dismissing middle toast', () => {
      const id1 = toast.show('First', 'info', 0)
      toast.show('Second', 'info', 0)
      const id3 = toast.show('Third', 'info', 0)

      const toasts = get(toast)
      expect(toasts[0].message).toBe('First')
      expect(toasts[1].message).toBe('Second')
      expect(toasts[2].message).toBe('Third')

      toast.dismiss(toasts[1].id)

      const remaining = get(toast)
      expect(remaining).toHaveLength(2)
      expect(remaining[0].id).toBe(id1)
      expect(remaining[1].id).toBe(id3)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid sequential toasts', () => {
      for (let i = 0; i < 10; i++) {
        toast.show(`Message ${i}`, 'info', 0)
      }

      expect(get(toast)).toHaveLength(10)
    })

    it('should handle clearing and adding new toasts', () => {
      toast.show('First', 'info', 0)
      toast.show('Second', 'info', 0)

      toast.clear()
      expect(get(toast)).toHaveLength(0)

      toast.show('Third', 'info', 0)
      expect(get(toast)).toHaveLength(1)
      expect(get(toast)[0].message).toBe('Third')
    })

    it('should continue incrementing IDs after clear', () => {
      const id1 = toast.show('First', 'info', 0)

      toast.clear()

      const id2 = toast.show('Second', 'info', 0)
      expect(id2).toBeGreaterThan(id1) // ID continues incrementing
    })
  })

  describe('options with links', () => {
    it('should include link when provided in options', () => {
      toast.show('Test message', 'info', 0, {
        link: 'https://example.com',
        linkText: 'Click here'
      })

      const toasts = get(toast)
      expect(toasts[0].link).toBe('https://example.com')
      expect(toasts[0].linkText).toBe('Click here')
    })

    it('should use default linkText when not provided', () => {
      toast.show('Test message', 'info', 0, {
        link: 'https://example.com'
      })

      const toasts = get(toast)
      expect(toasts[0].link).toBe('https://example.com')
      expect(toasts[0].linkText).toBe('Learn more')
    })

    it('should work without options parameter', () => {
      toast.show('Test message', 'info', 0)

      const toasts = get(toast)
      expect(toasts[0].link).toBeUndefined()
      expect(toasts[0].linkText).toBe('Learn more') // Default is still set
    })

    it('should pass options through info() helper', () => {
      toast.info('Info message', 3000, {
        link: 'https://example.com/info',
        linkText: 'More info'
      })

      const toasts = get(toast)
      expect(toasts[0].type).toBe('info')
      expect(toasts[0].link).toBe('https://example.com/info')
      expect(toasts[0].linkText).toBe('More info')
    })

    it('should pass options through success() helper', () => {
      toast.success('Success message', 3000, {
        link: 'https://example.com/success',
        linkText: 'Details'
      })

      const toasts = get(toast)
      expect(toasts[0].type).toBe('success')
      expect(toasts[0].link).toBe('https://example.com/success')
      expect(toasts[0].linkText).toBe('Details')
    })

    it('should pass options through error() helper', () => {
      toast.error('Error message', 4000, {
        link: 'https://example.com/error',
        linkText: 'Get help'
      })

      const toasts = get(toast)
      expect(toasts[0].type).toBe('error')
      expect(toasts[0].link).toBe('https://example.com/error')
      expect(toasts[0].linkText).toBe('Get help')
    })

    it('should pass options through warning() helper', () => {
      toast.warning('Warning message', 3000, {
        link: 'https://example.com/warning',
        linkText: 'Read more'
      })

      const toasts = get(toast)
      expect(toasts[0].type).toBe('warning')
      expect(toasts[0].link).toBe('https://example.com/warning')
      expect(toasts[0].linkText).toBe('Read more')
    })

    it('should work with empty options object', () => {
      toast.show('Test message', 'info', 0, {})

      const toasts = get(toast)
      expect(toasts[0].link).toBeUndefined()
      expect(toasts[0].linkText).toBe('Learn more')
    })

    it('should handle link without linkText in helper methods', () => {
      toast.info('Info message', 3000, {
        link: 'https://example.com'
      })

      const toasts = get(toast)
      expect(toasts[0].link).toBe('https://example.com')
      expect(toasts[0].linkText).toBe('Learn more')
    })
  })
})
