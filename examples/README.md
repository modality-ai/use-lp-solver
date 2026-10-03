# Linear Programming Solver Examples

This directory contains comprehensive examples demonstrating how to use the use-lp-solver Linear Programming Solver for various optimization problems.

## Quick Start

All examples are written in TypeScript and can be run with Bun:

```bash
bun run examples/1-basic-maximization.ts
bun run examples/2-minimization-problem.ts
bun run examples/3-integer-programming.ts
bun run examples/4-production-optimization.ts
```

## Examples Overview

### 1. Basic Maximization (`1-basic-maximization.ts`)

**Difficulty:** Beginner
**Type:** Linear Programming (LP)

The simplest example: maximize profit subject to resource constraints.

```typescript
// Maximize: 3x + 2y
// Subject to: x + y <= 4, 2x + y <= 7, x,y >= 0
```

**Key Concepts:**
- Setting up the model with direction: 'maximize'
- Defining constraints using `lessEq()`
- Reading the solution with status and variables

**Expected Result:** Maximum profit = 10 (x=2, y=2)

---

### 2. Minimization Problem (`2-minimization-problem.ts`)

**Difficulty:** Beginner
**Type:** Linear Programming (Diet/Cost Minimization)

Classic diet optimization: minimize cost while meeting nutritional requirements.

```typescript
// Minimize: 2x + 3y (cost)
// Subject to: x + 2y >= 4 (protein), x + y >= 3 (calories)
```

**Key Concepts:**
- Using direction: 'minimize'
- Using `greaterEq()` for lower-bound constraints
- Interpreting minimization results

**Expected Result:** Minimum cost = $5 (food A: 1 unit, food B: 1.5 units)

---

### 3. Integer Programming (`3-integer-programming.ts`)

**Difficulty:** Intermediate
**Type:** Integer Linear Programming (ILP)

Solve problems where variables must be whole numbers (e.g., number of items to buy).

```typescript
// Maximize: 5x + 4y
// Subject to: 2x + 3y <= 10
// x, y must be integers
```

**Key Concepts:**
- Using the `integers: true` option for all variables
- Using `integers: new Set(['itemA', 'itemC'])` for specific variables
- Integer optimization uses branch-and-cut algorithm internally

**Expected Result:** Maximum profit = 13 (2 items of A, 2 items of B)

---

### 4. Production Optimization (`4-production-optimization.ts`)

**Difficulty:** Advanced
**Type:** Multi-variable Linear Programming (Real-world scenario)

A realistic manufacturing problem: decide production quantities for multiple products given labor and material constraints.

```typescript
// Maximize: 10*chairs + 20*tables + 18*desks
// Subject to:
//   1*chairs + 2*tables + 1*desks <= 40 (labor hours)
//   1*chairs + 2*tables + 3*desks <= 30 (material units)
```

**Key Concepts:**
- Working with multiple variables and constraints
- Interpreting resource utilization
- Practical optimization for business decisions

**Expected Result:** Maximum profit = $360+ with optimal production mix

---

## API Reference

### `solve(model, options?)`

Main function to solve an LP/ILP problem.

```typescript
import { solve, lessEq, greaterEq, equalTo, inRange } from 'use-lp-solver'

const solution = solve(model, {
  precision: 1e-8,        // Numerical precision (default: 1e-8)
  checkCycles: false,     // Detect simplex cycling (default: false)
  maxPivots: 8192,        // Max iterations for simplex (default: 8192)
  tolerance: 0,           // Integer tolerance (default: 0)
  timeout: Infinity,      // Timeout in ms for integer problems
  maxIterations: 32768,   // Max B&C iterations (default: 32768)
  includeZeroVariables: false, // Include 0-valued variables in result
})
```

### Constraint Builders

```typescript
// Less than or equal to
lessEq(value)          // { max: value }

// Greater than or equal to
greaterEq(value)       // { min: value }

// Exactly equal to
equalTo(value)         // { equal: value }

// Between two values
inRange(lower, upper)  // { min: lower, max: upper }
```

### Model Structure

```typescript
type Model = {
  direction?: 'maximize' | 'minimize'  // Default: 'maximize'
  objective?: string                   // Key of variable for objective
  constraints: Record<string, Constraint>
  variables: Record<string, Record<string, number>>
  integers?: boolean | Set<string>     // Mark variables as integers
  binaries?: boolean | Set<string>     // Mark variables as binary (0 or 1)
}
```

