/**
 * Exam Scoring Module
 *
 * Pure functions for calculating exam results and answer validation.
 * Separated from UI components for testability and reusability.
 */

/**
 * Determines the status of a single answer
 *
 * @param {Object} question - The question object with correct_answer property
 * @param {string|undefined} userAnswer - The user's answer (undefined if not answered)
 * @returns {'correct'|'incorrect'|'unanswered'} The answer status
 */
export function getAnswerStatus(question, userAnswer) {
  if (userAnswer === undefined) {
    return 'unanswered'
  }
  return userAnswer === question.correct_answer ? 'correct' : 'incorrect'
}

/**
 * Calculates comprehensive exam results
 *
 * @param {Array<Object>} questions - Array of question objects with correct_answer property
 * @param {Object} userAnswers - Object mapping question indices to user answers
 * @param {Object} config - Exam configuration
 * @param {number} config.minCorrectAnswers - Minimum correct answers required to pass
 * @returns {Object} Exam results
 * @returns {number} return.correctCount - Number of correct answers
 * @returns {number} return.wrongCount - Number of wrong answers
 * @returns {number} return.unansweredCount - Number of unanswered questions
 * @returns {number} return.totalQuestions - Total number of questions
 * @returns {boolean} return.passed - Whether the exam was passed
 */
export function calculateExamResults(questions, userAnswers, config) {
  let correctCount = 0
  let wrongCount = 0
  let unansweredCount = 0

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index]
    const status = getAnswerStatus(question, userAnswer)

    if (status === 'unanswered') {
      unansweredCount++
    } else if (status === 'correct') {
      correctCount++
    } else {
      wrongCount++
    }
  })

  const passed = correctCount >= config.minCorrectAnswers

  return {
    correctCount,
    wrongCount,
    unansweredCount,
    totalQuestions: questions.length,
    passed
  }
}

/**
 * Calculates the percentage score
 *
 * @param {number} correctCount - Number of correct answers
 * @param {number} totalQuestions - Total number of questions
 * @returns {number} Percentage score (0-100)
 */
export function calculatePercentage(correctCount, totalQuestions) {
  if (totalQuestions === 0) return 0
  return Math.round((correctCount / totalQuestions) * 100)
}
