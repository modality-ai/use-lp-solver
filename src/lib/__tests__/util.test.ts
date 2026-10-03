import { describe, it, expect } from 'bun:test'
import { roundToPrecision, isZero, isInteger } from '../util'

describe('roundToPrecision', () => {
  it('rounds to the given precision', () => {
    expect(roundToPrecision(1.23456789, 1e-4)).toBe(1.2346)
  })
  it('returns non-finite values unchanged', () => {
    expect(roundToPrecision(Infinity, 1e-4)).toBe(Infinity)
  })
  it('returns the value unchanged when precision is not positive', () => {
    expect(roundToPrecision(1.23456, 0)).toBe(1.23456)
  })
})

describe('isZero', () => {
  it('is true within precision', () => {
    expect(isZero(1e-9, 1e-8)).toBe(true)
  })
  it('is false beyond precision', () => {
    expect(isZero(1e-3, 1e-8)).toBe(false)
  })
})

describe('isInteger', () => {
  it('is true near a whole number', () => {
    expect(isInteger(3.0000000001, 1e-8)).toBe(true)
  })
  it('is false for a fraction', () => {
    expect(isInteger(3.5, 1e-8)).toBe(false)
  })
})
