import { describe, it, expect } from 'bun:test'
import { index, update, tableauModel } from '../tableau'
import type { Model } from '../types'

const model = {
  direction: 'maximize',
  objective: 'p',
  constraints: { c: { max: 4 } },
  variables: { x: { p: 3, c: 2 } },
} as unknown as Model

describe('index and update', () => {
  it('writes and reads a cell', () => {
    const { tableau } = tableauModel(model)
    update(tableau, 1, 1, 9)
    expect(index(tableau, 1, 1)).toBe(9)
  })
})

describe('tableauModel', () => {
  it('sizes the tableau from variables and constraints', () => {
    const { tableau } = tableauModel(model)
    expect([tableau.width, tableau.height]).toEqual([2, 2])
  })
  it('negates the objective coefficient for maximize', () => {
    const { tableau } = tableauModel(model)
    expect(index(tableau, 0, 1)).toBe(-3)
  })
  it('stores the constraint max as the right-hand side', () => {
    const { tableau } = tableauModel(model)
    expect(index(tableau, 1, 0)).toBe(4)
  })
  it('keeps a max of 0 as a bound', () => {
    const { tableau } = tableauModel({ ...model, constraints: { c: { max: 0 } } } as unknown as Model)
    expect(index(tableau, 1, 0)).toBe(0)
  })
  it('negates a >= constraint row', () => {
    const { tableau } = tableauModel({ ...model, constraints: { c: { min: 4 } } } as unknown as Model)
    expect(index(tableau, 1, 0)).toBe(-4)
  })
  it('marks all variables integer when integers is true', () => {
    expect(tableauModel({ ...model, integers: true } as unknown as Model).integerVariables.has(0)).toBe(true)
  })
  it('marks listed variables binary', () => {
    expect(tableauModel({ ...model, binaries: ['x'] } as unknown as Model).binaryVariables.has(0)).toBe(true)
  })
})
