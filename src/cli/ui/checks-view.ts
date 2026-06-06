// Renders the pre-flight checks section: a single green line when all pass,
// expanded with per-item fixes when there's a blocking failure.

import pc from "picocolors";
import { writeln } from "./terminal.ts";
import type { ChecksResult } from "../../core/checks.ts";

export function renderChecksSection({ checks, allOk }: ChecksResult): void {
  if (allOk) {
    writeln(pc.green("✓ ") + pc.bold("System checks passed"));
    return;
  }

  writeln(pc.red("✗ ") + pc.bold("System checks — action required"));
  writeln();
  for (const c of checks) {
    if (c.ok) {
      writeln(`  ${pc.green("✓")} ${c.label}`);
    } else if (c.warning) {
      writeln(`  ${pc.yellow("!")} ${c.label}`);
      writeln(`    ${pc.dim("→ " + c.fix)}`);
    } else {
      writeln(`  ${pc.red("✗")} ${pc.bold(c.label)}`);
      writeln(`    ${pc.yellow("→")} ${c.fix}`);
    }
  }
  writeln();
}
