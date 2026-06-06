// Pure evaluation of system pre-flight checks.

export interface CheckFacts {
  hasOpencode: boolean;
  hasSpecify: boolean;
  modelCount: number;
  pluginInstalled: boolean;
}

export interface CheckItem {
  id: string;
  label: string;
  ok: boolean;
  fix: string;
  warning?: boolean;
}

export interface ChecksResult {
  checks: CheckItem[];
  allOk: boolean;
}

/**
 * Evaluate pre-flight checks from raw facts.
 * A `warning` check never blocks setup (it's auto-handled). `allOk` is true
 * when there are no blocking (non-warning) failures.
 */
export function evaluateChecks({ hasOpencode, hasSpecify, modelCount, pluginInstalled }: CheckFacts): ChecksResult {
  const checks: CheckItem[] = [
    {
      id: "opencode",
      label: "opencode installed",
      ok: !!hasOpencode,
      fix: "Install from https://opencode.ai",
    },
    {
      id: "specify",
      label: "specify (spec-kit) installed",
      ok: !!hasSpecify,
      fix: "uv tool install specify-cli   OR   pip install specify-cli",
    },
    {
      id: "models",
      label: hasOpencode
        ? `opencode providers configured (${modelCount} models)`
        : "opencode providers configured",
      ok: !!hasOpencode && modelCount > 0,
      fix: hasOpencode
        ? "Run: opencode auth  — and add at least one provider"
        : "Install opencode first",
    },
    {
      id: "plugin",
      label: "speckit-model-router plugin installed",
      ok: !!pluginInstalled,
      fix: "Will be installed automatically during setup",
      warning: true,
    },
  ];

  const blockers = checks.filter((c) => !c.ok && !c.warning);
  return { checks, allOk: blockers.length === 0 };
}
