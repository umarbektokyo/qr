import { describe, it, expect } from 'vitest'
import { generateMatrix } from '../qr-render.js'

describe('generateMatrix', () => {
  it('generates a valid matrix for a simple URL', () => {
    const { matrix, actualEC } = generateMatrix('https://example.com', 'M')
    expect(matrix).toBeDefined()
    expect(matrix.length).toBeGreaterThan(0)
    expect(matrix[0].length).toBe(matrix.length) // square
    expect(actualEC).toBe('M')
  })

  it('matrix contains only booleans', () => {
    const { matrix } = generateMatrix('test', 'L')
    for (const row of matrix) {
      for (const cell of row) {
        expect(typeof cell).toBe('boolean')
      }
    }
  })

  it('has correct finder patterns in top-left corner', () => {
    const { matrix } = generateMatrix('hello', 'M')
    // Top-left 7x7 finder pattern: corners should be dark
    expect(matrix[0][0]).toBe(true)
    expect(matrix[0][6]).toBe(true)
    expect(matrix[6][0]).toBe(true)
    expect(matrix[6][6]).toBe(true)
    // Center of finder should be dark
    expect(matrix[3][3]).toBe(true)
  })

  it('falls back to lower EC level for long content', () => {
    const longContent = 'A'.repeat(2000)
    const { matrix, actualEC } = generateMatrix(longContent, 'H')
    expect(matrix).toBeDefined()
    // Should have fallen back from H
    expect(['L', 'M', 'Q']).toContain(actualEC)
  })

  it('throws for content that is too long for any EC level', () => {
    const tooLong = 'A'.repeat(10000)
    expect(() => generateMatrix(tooLong, 'H')).toThrow()
  })

  it('throws for empty content', () => {
    expect(() => generateMatrix('', 'M')).toThrow()
  })

  it('handles all EC levels', () => {
    for (const ec of ['L', 'M', 'Q', 'H']) {
      const { matrix, actualEC } = generateMatrix('test', ec)
      expect(matrix.length).toBeGreaterThan(0)
      expect(actualEC).toBe(ec)
    }
  })

  it('produces larger matrix for more data', () => {
    const { matrix: small } = generateMatrix('hi', 'L')
    const { matrix: large } = generateMatrix('https://example.com/very/long/path/here', 'L')
    expect(large.length).toBeGreaterThanOrEqual(small.length)
  })

  it('produces larger matrix for higher EC level', () => {
    const content = 'https://example.com/path'
    const { matrix: low } = generateMatrix(content, 'L')
    const { matrix: high } = generateMatrix(content, 'H')
    expect(high.length).toBeGreaterThanOrEqual(low.length)
  })

  it('has finder patterns in all three corners', () => {
    const { matrix } = generateMatrix('test', 'M')
    const n = matrix.length

    // Top-left
    expect(matrix[0][0]).toBe(true)
    // Top-right
    expect(matrix[0][n - 1]).toBe(true)
    // Bottom-left
    expect(matrix[n - 1][0]).toBe(true)
    // Bottom-right should NOT have a finder pattern
    expect(matrix[n - 1][n - 1]).toBe(false)
  })
})
