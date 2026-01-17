/**
 * Creates a keyboard shortcut handler for exam modes
 * @param {Object} options - Configuration options
 * @param {Function} options.onPrevious - Handler for previous question
 * @param {Function} options.onNext - Handler for next question
 * @param {Function} options.onSelectAnswer - Handler for answer selection (receives choice key). Pass a no-op function to disable.
 * @param {Function} options.getCurrentQuestion - Function that returns the current question object
 * @param {Function} options.isModalOpen - Function that returns true if any modal is open
 * @returns {Function} Event handler function for keydown events
 */
export function createExamKeyboardHandler(options) {
  const {
    onPrevious,
    onNext,
    onSelectAnswer,
    getCurrentQuestion,
    isModalOpen
  } = options

  return function handleKeydown(event) {
    // Don't trigger shortcuts if any modal is open or if focus is on an interactive element
    if (isModalOpen() || event.target.matches('input, textarea, select, button')) {
      return
    }

    // Arrow keys for navigation
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onPrevious()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      onNext()
    }
    // Number keys 1-4 for answer selection
    else if (['1', '2', '3', '4'].includes(event.key)) {
      event.preventDefault()
      const choiceIndex = parseInt(event.key) - 1
      const currentQuestion = getCurrentQuestion()

      if (currentQuestion && currentQuestion.choices && currentQuestion.choices[choiceIndex]) {
        onSelectAnswer(currentQuestion.choices[choiceIndex].key)
      }
    }
  }
}
