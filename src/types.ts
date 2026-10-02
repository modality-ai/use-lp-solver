export type Constraint = {
  equal?: number
  min?: number
  max?: number
}

export type Coefficients<ConstraintKey = string> =
  | Iterable<readonly [ConstraintKey, number]>
  | (ConstraintKey extends string ? Readonly<Partial<Record<ConstraintKey, number>>> : never)

export type OptimizationDirection = 'maximize' | 'minimize'

export type Model<VariableKey = string, ConstraintKey = string> = {
  direction?: OptimizationDirection
  objective?: ConstraintKey
  constraints: Iterable<readonly [ConstraintKey, Constraint]> | (ConstraintKey extends string ? Readonly<Partial<Record<ConstraintKey, Constraint>>> : never)
  variables: Iterable<readonly [VariableKey, Coefficients<ConstraintKey>]> | (VariableKey extends string ? Readonly<Partial<Record<VariableKey, Coefficients<ConstraintKey>>>> : never)
  integers?: boolean | Iterable<VariableKey>
  binaries?: boolean | Iterable<VariableKey>
}

export type SolutionStatus = 'optimal' | 'infeasible' | 'unbounded' | 'timedout' | 'cycled'

export type Solution<VariableKey = string> = {
  status: SolutionStatus
  result: number
  variables: [VariableKey, number][]
}

export type Options = {
  precision?: number
  checkCycles?: boolean
  maxPivots?: number
  tolerance?: number
  timeout?: number
  maxIterations?: number
  includeZeroVariables?: boolean
}

export type Tableau = {
  matrix: Float64Array
  width: number
  height: number
  positionOfVariable: Int32Array
  variableAtPosition: Int32Array
  variableKeys: string[]
  numVariables: number
}
