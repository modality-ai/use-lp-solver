import { describe, it, expect } from 'bun:test'
import { solve, lessEq, greaterEq } from '../index'
import type { Model } from '../index'

const run = (model: Model) => solve(model)

describe('solution result keyed by objective name', () => {
  it('uses the model objective name as the result key', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'profit',
      constraints: { c: lessEq(4) },
      variables: { x: { profit: 3, c: 2 } },
    })
    expect(Object.keys(solution.result)).toEqual(['profit'])
  })

  it('falls back to "objective" when the model omits the objective name', () => {
    const solution = run({
      direction: 'maximize',
      constraints: { c: lessEq(4) },
      variables: { x: { c: 2 } },
    })
    expect(Object.keys(solution.result)).toEqual(['objective'])
  })

  it('falls back to "objective" when the objective name is explicitly undefined', () => {
    const solution = run({
      direction: 'maximize',
      objective: undefined,
      constraints: { c: lessEq(4) },
      variables: { x: { c: 2 } },
    })
    expect(Object.keys(solution.result)).toEqual(['objective'])
  })

  it('keeps an empty-string objective name as an empty key rather than the fallback', () => {
    const solution = run({
      direction: 'maximize',
      objective: '',
      constraints: { c: lessEq(4) },
      variables: { x: { c: 2 } },
    })
    expect(Object.keys(solution.result)).toEqual([''])
  })

  it('preserves a non-identifier objective name verbatim', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'total revenue (USD)',
      constraints: { c: lessEq(4) },
      variables: { x: { 'total revenue (USD)': 3, c: 2 } },
    })
    expect(solution.result['total revenue (USD)']).toBe(6)
  })

  it('keys the result by objective name for a minimization model', () => {
    const solution = run({
      direction: 'minimize',
      objective: 'cost',
      constraints: { need: greaterEq(4) },
      variables: { x: { cost: 2, need: 1 } },
    })
    expect(solution.result.cost).toBe(8)
  })

  it('keys the result by objective name on the integer branch', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'p',
      constraints: { b: lessEq(10) },
      variables: { a: { p: 5, b: 4 }, c: { p: 4, b: 3 } },
      integers: true,
    })
    expect(solution.result.p).toBe(13)
  })

  it('keys the result by objective name on the binary branch', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'p',
      constraints: { b: lessEq(100) },
      variables: { a: { p: 5, b: 1 }, c: { p: 4, b: 1 } },
      binaries: true,
    })
    expect(solution.result.p).toBe(9)
  })

  it('still keys the result when the integer branch reports infeasible', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'p',
      constraints: { lo: { min: 1.2 }, hi: { max: 1.8 } },
      variables: { x: { p: 1, lo: 1, hi: 1 } },
      integers: true,
    })
    expect(Object.keys(solution.result)).toEqual(['p'])
  })

  it('reports NaN as the objective value when the LP is unbounded', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'obj',
      constraints: { c1: lessEq(100), obj: { max: Infinity } },
      variables: { x: { c1: 0, obj: 1 } },
    })
    expect(solution.result.obj).toBeNaN()
  })

  it('returns exactly one entry in result', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'profit',
      constraints: { a: lessEq(4), b: lessEq(9) },
      variables: { x: { profit: 3, a: 2, b: 1 }, y: { profit: 1, a: 1, b: 1 } },
    })
    expect(Object.keys(solution.result).length).toBe(1)
  })
})