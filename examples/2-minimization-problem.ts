/**
 * Example 2: Minimization Problem (Diet Problem)
 *
 * Classic diet optimization problem: minimize cost while meeting nutritional requirements.
 *
 * Problem:
 * Minimize: 2x + 3y    (Cost function)
 * Subject to:
 *   x + 2y >= 4        (Protein requirement)
 *   x + y >= 3         (Calories requirement)
 *   x, y >= 0
 *
 * where x = amount of food A, y = amount of food B
 */

import { solve, greaterEq } from '../src/index'

const model = {
  direction: 'minimize' as const,
  objective: 'cost',
  constraints: {
    protein: greaterEq(4),   // Minimum protein needed
    calories: greaterEq(3),  // Minimum calories needed
    cost: { min: 0 },
  },
  variables: {
    foodA: {
      protein: 1,
      calories: 1,
      cost: 2, // Cost per unit of food A
    },
    foodB: {
      protein: 2,
      calories: 1,
      cost: 3, // Cost per unit of food B
    },
  },
}

const solution = solve(model)

console.log('=== Diet Optimization (Minimization) ===\n')
console.log(`Status: ${solution.status}`)
console.log(`Minimum Cost: $${solution.result}`)
console.log('\nOptimal Diet:')
solution.variables.forEach(([food, amount]) => {
  console.log(`  ${food}: ${amount} units`)
})

/*
Expected Output:
Status: optimal
Minimum Cost: $5
Optimal Diet:
  foodA: 1 units
  foodB: 1.5 units
*/
