import { describe, it, expect } from 'vitest'
import {
  getAnswerStatus,
  calculateExamResults,
  calculatePercentage
} from './examScoring.js'

describe('examScoring', () => {
  describe('getAnswerStatus', () => {
    it('should return "unanswered" when userAnswer is undefined', () => {
      const question = { correct_answer: 'a' }
      const result = getAnswerStatus(question, undefined)
      expect(result).toBe('unanswered')
    })

    it('should return "correct" when userAnswer matches correct_answer', () => {
      const question = { correct_answer: 'b' }
      const result = getAnswerStatus(question, 'b')
      expect(result).toBe('correct')
    })

    it('should return "incorrect" when userAnswer does not match correct_answer', () => {
      const question = { correct_answer: 'a' }
      const result = getAnswerStatus(question, 'c')
      expect(result).toBe('incorrect')
    })

    it('should handle different answer formats', () => {
      const question = { correct_answer: '1' }
      expect(getAnswerStatus(question, '1')).toBe('correct')
      expect(getAnswerStatus(question, '2')).toBe('incorrect')
    })
  })

  describe('calculateExamResults', () => {
    it('should correctly count all correct answers', () => {
      const questions = [
        { correct_answer: 'a' },
        { correct_answer: 'b' },
        { correct_answer: 'c' }
      ]
      const userAnswers = { 0: 'a', 1: 'b', 2: 'c' }
      const config = { minCorrectAnswers: 2 }

      const result = calculateExamResults(questions, userAnswers, config)

      expect(result).toEqual({
        correctCount: 3,
        wrongCount: 0,
        unansweredCount: 0,
        totalQuestions: 3,
        passed: true
      })
    })

    it('should correctly count wrong answers', () => {
      const questions = [
        { correct_answer: 'a' },
        { correct_answer: 'b' },
        { correct_answer: 'c' }
      ]
      const userAnswers = { 0: 'x', 1: 'y', 2: 'z' }
      const config = { minCorrectAnswers: 2 }

      const result = calculateExamResults(questions, userAnswers, config)

      expect(result).toEqual({
        correctCount: 0,
        wrongCount: 3,
        unansweredCount: 0,
        totalQuestions: 3,
        passed: false
      })
    })

    it('should correctly count unanswered questions', () => {
      const questions = [
        { correct_answer: 'a' },
        { correct_answer: 'b' },
        { correct_answer: 'c' }
      ]
      const userAnswers = {} // No answers provided
      const config = { minCorrectAnswers: 2 }

      const result = calculateExamResults(questions, userAnswers, config)

      expect(result).toEqual({
        correctCount: 0,
        wrongCount: 0,
        unansweredCount: 3,
        totalQuestions: 3,
        passed: false
      })
    })

    it('should handle mixed results (correct, wrong, unanswered)', () => {
      const questions = [
        { correct_answer: 'a' },
        { correct_answer: 'b' },
        { correct_answer: 'c' },
        { correct_answer: 'd' },
        { correct_answer: 'e' }
      ]
      const userAnswers = {
        0: 'a',  // correct
        1: 'x',  // wrong
        2: 'c',  // correct
        // 3: undefined (unanswered)
        4: 'y'   // wrong
      }
      const config = { minCorrectAnswers: 3 }

      const result = calculateExamResults(questions, userAnswers, config)

      expect(result).toEqual({
        correctCount: 2,
        wrongCount: 2,
        unansweredCount: 1,
        totalQuestions: 5,
        passed: false
      })
    })

    it('should determine pass status based on minCorrectAnswers', () => {
      const questions = Array(60).fill({ correct_answer: 'a' })
      const userAnswers = {}

      // Answer exactly 48 questions correctly (passing threshold)
      for (let i = 0; i < 48; i++) {
        userAnswers[i] = 'a'
      }

      const config = { minCorrectAnswers: 48 }

      const result = calculateExamResults(questions, userAnswers, config)

      expect(result.correctCount).toBe(48)
      expect(result.passed).toBe(true)
    })

    it('should fail when one correct answer below threshold', () => {
      const questions = Array(60).fill({ correct_answer: 'a' })
      const userAnswers = {}

      // Answer only 47 questions correctly (one below threshold)
      for (let i = 0; i < 47; i++) {
        userAnswers[i] = 'a'
      }

      const config = { minCorrectAnswers: 48 }

      const result = calculateExamResults(questions, userAnswers, config)

      expect(result.correctCount).toBe(47)
      expect(result.passed).toBe(false)
    })

    it('should handle empty questions array', () => {
      const questions = []
      const userAnswers = {}
      const config = { minCorrectAnswers: 0 }

      const result = calculateExamResults(questions, userAnswers, config)

      expect(result).toEqual({
        correctCount: 0,
        wrongCount: 0,
        unansweredCount: 0,
        totalQuestions: 0,
        passed: true // 0 >= 0
      })
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate correct percentage', () => {
      expect(calculatePercentage(50, 100)).toBe(50)
      expect(calculatePercentage(48, 60)).toBe(80)
      expect(calculatePercentage(30, 60)).toBe(50)
    })

    it('should round to nearest integer', () => {
      expect(calculatePercentage(1, 3)).toBe(33) // 33.333... rounds to 33
      expect(calculatePercentage(2, 3)).toBe(67) // 66.666... rounds to 67
    })

    it('should handle 100% correctly', () => {
      expect(calculatePercentage(60, 60)).toBe(100)
      expect(calculatePercentage(1, 1)).toBe(100)
    })

    it('should handle 0% correctly', () => {
      expect(calculatePercentage(0, 60)).toBe(0)
      expect(calculatePercentage(0, 1)).toBe(0)
    })

    it('should handle division by zero', () => {
      expect(calculatePercentage(0, 0)).toBe(0)
      expect(calculatePercentage(5, 0)).toBe(0)
    })
  })
})
