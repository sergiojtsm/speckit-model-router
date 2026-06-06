// speckit-model-router — opencode plugin (self-contained, no runtime imports
// beyond node builtins; the `import type` below is erased at runtime).
//
// On every spec-kit command (`/speckit.*`), if the user has assigned a model
// for that step in ~/.config/opencode/speckit-models.json, the command is
// re-dispatched on that model and the original is suppressed. This keeps the
// override perfectly scoped to the step — normal chat keeps its own model, and
// nothing in the session/global config is mutated.
//
// Verified mechanism (spike): command.execute.before fires with the command
// name; client.session.command({ body: { command, arguments, model } }) honours
// a "provider/model" string and runs the command on that model.

import type { Plugin } from "@opencode-ai/plugin";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const MODELS_FILE = join(homedir(), ".config", "opencode", "speckit-models.json");

// Suppression of the original command after re-dispatch:
//   "throw"  → no extra LLM call (cleanest execution); may surface a transient error toast.
//   "empty"  → no error toast; the original makes one cheap empty turn.
const SUPPRESS: "throw" | "empty" = "throw";

function readModelFor(command: string): string | null {
  let raw: string;
  try {
    raw = readFileSync(MODELS_FILE, "utf8");
  } catch {
    return null; // no config yet
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const value = (parsed as Record<string, unknown>)[command];
  if (typeof value !== "string") return null;
  const slash = value.indexOf("/");
  if (slash <= 0 || slash >= value.length - 1) return null; // must be "provider/model"
  return value;
}

export const SpeckitModelRouter: Plugin = async ({ client }) => {
  // Guards re-dispatched commands so they pass through untouched (no recursion).
  const inFlight = new Set<string>();

  return {
    "command.execute.before": async (input: any, output: any) => {
      const command: string = input?.command ?? "";
      if (!command.startsWith("speckit.")) return;

      const guardKey = `${input.sessionID}::${command}`;
      if (inFlight.has(guardKey)) {
        inFlight.delete(guardKey);
        return; // this is our own re-dispatch → let it run on the chosen model
      }

      const model = readModelFor(command);
      if (!model) return; // no per-step override configured → native behaviour

      inFlight.add(guardKey);
      try {
        await client.session.command({
          path: { id: input.sessionID },
          body: {
            command,
            arguments: input.arguments ?? "",
            model,
          },
        });
      } catch {
        inFlight.delete(guardKey);
        return; // re-dispatch failed → fall back to letting the original run
      }

      // Suppress the original so the step doesn't also run on the default model.
      if (SUPPRESS === "throw") {
        throw new Error(`[speckit-model-router] ${command} re-dispatched on ${model}`);
      } else {
        if (Array.isArray(output?.parts)) output.parts.length = 0;
      }
    },
  };
};

export default SpeckitModelRouter;
