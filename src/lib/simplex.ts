import type { Options, Tableau, SolutionStatus } from './types'
import { index, update } from './tableau'
import { roundToPrecision } from './util'

const MACHINE_EPSILON = 1e-16

const pivot = (tableau: Tableau, row: number, col: number): void => {
  const quotient = index(tableau, row, col)
  const leaving = tableau.variableAtPosition[tableau.width + row]!
  const entering = tableau.variableAtPosition[col]!
  tableau.variableAtPosition[tableau.width + row] = entering
  tableau.variableAtPosition[col] = leaving
  tableau.positionOfVariable[leaving] = col
  tableau.positionOfVariable[entering] = tableau.width + row

  const nonZeroColumns: number[] = []

  for (let c = 0; c < tableau.width; c++) {
    const value = index(tableau, row, c)
    if (Math.abs(value) > MACHINE_EPSILON) {
      update(tableau, row, c, value / quotient)
      nonZeroColumns.push(c)
    } else {
      update(tableau, row, c, 0.0)
    }
  }
  update(tableau, row, col, 1.0 / quotient)

  for (let r = 0; r < tableau.height; r++) {
    if (r === row) continue
    const coef = index(tableau, r, col)
    if (Math.abs(coef) > MACHINE_EPSILON) {
      for (let i = 0; i < nonZeroColumns.length; i++) {
        const c = nonZeroColumns[i]!
        update(tableau, r, c, index(tableau, r, c) - coef * index(tableau, row, c))
      }
      update(tableau, r, col, -coef / quotient)
    }
  }
}

const hasCycle = (history: Array<[number, number]>, tableau: Tableau, row: number, col: number): boolean => {
  history.push([tableau.variableAtPosition[tableau.width + row]!, tableau.variableAtPosition[col]!])

  for (let length = 6; length <= Math.trunc(history.length / 2); length++) {
    let cycle = true
    for (let i = 0; i < length; i++) {
      const item = history.length - 1 - i
      const [row1, col1] = history[item]!
      const [row2, col2] = history[item - length]!
      if (row1 !== row2 || col1 !== col2) {
        cycle = false
        break
      }
    }
    if (cycle) return true
  }
  return false
}

export const phase2 = (tableau: Tableau, options: Required<Options>): [SolutionStatus, number] => {
  const pivotHistory: Array<[number, number]> = []
  const { precision, maxPivots, checkCycles } = options

  for (let iter = 0; iter < maxPivots; iter++) {
    let col = 0
    let value = -precision
    for (let c = 1; c < tableau.width; c++) {
      const reducedCost = index(tableau, 0, c)
      if (reducedCost < value) {
        value = reducedCost
        col = c
      }
    }

    if (col === 0) return ['optimal', roundToPrecision(index(tableau, 0, 0), precision)]

    let row = 0
    let minRatio = Infinity
    for (let r = 1; r < tableau.height; r++) {
      const cellValue = index(tableau, r, col)
      if (cellValue <= precision) continue
      const rhs = index(tableau, r, 0)
      const ratio = rhs / cellValue
      if (ratio < minRatio) {
        row = r
        minRatio = ratio
        if (ratio <= precision) break
      }
    }

    if (row === 0) return ['unbounded', col]

    if (checkCycles && hasCycle(pivotHistory, tableau, row, col)) {
      return ['cycled', NaN]
    }

    pivot(tableau, row, col)
  }

  return ['cycled', NaN]
}

export const phase1 = (tableau: Tableau, options: Required<Options>): [SolutionStatus, number] => {
  const pivotHistory: Array<[number, number]> = []
  const { precision, maxPivots, checkCycles } = options

  for (let iter = 0; iter < maxPivots; iter++) {
    let row = 0
    let rhs = -precision
    for (let r = 1; r < tableau.height; r++) {
      const value = index(tableau, r, 0)
      if (value < rhs) {
        rhs = value
        row = r
      }
    }

    if (row === 0) return phase2(tableau, options)

    let col = 0
    let maxRatio = Infinity
    for (let c = 1; c < tableau.width; c++) {
      const coefficient = index(tableau, row, c)
      if (coefficient < -precision) {
        const ratio = -index(tableau, 0, c) / coefficient
        if (ratio < maxRatio) {
          maxRatio = ratio
          col = c
        }
      }
    }

    if (col === 0) return ['infeasible', NaN]

    if (checkCycles && hasCycle(pivotHistory, tableau, row, col)) {
      return ['cycled', NaN]
    }

    pivot(tableau, row, col)
  }

  return ['cycled', NaN]
}
