/**
 * Exam Progress Module
 *
 * Pure functions for calculating exam progress and completion status.
 * Separated from UI components for testability and reusability.
 */

/**
 * Calculates exam progress statistics
 *
 * @param {Object} userAnswers - Object mapping question indices to user answers
 * @param {number} totalQuestions - Total number of questions in the exam
 * @returns {Object} Progress statistics
 * @returns {number} return.answeredCount - Number of questions answered
 * @returns {number} return.unansweredCount - Number of questions not yet answered
 * @returns {number} return.percentage - Percentage of questions answered (0-100)
 */
export function calculateProgress(userAnswers, totalQuestions) {
  const answeredCount = Object.keys(userAnswers).length
  const unansweredCount = totalQuestions - answeredCount
  const percentage = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0

  return {
    answeredCount,
    unansweredCount,
    percentage
  }
}

/**
 * Checks if all questions have been answered
 *
 * @param {Object} userAnswers - Object mapping question indices to user answers
 * @param {number} totalQuestions - Total number of questions
 * @returns {boolean} True if all questions are answered
 */
export function isExamComplete(userAnswers, totalQuestions) {
  return Object.keys(userAnswers).length === totalQuestions
}

/**
 * Gets the list of unanswered question indices
 *
 * @param {Object} userAnswers - Object mapping question indices to user answers
 * @param {number} totalQuestions - Total number of questions
 * @returns {Array<number>} Array of unanswered question indices
 */
export function getUnansweredQuestions(userAnswers, totalQuestions) {
  const unanswered = []
  for (let i = 0; i < totalQuestions; i++) {
    if (userAnswers[i] === undefined) {
      unanswered.push(i)
    }
  }
  return unanswered
}

/**
 * Checks if a specific question has been answered
 *
 * @param {Object} userAnswers - Object mapping question indices to user answers
 * @param {number} questionIndex - Index of the question to check
 * @returns {boolean} True if the question is answered
 */
export function isQuestionAnswered(userAnswers, questionIndex) {
  return userAnswers[questionIndex] !== undefined
}
