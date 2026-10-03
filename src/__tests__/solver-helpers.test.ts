import { describe, it, expect } from 'bun:test'
import { solve, defaultOptions, lessEq, greaterEq, equalTo, inRange } from '../index'

describe('constraint helpers', () => {
  it('lessEq sets max', () => expect(lessEq(3)).toEqual({ max: 3 }))
  it('greaterEq sets min', () => expect(greaterEq(3)).toEqual({ min: 3 }))
  it('equalTo sets equal', () => expect(equalTo(3)).toEqual({ equal: 3 }))
  it('inRange sets min and max', () => expect(inRange(1, 3)).toEqual({ min: 1, max: 3 }))
})

describe('defaultOptions', () => {
  it('has the default precision', () => expect(defaultOptions.precision).toBe(1e-8))
})

describe('solve options', () => {
  const model = {
    direction: 'maximize' as const,
    objective: 'p',
    constraints: { c: lessEq(4) },
    variables: { x: { p: 1, c: 1 }, y: { p: 0, c: 1 } },
  }
  it('omits zero variables by default', () => {
    expect(solve(model as any).variables.map(([k]) => k)).toEqual(['x'])
  })
  it('includes zero variables when requested', () => {
    expect(solve(model as any, { includeZeroVariables: true }).variables.length).toBe(2)
  })
})
