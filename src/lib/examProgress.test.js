import { describe, it, expect } from 'vitest'
import {
  calculateProgress,
  isExamComplete,
  getUnansweredQuestions,
  isQuestionAnswered
} from './examProgress.js'

describe('examProgress', () => {
  describe('calculateProgress', () => {
    it('should calculate progress for empty answers', () => {
      const result = calculateProgress({}, 10)

      expect(result).toEqual({
        answeredCount: 0,
        unansweredCount: 10,
        percentage: 0
      })
    })

    it('should calculate progress for partially answered exam', () => {
      const userAnswers = {
        0: 'a',
        2: 'b',
        5: 'c'
      }
      const result = calculateProgress(userAnswers, 10)

      expect(result).toEqual({
        answeredCount: 3,
        unansweredCount: 7,
        percentage: 30
      })
    })

    it('should calculate progress for fully answered exam', () => {
      const userAnswers = {
        0: 'a',
        1: 'b',
        2: 'c',
        3: 'd',
        4: 'e'
      }
      const result = calculateProgress(userAnswers, 5)

      expect(result).toEqual({
        answeredCount: 5,
        unansweredCount: 0,
        percentage: 100
      })
    })

    it('should handle exam with 60 questions (simulated exam)', () => {
      const userAnswers = {}
      for (let i = 0; i < 30; i++) {
        userAnswers[i] = 'a'
      }

      const result = calculateProgress(userAnswers, 60)

      expect(result).toEqual({
        answeredCount: 30,
        unansweredCount: 30,
        percentage: 50
      })
    })

    it('should round percentage correctly', () => {
      // 1/3 = 33.333... should round to 33
      const result1 = calculateProgress({ 0: 'a' }, 3)
      expect(result1.percentage).toBe(33)

      // 2/3 = 66.666... should round to 67
      const result2 = calculateProgress({ 0: 'a', 1: 'b' }, 3)
      expect(result2.percentage).toBe(67)
    })

    it('should handle zero questions', () => {
      const result = calculateProgress({}, 0)

      expect(result).toEqual({
        answeredCount: 0,
        unansweredCount: 0,
        percentage: 0
      })
    })
  })

  describe('isExamComplete', () => {
    it('should return false for empty answers', () => {
      expect(isExamComplete({}, 10)).toBe(false)
    })

    it('should return false for partially answered exam', () => {
      const userAnswers = {
        0: 'a',
        2: 'b',
        5: 'c'
      }
      expect(isExamComplete(userAnswers, 10)).toBe(false)
    })

    it('should return true for fully answered exam', () => {
      const userAnswers = {
        0: 'a',
        1: 'b',
        2: 'c'
      }
      expect(isExamComplete(userAnswers, 3)).toBe(true)
    })

    it('should handle 60 question exam', () => {
      const userAnswers = {}
      for (let i = 0; i < 60; i++) {
        userAnswers[i] = 'a'
      }
      expect(isExamComplete(userAnswers, 60)).toBe(true)
    })

    it('should return true for zero questions', () => {
      expect(isExamComplete({}, 0)).toBe(true)
    })
  })

  describe('getUnansweredQuestions', () => {
    it('should return all indices for empty answers', () => {
      const result = getUnansweredQuestions({}, 5)
      expect(result).toEqual([0, 1, 2, 3, 4])
    })

    it('should return unanswered indices for partial answers', () => {
      const userAnswers = {
        0: 'a',
        2: 'b',
        4: 'c'
      }
      const result = getUnansweredQuestions(userAnswers, 5)
      expect(result).toEqual([1, 3])
    })

    it('should return empty array when all answered', () => {
      const userAnswers = {
        0: 'a',
        1: 'b',
        2: 'c'
      }
      const result = getUnansweredQuestions(userAnswers, 3)
      expect(result).toEqual([])
    })

    it('should handle sparse answers correctly', () => {
      const userAnswers = {
        1: 'a',
        5: 'b',
        9: 'c'
      }
      const result = getUnansweredQuestions(userAnswers, 10)
      expect(result).toEqual([0, 2, 3, 4, 6, 7, 8])
    })

    it('should return empty array for zero questions', () => {
      const result = getUnansweredQuestions({}, 0)
      expect(result).toEqual([])
    })

    it('should handle 60 question exam with gaps', () => {
      const userAnswers = {}
      // Answer every other question
      for (let i = 0; i < 60; i += 2) {
        userAnswers[i] = 'a'
      }

      const result = getUnansweredQuestions(userAnswers, 60)

      // Should return all odd indices
      const expectedUnanswered = []
      for (let i = 1; i < 60; i += 2) {
        expectedUnanswered.push(i)
      }

      expect(result).toEqual(expectedUnanswered)
      expect(result.length).toBe(30)
    })
  })

  describe('isQuestionAnswered', () => {
    it('should return false for unanswered question', () => {
      const userAnswers = { 0: 'a', 2: 'b' }

      expect(isQuestionAnswered(userAnswers, 1)).toBe(false)
      expect(isQuestionAnswered(userAnswers, 3)).toBe(false)
    })

    it('should return true for answered question', () => {
      const userAnswers = { 0: 'a', 2: 'b' }

      expect(isQuestionAnswered(userAnswers, 0)).toBe(true)
      expect(isQuestionAnswered(userAnswers, 2)).toBe(true)
    })

    it('should handle edge cases', () => {
      const userAnswers = { 0: 'a', 59: 'b' }

      expect(isQuestionAnswered(userAnswers, 0)).toBe(true)
      expect(isQuestionAnswered(userAnswers, 59)).toBe(true)
      expect(isQuestionAnswered(userAnswers, 30)).toBe(false)
    })

    it('should return false for empty answers', () => {
      expect(isQuestionAnswered({}, 0)).toBe(false)
      expect(isQuestionAnswered({}, 5)).toBe(false)
    })

    it('should handle falsy answer values correctly', () => {
      // Even if the answer is falsy but defined, it should return true
      const userAnswers = { 0: 0, 1: '', 2: null }

      expect(isQuestionAnswered(userAnswers, 0)).toBe(true)
      expect(isQuestionAnswered(userAnswers, 1)).toBe(true)
      expect(isQuestionAnswered(userAnswers, 2)).toBe(true)
      expect(isQuestionAnswered(userAnswers, 3)).toBe(false)
    })
  })
})
