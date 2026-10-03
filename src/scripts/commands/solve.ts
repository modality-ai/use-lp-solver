import { z } from "zod";
import type { CLICommand } from "modality-cli-kit";
import { solve as solveModel } from "../../lib/solver";
import type { Model } from "../../lib/types";

const SolveArgsSchema = z.object({
  file: z.string().optional().describe("Path to a JSON model file; omit to read from stdin"),
  precision: z.coerce.number().optional().describe("Rounding precision (default 1e-8)"),
  includeZeroVariables: z.boolean().optional().describe("Include variables whose value is zero"),
});

type SolveArgs = z.infer<typeof SolveArgsSchema>;

async function solve(args: SolveArgs) {
  const { file, ...options } = args;
  const model = (file && file !== "-" ? await Bun.file(file).json() : await Bun.stdin.json()) as Model;
  return solveModel(model, options);
}

export const solveCommand: CLICommand = {
  name: "solve",
  aliases: ["s"],
  description: "Solve a linear / mixed-integer program from a JSON model file or stdin",
  inputSchema: SolveArgsSchema,
  positionalKeys: ["file"],
  execute: solve,
  examples: ["use-lp-solver solve model.json", "cat model.json | use-lp-solver solve"],
};
