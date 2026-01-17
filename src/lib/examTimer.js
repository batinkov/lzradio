/**
 * Exam Timer Module
 *
 * Pure functions and utilities for managing exam timers.
 * Separated from UI components for testability and reusability.
 */

/**
 * Formats seconds into MM:SS display format
 *
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} Formatted time string (e.g., "05:30", "120:00")
 */
export function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Determines the warning level based on remaining time
 *
 * @param {number} remainingSeconds - Seconds remaining in exam
 * @returns {'normal'|'warning'|'critical'} Warning level
 */
export function getTimerWarningLevel(remainingSeconds) {
  if (remainingSeconds <= 300) return 'critical' // 5 minutes or less
  if (remainingSeconds <= 600) return 'warning'  // 10 minutes or less
  return 'normal'
}

/**
 * Parses formatted time string into total seconds
 *
 * @param {string} timeString - Time in MM:SS format
 * @returns {number} Total seconds
 */
export function parseTime(timeString) {
  const [mins, secs] = timeString.split(':').map(Number)
  return mins * 60 + secs
}

/**
 * Creates a countdown timer controller
 *
 * @param {Object} options - Timer configuration
 * @param {number} options.durationSeconds - Total duration in seconds
 * @param {Function} options.onTick - Called every second with remainingSeconds
 * @param {Function} options.onExpired - Called when timer reaches zero
 * @returns {Object} Timer controller with start, pause, resume, stop, and getRemaining methods
 */
export function createExamTimer({ durationSeconds, onTick, onExpired }) {
  let remainingSeconds = durationSeconds
  let intervalId = null
  let isPaused = false
  let isRunning = false

  /**
   * Starts the countdown timer
   */
  function start() {
    if (isRunning) return

    isRunning = true
    isPaused = false

    intervalId = setInterval(() => {
      if (!isPaused) {
        remainingSeconds--

        // Call tick callback
        if (onTick) {
          onTick(remainingSeconds)
        }

        // Check if expired
        if (remainingSeconds <= 0) {
          stop()
          if (onExpired) {
            onExpired()
          }
        }
      }
    }, 1000)
  }

  /**
   * Pauses the timer without stopping it
   */
  function pause() {
    isPaused = true
  }

  /**
   * Resumes a paused timer
   */
  function resume() {
    isPaused = false
  }

  /**
   * Stops and clears the timer
   */
  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isRunning = false
    isPaused = false
  }

  /**
   * Gets the current remaining seconds
   * @returns {number} Remaining seconds
   */
  function getRemaining() {
    return remainingSeconds
  }

  /**
   * Sets the remaining seconds (useful for restoring state)
   * @param {number} seconds - Seconds to set
   */
  function setRemaining(seconds) {
    remainingSeconds = seconds
  }

  /**
   * Checks if timer is currently running
   * @returns {boolean} True if running
   */
  function isActive() {
    return isRunning && !isPaused
  }

  return {
    start,
    pause,
    resume,
    stop,
    getRemaining,
    setRemaining,
    isActive
  }
}
