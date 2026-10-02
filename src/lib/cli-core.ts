import { z } from "zod";
import { createCliRunner } from "modality-cli-kit";
import { aiTool } from "../scripts";
import { registry, CLI_NAME, TAGLINE } from "../scripts/registry";

/**
 * The use-lp-solver CLI. All the generic machinery (help, alias resolution, arg
 * validation, dispatch) lives in `modality-cli-kit`; this file only supplies
 * the app-specific config. Passing `aiTool` routes command dispatch through the
 * same counter-script entry point the MCP server uses, and makes an empty
 * invocation defer to it (no-command → help text) automatically.
 */
export const cli = createCliRunner({
  cliName: CLI_NAME,
  tagline: TAGLINE,
  registry,
  aiTool,
  globalOptionsSchema: z.object({
    help: z.boolean().optional().describe("Show this help message"),
    json: z.boolean().optional().describe("Output in JSON format"),
  }),
});

export const runCli = cli.run;
