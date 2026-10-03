/**
 * Example 3: Integer Programming Problem (Knapsack-like)
 *
 * Maximize profit when items must be bought in whole units.
 *
 * Problem:
 * Maximize: 5x + 4y
 * Subject to:
 *   2x + 3y <= 10      (Budget/weight constraint)
 *   x, y >= 0 and INTEGER (must be whole units)
 *
 * where x = quantity of item A, y = quantity of item B
 */

import { solve, lessEq } from '../src/index'

const model = {
  direction: 'maximize' as const,
  objective: 'profit',
  constraints: {
    budget: lessEq(10),
    profit: { max: Infinity },
  },
  variables: {
    itemA: {
      budget: 2,
      profit: 5, // Profit per item A
    },
    itemB: {
      budget: 3,
      profit: 4, // Profit per item B
    },
  },
  // Mark variables as integers
  integers: true, // All variables must be integers
}

const solution = solve(model)

console.log('=== Integer Programming (Knapsack) ===\n')
console.log(`Status: ${solution.status}`)
console.log(`Maximum Profit: ${solution.result}`)
console.log('\nOptimal Purchase:')
solution.variables.forEach(([item, quantity]) => {
  console.log(`  ${item}: ${quantity} units`)
})

const totalBudget = solution.variables.reduce((sum, [_, qty]) => {
  const costs: Record<string, number> = { itemA: 2, itemB: 3 }
  return sum + qty * (costs[_] || 0)
}, 0)

console.log(`\nTotal Budget Used: ${totalBudget}/10`)

/*
Expected Output:
Status: optimal
Maximum Profit: 13
Optimal Purchase:
  itemA: 2 units
  itemB: 2 units

Total Budget Used: 10/10
*/
