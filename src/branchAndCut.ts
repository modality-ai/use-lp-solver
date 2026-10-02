import type { Options, Tableau, SolutionStatus } from './types'
import { index, update } from './tableau'
import { phase1 } from './simplex'
import { isInteger } from './util'

class Heap<T> {
  private items: T[] = []

  constructor(private comparator: (a: T, b: T) => number) {}

  push(item: T): void {
    this.items.push(item)
    this._bubbleUp(this.items.length - 1)
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined
    if (this.items.length === 1) return this.items.pop()

    const root = this.items[0]
    this.items[0] = this.items.pop()!
    this._bubbleDown(0)
    return root
  }

  private _bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2)
      if (this.comparator(this.items[index], this.items[parentIdx]) >= 0) break
      ;[this.items[index], this.items[parentIdx]] = [this.items[parentIdx], this.items[index]]
      index = parentIdx
    }
  }

  private _bubbleDown(index: number): void {
    while (true) {
      let smallest = index
      const leftIdx = 2 * index + 1
      const rightIdx = 2 * index + 2

      if (leftIdx < this.items.length && this.comparator(this.items[leftIdx], this.items[smallest]) < 0) {
        smallest = leftIdx
      }
      if (rightIdx < this.items.length && this.comparator(this.items[rightIdx], this.items[smallest]) < 0) {
        smallest = rightIdx
      }
      if (smallest === index) break

      ;[this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]]
      index = smallest
    }
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }
}

export const branchAndCut = (
  tableau: Tableau,
  options: Required<Options>,
  integerVariables: Set<number>,
  binaryVariables: Set<number>,
): [Tableau, SolutionStatus, number] => {
  const { timeout, maxIterations, tolerance, precision } = options
  const stopTime = Date.now() + timeout
  const integers = new Set([...integerVariables, ...binaryVariables])

  const [initStatus, initValue] = phase1(tableau, options)
  if (initStatus !== 'optimal') {
    return [tableau, initStatus, NaN]
  }

  let bestValue = NaN
  let bestSolution: Tableau | null = null
  let bestTableau: Tableau | null = null
  const branches = new Heap<[number, Array<[number, number, number]>]>((a, b) => a[0] - b[0])

  branches.push([initValue, []])

  let iterations = 0

  while (!branches.isEmpty() && iterations < maxIterations) {
    iterations++

    if (Date.now() >= stopTime) {
      return [bestTableau || tableau, 'timedout', bestValue]
    }

    const [relaxedBound, cuts] = branches.pop()!

    if (!isNaN(bestValue) && relaxedBound <= bestValue * (1 - tolerance)) {
      continue
    }

    const childTableau = JSON.parse(JSON.stringify({
      matrix: Array.from(tableau.matrix),
      width: tableau.width,
      height: tableau.height,
      positionOfVariable: Array.from(tableau.positionOfVariable),
      variableAtPosition: Array.from(tableau.variableAtPosition),
      variableKeys: tableau.variableKeys,
      numVariables: tableau.numVariables,
    })) as Tableau
    childTableau.matrix = new Float64Array(childTableau.matrix as any)
    childTableau.positionOfVariable = new Int32Array(childTableau.positionOfVariable as any)
    childTableau.variableAtPosition = new Int32Array(childTableau.variableAtPosition as any)

    for (const [sign, variable, value] of cuts) {
      const position = childTableau.positionOfVariable[variable]
      for (let c = 0; c < childTableau.width; c++) {
        const idx = Math.imul(childTableau.height, childTableau.width) + c
        if (c === 0) childTableau.matrix[idx] = value
        else if (c === position) childTableau.matrix[idx] = sign
        else childTableau.matrix[idx] = 0
      }
      childTableau.height++
    }

    const [status, value] = phase1(childTableau, options)

    if (status === 'optimal') {
      let isIntegerFeasible = true
      let mostFractionalVar = -1
      let maxFractional = 0

      for (const varIdx of integers) {
        const pos = childTableau.positionOfVariable[varIdx]
        const varValue = index(childTableau, Math.floor(pos / childTableau.width), pos % childTableau.width)
        if (!isInteger(varValue, precision)) {
          isIntegerFeasible = false
          const frac = Math.abs(varValue - Math.round(varValue))
          if (frac > maxFractional) {
            maxFractional = frac
            mostFractionalVar = varIdx
          }
        }
      }

      if (isIntegerFeasible) {
        if (isNaN(bestValue) || value > bestValue) {
          bestValue = value
          bestSolution = childTableau
          bestTableau = childTableau
        }
      } else if (!isNaN(bestValue) && value <= bestValue) {
        continue
      } else if (mostFractionalVar >= 0) {
        const pos = childTableau.positionOfVariable[mostFractionalVar]
        const varValue = index(childTableau, Math.floor(pos / childTableau.width), pos % childTableau.width)
        const floorVal = Math.floor(varValue)
        const ceilVal = Math.ceil(varValue)

        branches.push([value, [...cuts, [1, mostFractionalVar, floorVal]]])
        branches.push([value, [...cuts, [-1, mostFractionalVar, -ceilVal]]])
      }
    }
  }

  const finalStatus: SolutionStatus = isNaN(bestValue) ? 'infeasible' : iterations >= maxIterations ? 'timedout' : 'optimal'
  return [bestTableau || tableau, finalStatus, bestValue]
}
