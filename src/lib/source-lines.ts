export const lineNoteLimit = 16;

export interface LineNote {
  line: number;
  explanation: string;
}

export function isLineNote(value: unknown): value is LineNote {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<LineNote>;
  return typeof note.line === "number" && Number.isSafeInteger(note.line) && note.line > 0 &&
    typeof note.explanation === "string" && !!note.explanation.trim();
}

export function getSourceLines(input: string) {
  return Array.from(input.matchAll(/([^\r\n]*)(?:\r\n|\n|\r|$)/g), (match, index) => ({
    line: index + 1,
    text: match[1],
    offset: match.index,
  })).filter(line => line.text.trim());
}
