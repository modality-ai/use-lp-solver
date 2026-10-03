# `use-lp-solver`

> A linear and mixed-integer programming (LP/MILP) solver for TypeScript, with a JSON-driven CLI.

Build a model describing what to optimize and the limits you face, then call `solve`. Continuous problems use the simplex method. Problems with integer or binary variables use branch-and-cut.

## Repository

-   `GIT`
    -   https://github.com/modality-ai/use-lp-solver
-   `NPM`
    -   https://www.npmjs.com/package/use-lp-solver

## Install

```bash
bun add use-lp-solver
# or
npm install use-lp-solver
```

## Usage

### Library

```typescript
import { solve, lessEq } from 'use-lp-solver'

const solution = solve({
    direction: 'maximize',
    objective: 'profit',
    constraints: {
        budget: lessEq(10),
    },
    variables: {
        itemA: { profit: 5, budget: 2 },
        itemB: { profit: 4, budget: 3 },
    },
    integers: true,
})

if (solution.status === 'optimal') {
    console.log(solution.result.profit) // 13
    console.log(solution.variables) // [['itemA', 2], ['itemB', 2]]
}
```

The objective value is read through the model's `objective` name (`result.profit` above). If the model omits `objective`, the key is `objective`. The value is `NaN` unless `status` is `optimal`, so check `status` first.

### CLI

Pipe a JSON model through stdin, or pass a file path:

```bash
echo '{"direction":"maximize","objective":"profit","constraints":{"budget":{"max":10}},"variables":{"itemA":{"profit":5,"budget":2},"itemB":{"profit":4,"budget":3}},"integers":true}' | use-lp-solver solve

use-lp-solver solve model.json
```

| Option                    | Description                                   |
| ------------------------- | --------------------------------------------- |
| `--precision <n>`         | Numerical precision (default `1e-8`)          |
| `--include-zero-variables`| Include zero-valued variables in the output   |

`s` is an alias for `solve`.

## Model

```typescript
type Model = {
    direction?: 'maximize' | 'minimize' // default: 'maximize'
    objective?: string // coefficient key to optimize
    constraints: Record<string, Constraint>
    variables: Record<string, Record<string, number>>
    integers?: boolean | Set<string> // whole-number variables
    binaries?: boolean | Set<string> // 0/1 variables
}
```

All variables are implicitly `>= 0`.

### `direction`

Optional. `'maximize'` (default) or `'minimize'`.

```typescript
{ direction: 'minimize' } // lowest cost wins
```

### `objective`

Optional. The name of the coefficient key that each variable carries as its goal value. The solution reports the optimum under this same name. If omitted, the key is `objective`.

```typescript
{
    objective: 'profit',
    variables: { chair: { profit: 10 }, table: { profit: 20 } },
}
// solution.result.profit
```

### `constraints`

Required. A map of limit name to bounds. Each bound is one of:

| Form                 | Meaning           | Helper          |
| -------------------- | ----------------- | --------------- |
| `{ max: 10 }`        | value `<= 10`     | `lessEq(10)`    |
| `{ min: 4 }`         | value `>= 4`      | `greaterEq(4)`  |
| `{ equal: 7 }`       | value `= 7`       | `equalTo(7)`    |
| `{ min: 2, max: 8 }` | `2 <= value <= 8` | `inRange(2, 8)` |

```typescript
{
    constraints: {
        labor: lessEq(40), // at most 40 hours
        protein: greaterEq(4), // at least 4 units
        total: equalTo(100), // exactly 100
        temperature: inRange(20, 25), // between 20 and 25
    },
}
```

### `variables`

Required. A map of decision name to its coefficients. Each coefficient key is either a constraint name (how much of that limit one unit of the variable uses) or the `objective` key (its goal value). Omitted coefficients are `0`.

```typescript
{
    objective: 'profit',
    constraints: { labor: lessEq(40), material: lessEq(30) },
    variables: {
        chair: { profit: 10, labor: 1, material: 1 }, // uses 1 labor, 1 material
        table: { profit: 20, labor: 2, material: 2 },
        desk: { profit: 18, labor: 1, material: 3 },
    },
}
```

### `integers`

Optional. Forces variables to whole numbers. `true` applies to all variables. A `Set<string>` of names (an array in CLI JSON) applies to only those.

```typescript
{ integers: true } // every variable is whole
{ integers: new Set(['chair', 'table']) } // only these
```

### `binaries`

Optional. Limits item variables to 0 or 1, for yes/no decisions.

```typescript
{ binaries: true } // every variable is 0 or 1
{ binaries: new Set(['openStore']) } // only this one
```

JSON examples for the CLI:

-   [`examples/model-binaries.json`](./examples/model-binaries.json): pick each item or not (`binaries: true`).
-   [`examples/model-min-one.json`](./examples/model-min-one.json): choose every item at least once (`integers: true` plus a `min: 1` constraint per item).

```bash
use-lp-solver solve examples/model-binaries.json
use-lp-solver solve examples/model-min-one.json
```

### Full example with every parameter

```typescript
solve({
    direction: 'maximize',
    objective: 'profit',
    constraints: {
        budget: lessEq(100),
        minUnits: greaterEq(2),
    },
    variables: {
        widget: { profit: 8, budget: 10, minUnits: 1 },
        gadget: { profit: 5, budget: 6, minUnits: 1 },
        openStore: { profit: -20, budget: 30 },
    },
    integers: new Set(['widget', 'gadget']),
    binaries: new Set(['openStore']),
})
```

In CLI JSON, use arrays instead of sets: `"integers": ["widget", "gadget"]`.

### Constraint helpers

| Helper                | Result                       |
| --------------------- | ---------------------------- |
| `lessEq(n)`           | `{ max: n }`                 |
| `greaterEq(n)`        | `{ min: n }`                 |
| `equalTo(n)`          | `{ equal: n }`               |
| `inRange(lo, hi)`     | `{ min: lo, max: hi }`       |

## Solution

```typescript
type Solution = {
    status: 'optimal' | 'infeasible' | 'unbounded' | 'timedout' | 'cycled'
    result: Record<string, number> // e.g. { profit: 25 }
    variables: Array<[name: string, value: number]>
}
```

## Options

```typescript
solve(model, {
    precision: 1e-8, // numerical precision
    checkCycles: false, // detect simplex cycling
    maxPivots: 8192, // max simplex iterations
    tolerance: 0, // integer tolerance
    timeout: Infinity, // ms, for integer problems
    maxIterations: 32768, // max branch-and-cut iterations
    includeZeroVariables: false, // include zero-valued variables
})
```

## Examples

Runnable examples live in [`examples/`](./examples/README.md):

```bash
bun run examples/1-basic-maximization.ts
bun run examples/2-minimization-problem.ts
bun run examples/3-integer-programming.ts
bun run examples/4-production-optimization.ts
```

## Development

```bash
bun install
bun run build   # generate commands, build types and CLI
bun run test    # build, then run the test suite
```
