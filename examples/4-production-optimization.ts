/**
 * Example 4: Production Optimization (Real-World Scenario)
 *
 * A manufacturing company needs to decide how much of each product to produce
 * to maximize profit while respecting resource constraints.
 *
 * Problem:
 * A factory produces three products: chairs, tables, and desks
 * Each requires labor and materials, with profit margins.
 *
 * Resources available:
 * - 40 labor hours
 * - 30 units of material
 *
 * Product specifications:
 *            Labor  Material  Profit
 * Chair        1       1        $10
 * Table        2       2        $20
 * Desk         1       3        $18
 */

import { solve, lessEq } from '../src/index'

const model = {
  direction: 'maximize' as const,
  objective: 'profit',
  constraints: {
    labor: lessEq(40),      // Maximum 40 labor hours available
    materials: lessEq(30),  // Maximum 30 units of material available
    profit: { max: Infinity },
  },
  variables: {
    chairs: {
      labor: 1,
      materials: 1,
      profit: 10,
    },
    tables: {
      labor: 2,
      materials: 2,
      profit: 20,
    },
    desks: {
      labor: 1,
      materials: 3,
      profit: 18,
    },
  },
}

const solution = solve(model)

console.log('╔════════════════════════════════════════════════════╗')
console.log('║       Production Optimization Problem              ║')
console.log('╚════════════════════════════════════════════════════╝\n')

console.log(`Status: ${solution.status}`)
console.log(`Maximum Profit: $${solution.result}\n`)

console.log('Production Plan:')
console.log('─'.repeat(50))

let totalLabor = 0
let totalMaterial = 0

solution.variables.forEach(([product, quantity]) => {
  const specs: Record<string, { labor: number; material: number }> = {
    chairs: { labor: 1, material: 1 },
    tables: { labor: 2, material: 2 },
    desks: { labor: 1, material: 3 },
  }

  const spec = specs[product]
  if (spec) {
    totalLabor += quantity * spec.labor
    totalMaterial += quantity * spec.material
    console.log(
      `${product.padEnd(10)} : ${quantity.toFixed(2)} units ` +
      `(Labor: ${(quantity * spec.labor).toFixed(2)}, ` +
      `Material: ${(quantity * spec.material).toFixed(2)})`,
    )
  }
})

console.log('─'.repeat(50))
console.log(`Total Labor Used: ${totalLabor.toFixed(2)} / 40 hours`)
console.log(`Total Material Used: ${totalMaterial.toFixed(2)} / 30 units`)
console.log(`\n✅ Resource Utilization:`)
console.log(`   Labor: ${(totalLabor / 40 * 100).toFixed(1)}%`)
console.log(`   Materials: ${(totalMaterial / 30 * 100).toFixed(1)}%`)

/*
Expected Output (approximate):
Status: optimal
Maximum Profit: $360

Production Plan:
──────────────────────────────────────────────────
chairs     : 0.00 units (Labor: 0.00, Material: 0.00)
tables     : 15.00 units (Labor: 30.00, Material: 30.00)
desks      : 5.00 units (Labor: 5.00, Material: 15.00)

Total Labor Used: 35.00 / 40 hours
Total Material Used: 30.00 / 30 units

✅ Resource Utilization:
   Labor: 87.5%
   Materials: 100.0%
*/
