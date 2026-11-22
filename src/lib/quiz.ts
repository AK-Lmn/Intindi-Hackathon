export interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  quote: string;
}

export function isQuiz(value: unknown, excerpt: string): value is QuizQuestion[] {
  return Array.isArray(value) && value.length === 3 && value.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const q = item as Partial<QuizQuestion>;
    return typeof q.question === "string" && !!q.question.trim() &&
      Array.isArray(q.choices) && q.choices.length === 3 &&
      q.choices.every(choice => typeof choice === "string" && !!choice.trim()) &&
      new Set(q.choices.map(choice => choice.trim().toLowerCase())).size === 3 &&
      typeof q.answer === "string" && q.choices.includes(q.answer) &&
      typeof q.explanation === "string" && !!q.explanation.trim() &&
      typeof q.quote === "string" && !!q.quote.trim() && excerpt.includes(q.quote);
  });
}
