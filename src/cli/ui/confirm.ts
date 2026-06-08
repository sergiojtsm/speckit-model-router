// Fullscreen confirmation modal. Lists what is about to happen (e.g. files to
// be deleted) and waits for y/N. Returns true only on an explicit "y"/"yes".
// Default (Enter, N, Esc) is "no" — destructive actions must be opted into.

import pc from "picocolors";
import { clear, hide, show, writeln } from "./terminal.ts";
import { decodeKey } from "../../core/keys.ts";

export interface ConfirmParams {
  title: string;
  /** Lines describing the consequences (e.g. files that will be removed). */
  lines: string[];
  /** The yes/no question. */
  question: string;
}

export function confirmModal({ title, lines, question }: ConfirmParams): Promise<boolean> {
  return new Promise((resolve) => {
    hide();

    function render(): void {
      clear();
      writeln();
      writeln(`  ${pc.bold(pc.red(title))}`);
      writeln();
      for (const line of lines) writeln(`  ${line}`);
      writeln();
      writeln(`  ${question} ${pc.dim("[y/N]")}`);
      writeln();
      writeln(pc.dim("  y confirm   N / Esc cancel"));
    }

    function onData(buf: Buffer): void {
      const raw = buf.toString();
      const action = decodeKey(raw);
      const lower = raw.toLowerCase();

      if (action === "ctrl-c") {
        cleanup();
        process.exit(0);
      }

      if (lower === "y") {
        cleanup();
        resolve(true);
        return;
      }

      // Anything else that is a decision (n, Enter, Esc) cancels.
      if (lower === "n" || action === "enter" || action === "escape") {
        cleanup();
        resolve(false);
      }
    }

    function cleanup(): void {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      show();
    }

    render();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}
