// Renders the model-assignment table: a "Model for all" row + one row per step.

import pc from "picocolors";
import { writeln } from "./terminal.ts";
import { computeLayout, pad } from "../../core/layout.ts";
import type { SddStep } from "../../core/steps.ts";
import type { ModelMap } from "../../core/modelMap.ts";

export interface RenderTableParams {
  steps: readonly SddStep[];
  assignments: ModelMap;
  cursor: number; // 0 = "Model for all", 1..N = steps[cursor-1]
  width: number;
}

export function renderTable({ steps, assignments, cursor, width }: RenderTableParams): void {
  const { cmd: CMD, model: MODEL, desc: DESC, showDesc } = computeLayout(width);
  const sepCol = pc.dim("│ ");

  const rule = (): void => {
    let line = "  " + "─".repeat(CMD) + "┼─" + "─".repeat(MODEL);
    if (showDesc) line += "┼─" + "─".repeat(DESC);
    writeln(pc.dim(line));
  };

  let header = "  " + pad("Command", CMD) + "│ " + pad("Model", MODEL);
  if (showDesc) header += "│ " + pad("Description", DESC);
  writeln(pc.dim(header));
  rule();

  const forAllActive = cursor === 0;
  let forAllRow =
    (forAllActive ? pc.cyan(" ▶ ") : "   ") +
    pc.bold(pad("Model for all", CMD)) +
    sepCol +
    pc.dim(pad("— apply one model to every step —", MODEL));
  if (showDesc) forAllRow += sepCol + pc.dim(pad("", DESC));
  writeln(forAllRow);
  rule();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const active = cursor === i + 1;
    const model = assignments[step.key] ?? "";
    const prefix = active ? pc.cyan(" ▶ ") : "   ";
    const cmdText = active ? pc.cyan(pad(step.label, CMD)) : pc.bold(pad(step.label, CMD));
    const mdText = model
      ? active
        ? pc.cyan(pad(model, MODEL))
        : pc.green(pad(model, MODEL))
      : pc.dim(pad("not set", MODEL));

    let row = `${prefix}${cmdText}${sepCol}${mdText}`;
    if (showDesc) row += `${sepCol}${pc.dim(pad(step.desc, DESC))}`;
    writeln(row);
  }

  writeln();
  writeln(
    pc.dim("  ↑↓ navigate   ") +
      pc.dim("Enter select model   ") +
      pc.dim("Supr clear (not set)   ") +
      pc.dim("S save & exit   ") +
      pc.dim("Q quit   ") +
      pc.dim("U uninstall"),
  );
}
