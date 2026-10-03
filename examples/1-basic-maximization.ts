/**
 * Example 1: Basic Maximization Problem
 *
 * A simple linear programming problem to maximize profit.
 *
 * Problem:
 * Maximize: 3x + 2y
 * Subject to:
 *   x + y <= 4      (Resource constraint 1)
 *   2x + y <= 7     (Resource constraint 2)
 *   x, y >= 0
 */

import { solve, lessEq } from '../src/index'

const model = {
  direction: 'maximize' as const,
  objective: 'profit',
  constraints: {
    resource1: lessEq(4),
    resource2: lessEq(7),
    profit: { max: Infinity },
  },
  variables: {
    x: {
      resource1: 1,
      resource2: 2,
      profit: 3, // Coefficient in objective function
    },
    y: {
      resource1: 1,
      resource2: 1,
      profit: 2, // Coefficient in objective function
    },
  },
}

const solution = solve(model)

console.log('=== Basic Maximization Problem ===\n')
console.log(`Status: ${solution.status}`)
console.log(`Maximum Profit: ${solution.result.profit}`)
console.log('\nOptimal Solution:')
solution.variables.forEach(([variable, value]) => {
  console.log(`  ${variable} = ${value}`)
})

/*
Expected Output:
Status: optimal
Maximum Profit: 11
Optimal Solution:
  x = 3
  y = 1
*/
