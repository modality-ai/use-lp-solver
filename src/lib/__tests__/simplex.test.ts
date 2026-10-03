import { describe, it, expect } from 'bun:test'
import { phase1, phase2 } from '../simplex'
import { tableauModel } from '../tableau'
import { defaultOptions } from '../solver'
import type { Model } from '../types'

const build = (constraints: object, variables: object) =>
  tableauModel({ direction: 'maximize', objective: 'p', constraints, variables } as unknown as Model).tableau

describe('phase1', () => {
  it('solves a feasible maximization', () => {
    const t = build({ c: { max: 4 } }, { x: { p: 3, c: 2 } })
    expect(phase1(t, defaultOptions)).toEqual(['optimal', 6])
  })
  it('reports infeasible for contradictory bounds', () => {
    const t = build({ a: { min: 5 }, b: { max: 2 } }, { x: { p: 1, a: 1, b: 1 } })
    expect(phase1(t, defaultOptions)[0]).toBe('infeasible')
  })
})

describe('phase2', () => {
  it('reports unbounded when a variable has no limiting row', () => {
    const t = build({ c: { max: 4 } }, { x: { p: 1 } })
    expect(phase2(t, defaultOptions)[0]).toBe('unbounded')
  })
})
