// Pure layout/formatting helpers for the terminal table.
// No side-effects, no terminal access — width is always passed in.

export interface TableLayout {
  cmd: number;
  model: number;
  desc: number;
  showDesc: boolean;
}

/**
 * Pad (or truncate) a string to exactly `len` visible characters.
 * Always returns a string of length `len` (when len > 0).
 */
export function pad(str: unknown, len: number): string {
  if (len <= 0) return "";
  const s = String(str ?? "");
  if (s.length >= len) return s.slice(0, len - 1) + " ";
  return s + " ".repeat(len - s.length);
}

/**
 * Compute responsive column widths for the assignment table given the
 * terminal width. Guarantees non-negative widths at any size and drops
 * the description column when there isn't enough room.
 *
 * Layout: " ▶ " (PREFIX) + CMD + "│ " (SEP) + MODEL + ("│ " (SEP) + DESC)?
 */
export function computeLayout(terminalWidth: number): TableLayout {
  const width = Math.max((terminalWidth || 100) - 1, 20);
  const PREFIX = 3; // " ▶ " / "   "
  const SEP = 2;    // "│ "

  const MIN_CMD = 14;
  const MIN_MODEL = 12;
  const MIN_DESC = 16;

  let cmd = 24;
  let model = 34;
  let desc = 32;
  let showDesc = true;

  let avail = width - PREFIX - SEP - SEP;

  if (avail < MIN_CMD + MIN_MODEL + MIN_DESC) {
    // Not enough room for three columns → drop description.
    showDesc = false;
    desc = 0;
    avail = width - PREFIX - SEP;

    if (avail < MIN_CMD + MIN_MODEL) {
      cmd = Math.max(MIN_CMD, Math.floor(avail * 0.45));
      model = Math.max(MIN_MODEL, avail - cmd);
    } else {
      cmd = Math.min(cmd, Math.max(MIN_CMD, Math.floor(avail * 0.4)));
      model = avail - cmd;
    }
  } else {
    const total = cmd + model + desc;
    if (total > avail) {
      desc = Math.max(MIN_DESC, Math.floor(avail * 0.28));
      cmd = Math.max(MIN_CMD, Math.floor(avail * 0.3));
      model = Math.max(MIN_MODEL, avail - cmd - desc);
    } else {
      model = avail - cmd - desc;
    }
  }

  return { cmd, model, desc, showDesc };
}
