import { describe, it, expect } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { solveCommand } from '../solve'

const run = async (model: object) => {
  const file = join(tmpdir(), `lp-${Math.random().toString(36).slice(2)}.json`)
  await Bun.write(file, JSON.stringify(model))
  return (solveCommand.execute as any)({ file })
}

describe('solveCommand', () => {
  it('is named solve with alias s', () => {
    expect([solveCommand.name, solveCommand.aliases]).toEqual(['solve', ['s']])
  })
  it('solves a model from a JSON file', async () => {
    const result = await run({
      direction: 'maximize',
      objective: 'p',
      constraints: { c: { max: 4 } },
      variables: { x: { p: 3, c: 2 } },
    })
    expect(Object.values(result.result)[0]).toBe(6)
  })
})
