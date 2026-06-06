// Pure key-decoding. Maps a raw stdin chunk to a semantic action.

export type KeyAction =
  | "ctrl-c"
  | "escape"
  | "enter"
  | "up"
  | "down"
  | "backspace"
  | "char"
  | "unknown";

export function decodeKey(key: string): KeyAction {
  if (key === "\x03") return "ctrl-c";
  if (key === "\x1b" || key === "\x1b\x1b") return "escape";
  if (key === "\r" || key === "\n") return "enter";
  if (key === "\x1b[A") return "up";
  if (key === "\x1b[B") return "down";
  if (key === "\x7f" || key === "\b") return "backspace";
  if (key.length === 1 && key >= " ") return "char";
  return "unknown";
}
