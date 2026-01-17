/**
 * KaTeX Utility Functions
 *
 * Provides helper functions for rendering LaTeX math expressions
 * in question text using KaTeX library.
 */

import katex from 'katex'

/**
 * Renders LaTeX expressions in text using KaTeX
 * Supports both inline math ($...$) and display math ($$...$$)
 *
 * @param {string} text - Text containing LaTeX expressions
 * @returns {string} HTML string with rendered math
 */
export function renderMath(text) {
  if (!text) return ''

  // Replace display math ($$...$$) first
  let result = text.replace(/\$\$(.*?)\$\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
      })
    } catch (e) {
      console.error('KaTeX rendering error (display):', e)
      return match
    }
  })

  // Replace inline math ($...$)
  result = result.replace(/\$(.*?)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, {
        displayMode: false,
        throwOnError: false,
      })
    } catch (e) {
      console.error('KaTeX rendering error (inline):', e)
      return match
    }
  })

  return result
}