### Solution Structure

```typescript
type Solution = {
  status: 'optimal' | 'infeasible' | 'unbounded' | 'timedout' | 'cycled'
  result: Record<string, number>        // Objective value keyed by the model objective name, e.g. { profit: 25 }
  variables: Array<[name: string, value: number]>  // Variable assignments
}
```

Read the objective value through its key — it is the model's `objective` name:

```typescript
solve({ objective: 'profit', /* ... */ }).result.profit
```

When the model omits `objective`, the key falls back to `objective`, so the
value is `result.objective`. Note that the value is `NaN` whenever `status` is
not `optimal` — check `status` before reading it.

---

## Common Patterns

### 1. Basic LP with All Constraints

```typescript
const model = {
  direction: 'maximize',
  objective: 'profit',
  constraints: {
    constraint1: lessEq(100),
    constraint2: greaterEq(50),
    constraint3: equalTo(25),
    profit: { max: Infinity },
  },
  variables: {
    x: { constraint1: 1, constraint2: 2, constraint3: 1, profit: 5 },
    y: { constraint1: 2, constraint2: 1, constraint3: 1, profit: 3 },
  },
}
```

### 2. Integer Programming with Mixed Variables

```typescript
const model = {
  direction: 'maximize',
  objective: 'value',
  constraints: { /* ... */ },
  variables: { /* ... */ },
  integers: new Set(['x', 'y']),      // Only x and y are integers
  binaries: new Set(['isSelected']),   // Only isSelected is binary (0 or 1)
}
```

### 3. Checking Solution Validity

```typescript
const solution = solve(model)

if (solution.status === 'optimal') {
  console.log('Found optimal solution:', solution.result.profit)
} else if (solution.status === 'infeasible') {
  console.log('No feasible solution exists')
} else if (solution.status === 'unbounded') {
  console.log('Objective is unbounded')
}
```

### 4. Large Problem with Custom Options

```typescript
const solution = solve(model, {
  precision: 1e-6,      // Higher precision
  maxPivots: 20000,     // More iterations
  timeout: 5000,        // 5 second timeout
  maxIterations: 100000, // More B&C iterations
})
```

---

## Tips & Tricks

### 1. **Normalize Your Model**
Always make sure all variable coefficients are in the `variables` section, and constraint bounds are on the `constraints` side.

### 2. **Use Meaningful Names**
Instead of `x`, `y`, use `production`, `inventory`, etc. for clarity.

### 3. **Handle Edge Cases**
Always check the solution status before accessing the result:
```typescript
if (solution.status !== 'optimal') {
  console.warn(`Solver returned: ${solution.status}`)
}
```

### 4. **Verify Constraints**
Manually verify that your constraints are satisfied in the solution:
```typescript
solution.variables.forEach(([name, value]) => {
  // Check that value satisfies your bounds
})
```

### 5. **For Integer Problems**
Integer programming is NP-hard. For large problems:
- Start with a smaller instance to verify correctness
- Use `tolerance` option to accept near-optimal solutions
- Set reasonable `timeout` and `maxIterations` limits

---

## Troubleshooting

### "Infeasible" Status
- Check that constraints are logically consistent
- Make sure you don't have conflicting upper and lower bounds
- Verify objective is properly defined

### "Unbounded" Status
- Check that your model has proper upper/lower bounds
- Ensure all variables have non-negativity constraints implicitly or explicitly

### "Cycled" Status
- The simplex algorithm detected cycling (very rare)
- Try enabling `checkCycles: true` in options
- Increase `maxPivots` limit

### Solution Looks Wrong
- Verify the model structure matches the mathematical formulation
- Double-check coefficient values in `variables`
- Ensure constraints are in the correct form (<=, >=, =)

---

## Further Reading

For more information about linear programming concepts:
- [Wikipedia: Linear Programming](https://en.wikipedia.org/wiki/Linear_programming)
- [Simplex Method](https://en.wikipedia.org/wiki/Simplex_algorithm)
- [Integer Programming](https://en.wikipedia.org/wiki/Integer_programming)
