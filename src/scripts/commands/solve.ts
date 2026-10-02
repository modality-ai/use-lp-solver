import { z } from "zod";
import type { CLICommand } from "modality-cli-kit";
import { solve as solveModel } from "../../solver";
import type { Model } from "../../types";

const SolveArgsSchema = z.object({
  file: z.string().describe("Path to a JSON file containing the LP model"),
  precision: z.number().optional().describe("Rounding precision (default 1e-8)"),
  includeZeroVariables: z.boolean().optional().describe("Include variables whose value is zero"),
});

type SolveArgs = z.infer<typeof SolveArgsSchema>;

async function solve(args: SolveArgs) {
  const model = (await Bun.file(args.file).json()) as Model;
  const { file: _file, ...options } = args;
  return solveModel(model, options);
}

export const solveCommand: CLICommand = {
  name: "solve",
  aliases: ["s"],
  description: "Solve a linear / mixed-integer program from a JSON model file",
  inputSchema: SolveArgsSchema,
  positionalKeys: ["file"],
  execute: solve,
  examples: ["use-lp-solver solve model.json"],
};
