import { describe, it, expect, vi } from 'vitest'
import { createExamKeyboardHandler } from './examKeyboardShortcuts.js'

describe('examKeyboardShortcuts', () => {
  describe('createExamKeyboardHandler', () => {
    // Helper to create a mock keyboard event
    function createKeyboardEvent(key, target = { matches: () => false }) {
      return {
        key,
        target,
        preventDefault: vi.fn()
      }
    }

    // Helper to create a mock question with choices
    function createQuestion(numChoices = 4) {
      const choices = []
      const keys = ['A', 'B', 'C', 'D']
      for (let i = 0; i < numChoices; i++) {
        choices.push({
          key: keys[i],
          text: `Answer ${keys[i]}`
        })
      }
      return { question_number: 1, choices }
    }

    describe('arrow key navigation', () => {
      it('should call onPrevious when ArrowLeft is pressed', () => {
        const onPrevious = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious,
          onNext: vi.fn(),
          onSelectAnswer: vi.fn(),
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => false,
        })

        const event = createKeyboardEvent('ArrowLeft')
        handler(event)

        expect(onPrevious).toHaveBeenCalledOnce()
        expect(event.preventDefault).toHaveBeenCalledOnce()
      })

      it('should call onNext when ArrowRight is pressed', () => {
        const onNext = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious: vi.fn(),
          onNext,
          onSelectAnswer: vi.fn(),
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => false,
        })

        const event = createKeyboardEvent('ArrowRight')
        handler(event)

        expect(onNext).toHaveBeenCalledOnce()
        expect(event.preventDefault).toHaveBeenCalledOnce()
      })
    })

    describe('number key answer selection', () => {
      it('should select first answer when 1 is pressed', () => {
        const onSelectAnswer = vi.fn()
        const question = createQuestion()
        const handler = createExamKeyboardHandler({
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onSelectAnswer,
          getCurrentQuestion: () => question,
          isModalOpen: () => false,
        })

        const event = createKeyboardEvent('1')
        handler(event)

        expect(onSelectAnswer).toHaveBeenCalledWith('A')
        expect(event.preventDefault).toHaveBeenCalledOnce()
      })

      it('should select second answer when 2 is pressed', () => {
        const onSelectAnswer = vi.fn()
        const question = createQuestion()
        const handler = createExamKeyboardHandler({
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onSelectAnswer,
          getCurrentQuestion: () => question,
          isModalOpen: () => false,
        })

        const event = createKeyboardEvent('2')
        handler(event)

        expect(onSelectAnswer).toHaveBeenCalledWith('B')
      })

      it('should select third answer when 3 is pressed', () => {
        const onSelectAnswer = vi.fn()
        const question = createQuestion()
        const handler = createExamKeyboardHandler({
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onSelectAnswer,
          getCurrentQuestion: () => question,
          isModalOpen: () => false,
        })

        const event = createKeyboardEvent('3')
        handler(event)

        expect(onSelectAnswer).toHaveBeenCalledWith('C')
      })

      it('should select fourth answer when 4 is pressed', () => {
        const onSelectAnswer = vi.fn()
        const question = createQuestion()
        const handler = createExamKeyboardHandler({
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onSelectAnswer,
          getCurrentQuestion: () => question,
          isModalOpen: () => false
        })

        const event = createKeyboardEvent('4')
        handler(event)

        expect(onSelectAnswer).toHaveBeenCalledWith('D')
      })

      it('should not select answer if choice index is out of bounds', () => {
        const onSelectAnswer = vi.fn()
        const question = createQuestion(2) // Only 2 choices
        const handler = createExamKeyboardHandler({
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onSelectAnswer,
          getCurrentQuestion: () => question,
          isModalOpen: () => false,
        })

        const event = createKeyboardEvent('4') // Try to select 4th choice
        handler(event)

        expect(onSelectAnswer).not.toHaveBeenCalled()
        expect(event.preventDefault).toHaveBeenCalledOnce()
      })
    })

    describe('modal blocking', () => {
      it('should not handle any keys when modal is open', () => {
        const onPrevious = vi.fn()
        const onNext = vi.fn()
        const onSelectAnswer = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious,
          onNext,
          onSelectAnswer,
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => true, // Modal is open
        })

        // Try arrow keys
        const leftEvent = createKeyboardEvent('ArrowLeft')
        handler(leftEvent)
        expect(onPrevious).not.toHaveBeenCalled()

        const rightEvent = createKeyboardEvent('ArrowRight')
        handler(rightEvent)
        expect(onNext).not.toHaveBeenCalled()

        // Try number keys
        const numberEvent = createKeyboardEvent('1')
        handler(numberEvent)
        expect(onSelectAnswer).not.toHaveBeenCalled()
      })
    })

    describe('interactive element blocking', () => {
      it('should not handle keys when focus is on a button', () => {
        const onPrevious = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious,
          onNext: vi.fn(),
          onSelectAnswer: vi.fn(),
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => false,
        })

        const button = { matches: (selector) => selector === 'input, textarea, select, button' }
        const event = createKeyboardEvent('ArrowLeft', button)
        handler(event)

        expect(onPrevious).not.toHaveBeenCalled()
      })

      it('should not handle keys when focus is on an input', () => {
        const onPrevious = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious,
          onNext: vi.fn(),
          onSelectAnswer: vi.fn(),
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => false,
        })

        const input = { matches: (selector) => selector === 'input, textarea, select, button' }
        const event = createKeyboardEvent('ArrowLeft', input)
        handler(event)

        expect(onPrevious).not.toHaveBeenCalled()
      })

      it('should not handle keys when focus is on a textarea', () => {
        const onPrevious = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious,
          onNext: vi.fn(),
          onSelectAnswer: vi.fn(),
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => false,
        })

        const textarea = { matches: (selector) => selector === 'input, textarea, select, button' }
        const event = createKeyboardEvent('ArrowLeft', textarea)
        handler(event)

        expect(onPrevious).not.toHaveBeenCalled()
      })

      it('should not handle keys when focus is on a select', () => {
        const onPrevious = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious,
          onNext: vi.fn(),
          onSelectAnswer: vi.fn(),
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => false,
        })

        const select = { matches: (selector) => selector === 'input, textarea, select, button' }
        const event = createKeyboardEvent('ArrowLeft', select)
        handler(event)

        expect(onPrevious).not.toHaveBeenCalled()
      })
    })

    describe('unhandled keys', () => {
      it('should not handle keys other than arrows and 1-4', () => {
        const onPrevious = vi.fn()
        const onNext = vi.fn()
        const onSelectAnswer = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious,
          onNext,
          onSelectAnswer,
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => false,
        })

        const event = createKeyboardEvent('a')
        handler(event)

        expect(onPrevious).not.toHaveBeenCalled()
        expect(onNext).not.toHaveBeenCalled()
        expect(onSelectAnswer).not.toHaveBeenCalled()
        expect(event.preventDefault).not.toHaveBeenCalled()
      })

      it('should not handle number keys outside 1-4 range', () => {
        const onSelectAnswer = vi.fn()
        const handler = createExamKeyboardHandler({
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          onSelectAnswer,
          getCurrentQuestion: () => createQuestion(),
          isModalOpen: () => false,
        })

        const event5 = createKeyboardEvent('5')
        handler(event5)
        expect(onSelectAnswer).not.toHaveBeenCalled()

        const event0 = createKeyboardEvent('0')
        handler(event0)
        expect(onSelectAnswer).not.toHaveBeenCalled()
      })
    })
  })
})
