// Pure helpers for working with the model list. No side-effects.

export interface ModelPage {
  start: number;
  end: number;
}

export interface SplitModel {
  provider: string;
  name: string;
}

/** Parse the raw stdout of `opencode models` into a clean list. */
export function parseModelsOutput(stdout: string | null | undefined): string[] {
  if (!stdout) return [];
  return stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Case-insensitive substring filter. Empty query returns the full list. */
export function filterModels(models: string[], query: string): string[] {
  if (!query || !query.trim()) return models;
  const q = query.toLowerCase();
  return models.filter((m) => m.toLowerCase().includes(q));
}

/** Visible window [start, end) keeping the cursor roughly centered. */
export function computePage(cursor: number, total: number, pageSize: number): ModelPage {
  if (total <= 0 || pageSize <= 0) return { start: 0, end: 0 };
  const start = Math.max(0, Math.min(cursor - Math.floor(pageSize / 2), total - pageSize));
  const end = Math.min(start + pageSize, total);
  return { start, end };
}

/** Split "anthropic/claude-opus-4" → { provider, name }. Keeps nested slashes in name. */
export function splitModelId(model: string): SplitModel {
  const slash = model.indexOf("/");
  if (slash === -1) return { provider: "", name: model };
  return { provider: model.slice(0, slash), name: model.slice(slash + 1) };
}

/** Clamp a cursor index into [0, max]. */
export function clampCursor(cursor: number, max: number): number {
  if (max < 0) return 0;
  return Math.max(0, Math.min(cursor, max));
}
