// Fullscreen model-search modal: type to filter, arrows to move, Enter to pick.
// Returns the chosen model string, or null if cancelled (Esc).

import pc from "picocolors";
import { clear, cols, hide, show, write, writeln } from "./terminal.ts";
import { filterModels, computePage, splitModelId, clampCursor } from "../../core/models.ts";
import { pad } from "../../core/layout.ts";
import { decodeKey } from "../../core/keys.ts";

const PAGE = 15;

export interface ModalParams {
  models: string[];
  currentModel: string | null;
  stepLabel: string;
}

export function openModelModal({ models, currentModel, stepLabel }: ModalParams): Promise<string | null> {
  return new Promise((resolve) => {
    hide();

    let query = "";
    let cursor = 0;

    if (currentModel) {
      const idx = models.indexOf(currentModel);
      if (idx !== -1) cursor = idx;
    }

    function render(): void {
      const list = filterModels(models, query);
      cursor = clampCursor(cursor, list.length - 1);

      clear();
      writeln();
      writeln(`  ${pc.bold("Select model")}  ${pc.dim("for")} ${pc.cyan(stepLabel)}`);
      writeln();
      write(`  ${pc.dim("Search:")} `);
      writeln(pc.white(query) + pc.cyan("█"));
      writeln();

      const total = list.length;
      if (total === 0) {
        writeln(`  ${pc.dim("No models match your search")}`);
      } else {
        const { start, end } = computePage(cursor, total, PAGE);
        if (start > 0) writeln(pc.dim(`  ↑ ${start} more above`));

        const hlW = Math.max(20, Math.min(cols() - 6, 70));
        for (let i = start; i < end; i++) {
          const m = list[i]!;
          const { provider, name } = splitModelId(m);
          if (i === cursor) {
            writeln(`  ${pc.bgCyan(pc.black(" " + pad(m, hlW) + " "))}`);
          } else {
            const prov = provider ? pc.dim(provider + "/") : "";
            writeln(`  ${prov}${name}`);
          }
        }

        if (end < total) writeln(pc.dim(`  ↓ ${total - end} more below`));
      }

      writeln();
      writeln(pc.dim("  ↑↓ navigate   Enter confirm   Esc cancel"));
    }

    function onData(buf: Buffer): void {
      const raw = buf.toString();
      const action = decodeKey(raw);
      const list = filterModels(models, query);

      switch (action) {
        case "ctrl-c":
          cleanup();
          process.exit(0);
          break;
        case "escape":
          cleanup();
          resolve(null);
          break;
        case "enter":
          if (list.length > 0 && cursor < list.length) {
            const chosen = list[cursor]!;
            cleanup();
            resolve(chosen);
          }
          break;
        case "up":
          if (cursor > 0) cursor--;
          render();
          break;
        case "down":
          if (cursor < list.length - 1) cursor++;
          render();
          break;
        case "backspace":
          query = query.slice(0, -1);
          cursor = 0;
          render();
          break;
        case "char":
          query += raw;
          cursor = 0;
          render();
          break;
        default:
          break;
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
