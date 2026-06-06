// Orchestration / imperative shell. Wires core logic to adapters and UI.

import pc from "picocolors";

import { SDD_STEPS } from "../core/steps.ts";
import { evaluateChecks } from "../core/checks.ts";
import { buildModelMap, assignmentsForSteps } from "../core/modelMap.ts";

import { checkTool, getOpencodeModels } from "./adapters/opencode.ts";
import { readModelMap, writeModelMap } from "./adapters/modelsStore.ts";
import { isPluginInstalled, isPluginUpToDate, installPlugin } from "./adapters/pluginInstaller.ts";
import { MODELS_FILE } from "./adapters/paths.ts";

import { clear, writeln, runWithSpinner } from "./ui/terminal.ts";
import { renderChecksSection } from "./ui/checks-view.ts";
import { runAssignmentScreen } from "./ui/assignment-screen.ts";

export async function run(): Promise<void> {
  clear();
  writeln();
  writeln(`  ${pc.bold("speckit")} ${pc.cyan("model router")}`);
  writeln();

  // ── 1. Pre-flight checks ───────────────────────────────────────────────
  const hasOpencode = checkTool("opencode");
  const hasSpecify = checkTool("specify");
  const models = hasOpencode ? getOpencodeModels() : [];
  const pluginInstalled = isPluginInstalled();

  const { checks, allOk } = evaluateChecks({
    hasOpencode,
    hasSpecify,
    modelCount: models.length,
    pluginInstalled,
  });

  renderChecksSection({ checks, allOk });

  if (!allOk) {
    writeln(pc.red("  Fix the issues above and run again.\n"));
    process.exit(1);
  }

  writeln();

  // ── 2. Install / update the plugin ─────────────────────────────────────
  const freshInstall = !pluginInstalled;
  if (!isPluginUpToDate()) {
    const { ok, error } = runWithSpinner("Installing speckit-model-router plugin globally", () =>
      installPlugin(),
    );
    if (!ok) {
      writeln(pc.red(`  Error: ${error?.message}`));
      process.exit(1);
    }
  } else {
    writeln(`${pc.green("✓")} plugin already installed and up to date`);
  }

  writeln();

  // ── 3. Existing assignments ────────────────────────────────────────────
  const existingAssignments = assignmentsForSteps(readModelMap(), SDD_STEPS);

  // ── 4. Interactive assignment ──────────────────────────────────────────
  writeln(pc.dim("  Press Enter on any row to pick a model. S to save.\n"));
  await new Promise((r) => setTimeout(r, 600));

  const finalAssignments = await runAssignmentScreen({
    models,
    steps: SDD_STEPS,
    existingAssignments,
  });

  // ── 5. Save & summary ──────────────────────────────────────────────────
  clear();
  writeln();

  if (!finalAssignments) {
    writeln(`  ${pc.yellow("Cancelled.")} No changes saved.\n`);
    process.exit(0);
  }

  const map = buildModelMap(finalAssignments, SDD_STEPS);
  writeModelMap(map);

  writeln(`  ${pc.green("✓")} ${pc.bold("Saved")}  ${pc.dim(MODELS_FILE)}`);
  writeln();

  const assigned = SDD_STEPS.filter((s) => map[s.key]);
  const unset = SDD_STEPS.filter((s) => !map[s.key]);

  for (const step of assigned) {
    writeln(`  ${pc.green("✓")} ${pc.bold(step.label.padEnd(26))} ${pc.cyan(map[step.key]!)}`);
  }
  for (const step of unset) {
    writeln(`  ${pc.dim("–")} ${pc.dim(step.label.padEnd(26))} ${pc.dim("(no model assigned)")}`);
  }

  writeln();
  if (freshInstall) {
    writeln(
      `  ${pc.yellow("↻ Restart opencode once")} ${pc.dim("so it loads the new plugin. After that, changes apply live.")}`,
    );
  } else {
    writeln(`  ${pc.dim("Changes apply on your next")} ${pc.cyan("/speckit.*")} ${pc.dim("command — no restart needed.")}`);
  }
  writeln();
}
