// Interactive assignment screen: the table loop. Navigate rows, Enter to open
// the model modal, S to save, Q to quit. Returns the final assignments, or null
// if the user quit without saving.

import pc from "picocolors";
import { clear, cols, hide, show, writeln } from "./terminal.ts";
import { renderTable } from "./table.ts";
import { openModelModal } from "./modal.ts";
import { decodeKey } from "../../core/keys.ts";
import type { SddStep } from "../../core/steps.ts";
import type { ModelMap } from "../../core/modelMap.ts";

export interface AssignmentScreenParams {
  models: string[];
  steps: readonly SddStep[];
  existingAssignments: ModelMap;
}

export function runAssignmentScreen({
  models,
  steps,
  existingAssignments,
}: AssignmentScreenParams): Promise<ModelMap | null> {
  const assignments: ModelMap = { ...existingAssignments };
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
        resolve(null);
        return;
      }

      if (lower === "s") {
        detach();
        resolve(assignments);
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
