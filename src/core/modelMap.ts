// Pure logic for the per-user model map: { "speckit.plan": "google/gemini-2.5-pro", ... }
// This is the data shared between the CLI (writer) and the plugin (reader).

import type { SddStep } from "./steps.ts";

export type ModelMap = Record<string, string>;

/** A model id must look like "provider/model" (at least one slash, non-empty sides). */
export function isValidModelId(model: unknown): model is string {
  if (typeof model !== "string") return false;
  const slash = model.indexOf("/");
  return slash > 0 && slash < model.length - 1;
}

/**
 * Build a clean model map from raw assignments, keeping only entries whose key
 * is a known step and whose value is a valid model id. Never throws.
 */
export function buildModelMap(assignments: Record<string, unknown>, steps: readonly SddStep[]): ModelMap {
  const valid = new Set(steps.map((s) => s.key));
  const out: ModelMap = {};
  for (const [key, value] of Object.entries(assignments ?? {})) {
    if (valid.has(key) && isValidModelId(value)) out[key] = value;
  }
  return out;
}

/**
 * Parse raw JSON text into a ModelMap, defensively. Returns {} on any problem
 * (missing file content, invalid JSON, wrong shape, invalid entries).
 */
export function parseModelMap(jsonText: string | null | undefined): ModelMap {
  if (!jsonText || !jsonText.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const out: ModelMap = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (isValidModelId(value)) out[key] = value;
  }
  return out;
}

/** Serialize a model map to pretty JSON with trailing newline. */
export function serializeModelMap(map: ModelMap): string {
  return JSON.stringify(map, null, 2) + "\n";
}

/** Pick the existing assignments for the given steps from a map. */
export function assignmentsForSteps(map: ModelMap, steps: readonly SddStep[]): ModelMap {
  const out: ModelMap = {};
  for (const step of steps) {
    if (map[step.key]) out[step.key] = map[step.key];
  }
  return out;
}
