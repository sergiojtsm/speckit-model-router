// Low-level terminal primitives. The only module that writes raw escape
// sequences and reads the terminal width.

import pc from "picocolors";

export const hide = (): void => void process.stdout.write("\x1b[?25l");
export const show = (): void => void process.stdout.write("\x1b[?25h");
export const clear = (): void => void process.stdout.write("\x1bc");

export const cols = (): number => process.stdout.columns || 100;

export function write(text: string): void {
  process.stdout.write(text);
}

export function writeln(text = ""): void {
  process.stdout.write(text + "\n");
}

export interface SpinnerResult<T> {
  ok: boolean;
  result?: T;
  error?: Error;
}

/** Run a synchronous function while showing a spinner on `label`. */
export function runWithSpinner<T>(label: string, fn: () => T): SpinnerResult<T> {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  hide();
  const iv = setInterval(() => {
    process.stdout.write(`\r${pc.cyan(frames[i++ % frames.length])} ${label}   `);
  }, 80);
  try {
    const result = fn();
    clearInterval(iv);
    process.stdout.write(`\r${pc.green("✓")} ${label}\n`);
    show();
    return { ok: true, result };
  } catch (error) {
    clearInterval(iv);
    process.stdout.write(`\r${pc.red("✗")} ${label}\n`);
    show();
    return { ok: false, error: error as Error };
  }
}
