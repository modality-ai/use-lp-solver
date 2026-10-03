import type { Model, Options, SolutionStatus } from './types'
import { relax } from './relaxation'
import { isInteger } from './util'

type Bound = { key: string; kind: 'max' | 'min'; value: number }

export type IntegerResult = {
  status: SolutionStatus
  value: number
  keys: string[]
  values: number[]
}

/** Add one branching bound as an extra single-variable constraint. */
const withBounds = (model: Model, bounds: Bound[]): Model => {
  const constraints: Record<string, object> = { ...(model.constraints as Record<string, object>) }
  const variables: Record<string, Record<string, number>> = {}
  for (const [key, coefficients] of Object.entries(model.variables as Record<string, Record<string, number>>)) {
    variables[key] = { ...coefficients }
  }
  bounds.forEach((bound, i) => {
    const name = `__bound${i}`
    constraints[name] = { [bound.kind]: bound.value }
    variables[bound.key] = { ...variables[bound.key], [name]: 1 }
  })
  return { ...model, constraints, variables } as Model
}

/**
 * Depth-first branch and bound. Every node is a fresh LP relaxation of the model plus
 * the branching bounds; the most fractional integer variable is split into floor/ceil.
 */
export const branchAndCut = (
  model: Model,
  options: Required<Options>,
  integerKeys: Set<string>,
  binaryKeys: Set<string>,
): IntegerResult => {
  const { timeout, maxIterations, tolerance, precision } = options
  const stopTime = Date.now() + timeout
  const integers = new Set([...integerKeys, ...binaryKeys])

  const rootBounds: Bound[] = [...binaryKeys].map((key) => ({ key, kind: 'max', value: 1 }))
  const stack: Bound[][] = [rootBounds]

  let best: IntegerResult | null = null
  let iterations = 0
  let rootStatus: SolutionStatus = 'infeasible'

  while (stack.length > 0) {
    if (iterations++ >= maxIterations || Date.now() >= stopTime) {
      return best ?? { status: 'timedout', value: NaN, keys: [], values: [] }
    }

    const bounds = stack.pop()!
    const node = relax(withBounds(model, bounds), options)

    if (iterations === 1) rootStatus = node.status
    if (node.status !== 'optimal') continue
    if (best && node.value <= best.value * (1 - tolerance) + precision) continue

    let branchIndex = -1
    let maxFraction = 0
    node.values.forEach((value, i) => {
      if (!integers.has(node.keys[i]!) || isInteger(value, precision)) return
      const fraction = Math.abs(value - Math.round(value))
      if (fraction > maxFraction) {
        maxFraction = fraction
        branchIndex = i
      }
    })

    if (branchIndex < 0) {
      best = { status: 'optimal', value: node.value, keys: node.keys, values: node.values }
      continue
    }

    const key = node.keys[branchIndex]!
    const value = node.values[branchIndex]!
    stack.push([...bounds, { key, kind: 'min', value: Math.ceil(value) }])
    stack.push([...bounds, { key, kind: 'max', value: Math.floor(value) }])
  }

  if (best) return best
  const status = rootStatus === 'optimal' ? 'infeasible' : rootStatus
  return { status, value: NaN, keys: [], values: [] }
}
