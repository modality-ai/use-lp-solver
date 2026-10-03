import type { Model, Options, SolutionStatus } from './types'
import { tableauModel } from './tableau'
import { phase1 } from './simplex'

export type Relaxation = {
  status: SolutionStatus
  value: number
  keys: string[]
  values: number[]
}

/** Solve the continuous LP relaxation of a model and read back every variable's value. */
export const relax = (model: Model, options: Required<Options>): Relaxation => {
  const { tableau } = tableauModel(model)
  const [status, value] = phase1(tableau, options)
  const values: number[] = []

  if (status === 'optimal') {
    for (let i = 0; i < tableau.numVariables; i++) {
      const pos = tableau.positionOfVariable[i]!
      const row = pos - tableau.width
      values.push(row >= 1 && row < tableau.height ? tableau.matrix[row * tableau.width]! : 0)
    }
  }

  return { status, value, keys: tableau.variableKeys, values }
}
