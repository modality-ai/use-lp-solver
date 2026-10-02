import type { Model, Tableau } from './types'

export const index = (tableau: Tableau, row: number, col: number): number => {
  return tableau.matrix[Math.imul(row, tableau.width) + col]
}

export const update = (tableau: Tableau, row: number, col: number, value: number): void => {
  tableau.matrix[Math.imul(row, tableau.width) + col] = value
}

export const tableauModel = (model: Model): {
  tableau: Tableau
  integerVariables: Set<number>
  binaryVariables: Set<number>
} => {
  const constraintKeys = new Set<string>()
  const variableKeys: string[] = []

  for (const [key, constraint] of Object.entries(model.constraints || {})) {
    // Skip constraints that have no bounds (both min and max are infinite)
    const min = (constraint as any).min ?? -Infinity
    const max = (constraint as any).max ?? Infinity
    const equal = (constraint as any).equal
    if (equal !== undefined || isFinite(min) || isFinite(max)) {
      constraintKeys.add(key)
    }
  }

  for (const [key] of Object.entries(model.variables || {})) {
    variableKeys.push(key)
  }

  const numConstraints = constraintKeys.size
  const numVariables = variableKeys.length
  const numSlackVariables = numConstraints
  const width = 1 + numVariables + numSlackVariables
  const height = 1 + numConstraints

  const matrix = new Float64Array(width * height)
  const positionOfVariable = new Int32Array(numVariables + numConstraints)
  const variableAtPosition = new Int32Array(width + numConstraints)

  const tempTableau: Tableau = { matrix, width, height, positionOfVariable, variableAtPosition, variableKeys: [], numVariables }

  for (let i = 0; i < numVariables; i++) {
    positionOfVariable[i] = i + 1
    variableAtPosition[i + 1] = i
  }

  for (let i = 0; i < numConstraints; i++) {
    positionOfVariable[numVariables + i] = width + i
    variableAtPosition[width + i] = numVariables + i
  }

  const objectiveKey = model.objective
  const objectiveCoefficients: Record<string, number> = {}
  if (objectiveKey) {
    for (const varKey of variableKeys) {
      const variable = (model.variables as Record<string, Record<string, number>>)[varKey] || {}
      objectiveCoefficients[varKey] = variable[objectiveKey] || 0
    }
  }

  const direction = model.direction === 'minimize' ? -1 : 1
  for (let i = 0; i < numVariables; i++) {
    const varKey = variableKeys[i]
    const coef = objectiveCoefficients[varKey] || 0
    update(tempTableau, 0, i + 1, -direction * coef)
  }

  let constraintIndex = 0
  for (const [constraintKey, constraint] of Object.entries(model.constraints || {})) {
    const rowIndex = constraintIndex + 1

    update(tempTableau, rowIndex, 1 + numVariables + constraintIndex, 1)

    for (let i = 0; i < numVariables; i++) {
      const varKey = variableKeys[i]
      const variable = (model.variables as Record<string, Record<string, number>>)[varKey] || {}
      const coef = variable[constraintKey] || 0
      update(tempTableau, rowIndex, i + 1, coef)
    }

    if ((constraint as any).equal !== undefined) {
      update(tempTableau, rowIndex, 0, (constraint as any).equal)
    } else {
      const min = (constraint as any).min || -Infinity
      const max = (constraint as any).max || Infinity
      if (isFinite(max)) {
        // <= constraint: use as-is
        update(tempTableau, rowIndex, 0, max)
      } else if (isFinite(min)) {
        // >= constraint: convert to <= by negating
        // x + 2y >= 4 becomes -x - 2y <= -4
        update(tempTableau, rowIndex, 0, -min)
        for (let i = 1; i < width; i++) {
          update(tempTableau, rowIndex, i, -index(tempTableau, rowIndex, i))
        }
      }
    }

    constraintIndex++
  }

  const integerVariables = new Set<number>()
  const binaryVariables = new Set<number>()

  const integers = model.integers
  if (integers === true) {
    for (let i = 0; i < numVariables; i++) integerVariables.add(i)
  } else if (integers instanceof Set || Array.isArray(integers)) {
    for (const key of integers) {
      const idx = variableKeys.indexOf(key as string)
      if (idx >= 0) integerVariables.add(idx)
    }
  }

  const binaries = model.binaries
  if (binaries === true) {
    for (let i = 0; i < numVariables; i++) binaryVariables.add(i)
  } else if (binaries instanceof Set || Array.isArray(binaries)) {
    for (const key of binaries) {
      const idx = variableKeys.indexOf(key as string)
      if (idx >= 0) binaryVariables.add(idx)
    }
  }


  const tableau: Tableau = {
    matrix: tempTableau.matrix,
    width: tempTableau.width,
    height: tempTableau.height,
    positionOfVariable: tempTableau.positionOfVariable,
    variableAtPosition: tempTableau.variableAtPosition,
    variableKeys,
    numVariables,
  }

  return { tableau, integerVariables, binaryVariables }
}
