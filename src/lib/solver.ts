import type { Model, Options, Solution, Constraint } from './types'
import { tableauModel } from './tableau'
import { phase1 } from './simplex'
import { branchAndCut } from './branchAndCut'
import { roundToPrecision } from './util'

export const defaultOptions: Required<Options> = {
  precision: 1e-8,
  checkCycles: false,
  maxPivots: 8192,
  tolerance: 0,
  timeout: Infinity,
  maxIterations: 32768,
  includeZeroVariables: false,
}

export const solve = <VarKey extends string = string, ConKey extends string = string>(
  model: Model<VarKey, ConKey>,
  options: Partial<Options> = {},
): Solution<VarKey> => {
  const finalOptions = { ...defaultOptions, ...options }

  const { tableau, integerVariables, binaryVariables } = tableauModel(model)

  let status
  let objectiveValue
  let resultTableau

  const [lpStatus, lpValue] = phase1(tableau, finalOptions)

  if (lpStatus !== 'optimal') {
    status = lpStatus
    objectiveValue = NaN
    resultTableau = tableau
  } else if (integerVariables.size > 0 || binaryVariables.size > 0) {
    ;[resultTableau, status, objectiveValue] = branchAndCut(tableau, finalOptions, integerVariables, binaryVariables)
  } else {
    status = lpStatus
    objectiveValue = lpValue
    resultTableau = tableau
  }

  const variables: [VarKey, number][] = []

  if (status === 'optimal' && isFinite(objectiveValue)) {
    for (let i = 0; i < tableau.numVariables; i++) {
      const pos = resultTableau.positionOfVariable[i]!

      let varValue = 0

      if (pos < resultTableau.width) {
        // Variable is non-basic (value is 0)
        varValue = 0
      } else {
        // Variable is basic, stored in the basis
        // pos >= width means it's the (pos - width)th constraint row
        const rowIdx = pos - resultTableau.width
        if (rowIdx < resultTableau.height) {
          varValue = resultTableau.matrix[rowIdx * resultTableau.width]!
        }
      }

      if (finalOptions.includeZeroVariables || Math.abs(varValue) > finalOptions.precision) {
        variables.push([tableau.variableKeys[i] as VarKey, roundToPrecision(varValue, finalOptions.precision)])
      }
    }
  }

  return {
    status,
    result: isFinite(objectiveValue) ? roundToPrecision(objectiveValue, finalOptions.precision) : objectiveValue,
    variables,
  }
}

export const lessEq = (value: number): Constraint => ({ max: value })
export const greaterEq = (value: number): Constraint => ({ min: value })
export const equalTo = (value: number): Constraint => ({ equal: value })
export const inRange = (lower: number, upper: number): Constraint => ({ min: lower, max: upper })
