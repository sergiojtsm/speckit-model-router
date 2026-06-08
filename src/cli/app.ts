// Orchestration / imperative shell. Wires core logic to adapters and UI.

import pc from "picocolors";

import { SDD_STEPS } from "../core/steps.ts";
import { evaluateChecks } from "../core/checks.ts";
import { buildModelMap, assignmentsForSteps } from "../core/modelMap.ts";

import { checkTool, getOpencodeModels } from "./adapters/opencode.ts";
import { readModelMap, writeModelMap, deleteModelMap } from "./adapters/modelsStore.ts";
import {
  isPluginInstalled,
  isPluginUpToDate,
  installPlugin,
  uninstallPlugin,
} from "./adapters/pluginInstaller.ts";
import { MODELS_FILE, PLUGIN_DEST } from "./adapters/paths.ts";

import { clear, writeln, runWithSpinner } from "./ui/terminal.ts";
import { renderChecksSection } from "./ui/checks-view.ts";
import { runAssignmentScreen } from "./ui/assignment-screen.ts";
import { confirmModal } from "./ui/confirm.ts";

/**
 * Remove the plugin file and the model map — a full revert with no residue.
 * When `skipConfirm` is false a confirmation modal is shown first.
 * Returns true if the uninstall ran, false if the user cancelled.
 */
export async function runUninstall(skipConfirm: boolean): Promise<boolean> {
  if (!skipConfirm) {
    const confirmed = await confirmModal({
      title: "Uninstall speckit-model-router",
      lines: [
        "This will delete, with no residue:",
        `  ${pc.dim("• " + PLUGIN_DEST)}`,
        `  ${pc.dim("• " + MODELS_FILE)}`,
        "",
        pc.dim("Your opencode.json and other plugins are left untouched."),
      ],
      question: "Delete everything and revert?",
    });
    if (!confirmed) {
      clear();
      writeln();
      writeln(`  ${pc.yellow("Cancelled.")} Nothing was removed.\n`);
      return false;
    }
  }

  const removedPlugin = uninstallPlugin();
  const removedModels = deleteModelMap();

  clear();
  writeln();
  writeln(`  ${pc.bold("speckit")} ${pc.cyan("model router")} ${pc.dim("— uninstall")}`);
  writeln();
  writeln(
    removedPlugin
      ? `  ${pc.green("✓")} removed plugin   ${pc.dim(PLUGIN_DEST)}`
      : `  ${pc.dim("–")} plugin not present   ${pc.dim(PLUGIN_DEST)}`,
  );
  writeln(
    removedModels
      ? `  ${pc.green("✓")} removed models   ${pc.dim(MODELS_FILE)}`
      : `  ${pc.dim("–")} models not present   ${pc.dim(MODELS_FILE)}`,
  );
  writeln();
  if (removedPlugin) {
    writeln(
      `  ${pc.yellow("↻ Restart opencode once")} ${pc.dim("to unload the plugin from memory.")}`,
    );
  } else {
    writeln(`  ${pc.dim("Nothing to revert — already clean.")}`);
  }
  writeln();
  return true;
}

export async function run(argv: string[] = process.argv.slice(2)): Promise<void> {
  // ── Uninstall path (CLI flag) ──────────────────────────────────────────
  if (argv.includes("--uninstall")) {
    const skipConfirm = argv.includes("--yes") || argv.includes("-y");
    await runUninstall(skipConfirm);
    return;
  }

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

  const result = await runAssignmentScreen({
    models,
    steps: SDD_STEPS,
    existingAssignments,
  });

  // ── 5. Handle the outcome ──────────────────────────────────────────────
  if (result.action === "uninstall") {
    // Already confirmed inside the TUI; run the revert without re-asking.
    await runUninstall(true);
    return;
  }

  clear();
  writeln();

  if (result.action === "cancel") {
    writeln(`  ${pc.yellow("Cancelled.")} No changes saved.\n`);
    process.exit(0);
  }

  const map = buildModelMap(result.assignments, SDD_STEPS);
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
