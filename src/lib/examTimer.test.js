import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  formatTime,
  getTimerWarningLevel,
  parseTime,
  createExamTimer
} from './examTimer.js'

describe('examTimer', () => {
  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(59)).toBe('00:59')
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(61)).toBe('01:01')
      expect(formatTime(599)).toBe('09:59')
      expect(formatTime(600)).toBe('10:00')
    })

    it('should handle exam duration (40 minutes)', () => {
      expect(formatTime(2400)).toBe('40:00')
      expect(formatTime(2340)).toBe('39:00')
      expect(formatTime(1800)).toBe('30:00')
    })

    it('should handle large durations', () => {
      expect(formatTime(3600)).toBe('60:00')
      expect(formatTime(7200)).toBe('120:00')
    })

    it('should pad single digit minutes and seconds', () => {
      expect(formatTime(5)).toBe('00:05')
      expect(formatTime(65)).toBe('01:05')
      expect(formatTime(305)).toBe('05:05')
    })
  })

  describe('getTimerWarningLevel', () => {
    it('should return "normal" when more than 10 minutes remain', () => {
      expect(getTimerWarningLevel(601)).toBe('normal')
      expect(getTimerWarningLevel(1200)).toBe('normal')
      expect(getTimerWarningLevel(2400)).toBe('normal')
    })

    it('should return "warning" between 5 and 10 minutes', () => {
      expect(getTimerWarningLevel(600)).toBe('warning')
      expect(getTimerWarningLevel(450)).toBe('warning')
      expect(getTimerWarningLevel(301)).toBe('warning')
    })

    it('should return "critical" at 5 minutes or less', () => {
      expect(getTimerWarningLevel(300)).toBe('critical')
      expect(getTimerWarningLevel(120)).toBe('critical')
      expect(getTimerWarningLevel(60)).toBe('critical')
      expect(getTimerWarningLevel(1)).toBe('critical')
      expect(getTimerWarningLevel(0)).toBe('critical')
    })
  })

  describe('parseTime', () => {
    it('should parse time strings correctly', () => {
      expect(parseTime('00:00')).toBe(0)
      expect(parseTime('00:30')).toBe(30)
      expect(parseTime('01:00')).toBe(60)
      expect(parseTime('05:30')).toBe(330)
      expect(parseTime('40:00')).toBe(2400)
    })

    it('should handle large time values', () => {
      expect(parseTime('60:00')).toBe(3600)
      expect(parseTime('120:30')).toBe(7230)
    })
  })

  describe('createExamTimer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should count down from initial duration', () => {
      const onTick = vi.fn()
      const timer = createExamTimer({
        durationSeconds: 10,
        onTick
      })

      timer.start()

      // Advance 1 second
      vi.advanceTimersByTime(1000)
      expect(onTick).toHaveBeenCalledWith(9)

      // Advance another second
      vi.advanceTimersByTime(1000)
      expect(onTick).toHaveBeenCalledWith(8)

      timer.stop()
    })

    it('should call onExpired when timer reaches zero', () => {
      const onExpired = vi.fn()
      const timer = createExamTimer({
        durationSeconds: 3,
        onExpired
      })

      timer.start()

      // Advance to completion
      vi.advanceTimersByTime(3000)

      expect(onExpired).toHaveBeenCalledTimes(1)
    })

    it('should stop automatically when expired', () => {
      const onTick = vi.fn()
      const timer = createExamTimer({
        durationSeconds: 2,
        onTick
      })

      timer.start()

      // Advance past expiration
      vi.advanceTimersByTime(5000)

      // Should only tick twice (from 2->1, 1->0)
      expect(onTick).toHaveBeenCalledTimes(2)
      expect(timer.isActive()).toBe(false)
    })

    it('should pause and resume correctly', () => {
      const onTick = vi.fn()
      const timer = createExamTimer({
        durationSeconds: 10,
        onTick
      })

      timer.start()
      vi.advanceTimersByTime(2000)

      expect(timer.getRemaining()).toBe(8)

      timer.pause()
      vi.advanceTimersByTime(3000) // Should not count down while paused

      expect(timer.getRemaining()).toBe(8)

      timer.resume()
      vi.advanceTimersByTime(2000)

      expect(timer.getRemaining()).toBe(6)

      timer.stop()
    })

    it('should return correct remaining time', () => {
      const timer = createExamTimer({
        durationSeconds: 60
      })

      expect(timer.getRemaining()).toBe(60)

      timer.start()
      vi.advanceTimersByTime(5000)

      expect(timer.getRemaining()).toBe(55)

      timer.stop()
    })

    it('should allow setting remaining time', () => {
      const timer = createExamTimer({
        durationSeconds: 100
      })

      timer.setRemaining(50)
      expect(timer.getRemaining()).toBe(50)

      timer.start()
      vi.advanceTimersByTime(1000)

      expect(timer.getRemaining()).toBe(49)

      timer.stop()
    })

    it('should not start multiple timers', () => {
      const onTick = vi.fn()
      const timer = createExamTimer({
        durationSeconds: 10,
        onTick
      })

      timer.start()
      timer.start() // Try to start again

      vi.advanceTimersByTime(1000)

      // Should only be called once, not twice
      expect(onTick).toHaveBeenCalledTimes(1)

      timer.stop()
    })

    it('should clean up properly when stopped', () => {
      const onTick = vi.fn()
      const timer = createExamTimer({
        durationSeconds: 10,
        onTick
      })

      timer.start()
      vi.advanceTimersByTime(2000)

      timer.stop()

      // After stop, advancing time should not trigger callbacks
      vi.advanceTimersByTime(5000)

      expect(onTick).toHaveBeenCalledTimes(2) // Only the first 2 ticks
    })

    it('should report active state correctly', () => {
      const timer = createExamTimer({
        durationSeconds: 10
      })

      expect(timer.isActive()).toBe(false)

      timer.start()
      expect(timer.isActive()).toBe(true)

      timer.pause()
      expect(timer.isActive()).toBe(false)

      timer.resume()
      expect(timer.isActive()).toBe(true)

      timer.stop()
      expect(timer.isActive()).toBe(false)
    })

    it('should handle exam duration scenario', () => {
      const onTick = vi.fn()
      const onExpired = vi.fn()

      // 40 minute exam = 2400 seconds
      const timer = createExamTimer({
        durationSeconds: 2400,
        onTick,
        onExpired
      })

      timer.start()

      // Simulate 5 minutes passing
      vi.advanceTimersByTime(5 * 60 * 1000)
      expect(timer.getRemaining()).toBe(2100)

      // Simulate rest of exam (35 minutes)
      vi.advanceTimersByTime(35 * 60 * 1000)
      expect(timer.getRemaining()).toBe(0)
      expect(onExpired).toHaveBeenCalledTimes(1)
    })
  })
})
