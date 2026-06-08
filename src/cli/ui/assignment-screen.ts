// Interactive assignment screen: the table loop. Navigate rows, Enter to open
// the model modal, Backspace/Delete to clear a row (back to default), U to
// uninstall, S to save, Q to quit.
//
// Resolves a discriminated result:
//   { action: "save", assignments }  — persist these assignments
//   { action: "cancel" }             — quit without saving
//   { action: "uninstall" }          — user confirmed a full uninstall/revert

import pc from "picocolors";
import { clear, cols, hide, show, writeln } from "./terminal.ts";
import { renderTable } from "./table.ts";
import { openModelModal } from "./modal.ts";
import { confirmModal } from "./confirm.ts";
import { decodeKey } from "../../core/keys.ts";
import { MODELS_FILE, PLUGIN_DEST } from "../adapters/paths.ts";
import type { SddStep } from "../../core/steps.ts";
import { withStepCleared, clearedAll, type ModelMap } from "../../core/modelMap.ts";

export type AssignmentResult =
  | { action: "save"; assignments: ModelMap }
  | { action: "cancel" }
  | { action: "uninstall" };

export interface AssignmentScreenParams {
  models: string[];
  steps: readonly SddStep[];
  existingAssignments: ModelMap;
}

export function runAssignmentScreen({
  models,
  steps,
  existingAssignments,
}: AssignmentScreenParams): Promise<AssignmentResult> {
  let assignments: ModelMap = { ...existingAssignments };
  const totalRows = 1 + steps.length;
  let cursor = 0;

  function renderFull(): void {
    clear();
    writeln();
    writeln(`  ${pc.bold("speckit")} ${pc.cyan("model router")} ${pc.dim("— model assignment")}`);
    writeln();
    renderTable({ steps, assignments, cursor, width: cols() });
  }

  return new Promise((resolve) => {
    hide();

    async function onData(buf: Buffer): Promise<void> {
      const raw = buf.toString();
      const action = decodeKey(raw);
      const lower = raw.toLowerCase();

      if (action === "ctrl-c") {
        show();
        process.exit(0);
      }

      if (lower === "q") {
        detach();
        resolve({ action: "cancel" });
        return;
      }

      if (lower === "s") {
        detach();
        resolve({ action: "save", assignments });
        return;
      }

      if (lower === "u") {
        process.stdin.removeListener("data", onData);

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

        if (confirmed) {
          show();
          process.stdin.setRawMode(false);
          process.stdin.pause();
          resolve({ action: "uninstall" });
          return;
        }

        // Cancelled → back to the table.
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on("data", onData);
        renderFull();
        return;
      }

      // Backspace / Delete → clear the selected row back to default (no model).
      if (action === "backspace") {
        if (cursor === 0) {
          assignments = clearedAll();
        } else {
          assignments = withStepCleared(assignments, steps[cursor - 1]!.key);
        }
        renderFull();
        return;
      }

      if (action === "up") {
        if (cursor > 0) cursor--;
        renderFull();
        return;
      }

      if (action === "down") {
        if (cursor < totalRows - 1) cursor++;
        renderFull();
        return;
      }

      if (action === "enter") {
        process.stdin.removeListener("data", onData);

        if (cursor === 0) {
          const chosen = await openModelModal({ models, currentModel: null, stepLabel: "all steps" });
          if (chosen) for (const step of steps) assignments[step.key] = chosen;
        } else {
          const step = steps[cursor - 1]!;
          const chosen = await openModelModal({
            models,
            currentModel: assignments[step.key] ?? null,
            stepLabel: step.label,
          });
          if (chosen) assignments[step.key] = chosen;
        }

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on("data", onData);
        renderFull();
        return;
      }
    }

    function detach(): void {
      show();
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
    }

    renderFull();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}
