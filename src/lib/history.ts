import type { ExplainResult } from "./ai";

export interface SavedExplanation {
  id: string;
  input: string;
  result: ExplainResult;
  walkthrough?: ExplainResult;
}

const storageKey = "intindi-explanations-v1";
export const historyLimit = 5;

function isResult(value: unknown): value is ExplainResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<ExplainResult>;
  return typeof result.text === "string" &&
    (result.source === "on-device" || result.source === "cloud");
}

function isSavedExplanation(value: unknown): value is SavedExplanation {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<SavedExplanation>;
  return typeof entry.id === "string" && typeof entry.input === "string" &&
    isResult(entry.result) &&
    (entry.walkthrough === undefined ||
      (isResult(entry.walkthrough) && entry.walkthrough.source === "cloud"));
}

export function readHistory(): SavedExplanation[] {
  const entries: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  return Array.isArray(entries) ? entries.filter(isSavedExplanation).slice(0, historyLimit) : [];
}

export function writeHistory(entries: SavedExplanation[]) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}
