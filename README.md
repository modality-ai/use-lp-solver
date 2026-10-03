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

-   `variables`: each decision is a key, mapped to its coefficients per constraint plus its value under the `objective` key. Omitted coefficients are `0`.
-   `constraints`: each limit is a key with `{ max }`, `{ min }`, `{ equal }`, or `{ min, max }`.
-   All variables are implicitly `>= 0`.

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
