import { describe, it, expect } from 'bun:test'
import { solve, greaterEq, lessEq } from '../index'
import type { Model } from '../index'

const run = (model: Model) => solve(model)

const toRecord = (variables: [string, number][]) => Object.fromEntries(variables)

describe('minimization with >= constraints', () => {
  it('reports the cheapest feasible cost for a single >= constraint', () => {
    const solution = run({
      direction: 'minimize',
      objective: 'cost',
      constraints: { need: greaterEq(4) },
      variables: { x: { cost: 2, need: 1 } },
    })
    expect(solution.status).toBe('optimal')
    expect(solution.result).toBe(8)
  })

  it('returns the variable values that satisfy the >= constraint', () => {
    const solution = run({
      direction: 'minimize',
      objective: 'cost',
      constraints: { need: greaterEq(4) },
      variables: { x: { cost: 2, need: 1 } },
    })
    expect(toRecord(solution.variables)).toEqual({ x: 4 })
  })

  it('solves the diet example with two >= constraints', () => {
    const solution = run({
      direction: 'minimize',
      objective: 'cost',
      constraints: { protein: greaterEq(4), calories: greaterEq(3), cost: { min: 0 } },
      variables: {
        foodA: { protein: 1, calories: 1, cost: 2 },
        foodB: { protein: 2, calories: 1, cost: 3 },
      },
    })
    expect(solution.result).toBe(7)
  })

  it('picks the optimal diet quantities', () => {
    const solution = run({
      direction: 'minimize',
      objective: 'cost',
      constraints: { protein: greaterEq(4), calories: greaterEq(3), cost: { min: 0 } },
      variables: {
        foodA: { protein: 1, calories: 1, cost: 2 },
        foodB: { protein: 2, calories: 1, cost: 3 },
      },
    })
    expect(toRecord(solution.variables)).toEqual({ foodA: 2, foodB: 1 })
  })
})

describe('zero-valued bounds', () => {
  it('treats max: 0 as a real bound instead of unbounded', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'profit',
      constraints: { cap: lessEq(0) },
      variables: { x: { profit: 1, cap: 1 } },
    })
    expect(solution.status).toBe('optimal')
  })

  it('keeps the variable at zero under a max: 0 bound', () => {
    const solution = run({
      direction: 'maximize',
      objective: 'profit',
      constraints: { cap: lessEq(0) },
      variables: { x: { profit: 1, cap: 1 } },
    })
    expect(solution.result).toBe(0)
  })
})

describe('integer programming', () => {
  const knapsack = {
    direction: 'maximize',
    objective: 'p',
    constraints: { b: lessEq(10) },
    variables: { a: { p: 5, b: 4 }, c: { p: 4, b: 3 } },
  } as unknown as Model

  it('finds the best whole-number knapsack profit', () => {
    expect(solve({ ...knapsack, integers: true }).result).toBe(13)
  })

  it('returns whole-number quantities for the knapsack', () => {
    expect(toRecord(solve({ ...knapsack, integers: true }).variables)).toEqual({ a: 1, c: 2 })
  })

  it('keeps continuous variables fractional when only some are integers', () => {
    expect(solve({ ...knapsack, integers: ['a'] } as unknown as Model).result).toBeCloseTo(13.3333, 3)
  })

  it('limits binary variables to 0 or 1', () => {
    const model = {
      direction: 'maximize',
      objective: 'p',
      constraints: { b: lessEq(100) },
      variables: { a: { p: 5, b: 1 }, c: { p: 4, b: 1 } },
      binaries: true,
    } as unknown as Model
    expect(solve(model).result).toBe(9)
  })

  it('reports infeasible when no whole number fits', () => {
    const model = {
      direction: 'maximize',
      objective: 'p',
      constraints: { lo: { min: 1.2 }, hi: { max: 1.8 } },
      variables: { x: { p: 1, lo: 1, hi: 1 } },
      integers: true,
    } as unknown as Model
    expect(solve(model).status).toBe('infeasible')
  })
})
