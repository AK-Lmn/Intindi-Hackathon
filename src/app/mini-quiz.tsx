"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/quiz";

export function MiniQuiz({ questions, best, onScore, onLocate }: {
  questions: QuizQuestion[];
  best: number | undefined;
  onScore: (score: number) => void;
  onLocate: (quote: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const nextIndex = questions.findIndex((_, index) => answers[index] === undefined);
  const score = questions.filter((question, index) => answers[index] === question.answer).length;

  function choose(index: number, choice: string) {
    if (answers[index] !== undefined) return;
    const next = { ...answers, [index]: choice };
    setAnswers(next);
    if (questions.every((_, i) => next[i] !== undefined)) {
      onScore(questions.filter((question, i) => next[i] === question.answer).length);
    }
  }

  return (
    <section aria-label="Mini quiz" className="space-y-4 border-t border-[var(--intindi-border)] pt-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold">Mini quiz</h3>
        {best !== undefined && <p className="text-xs tabular-nums">Personal best {best}/{questions.length}</p>}
      </header>
      {questions.map((question, index) => {
        if (showResults || index !== activeIndex) return null;
        const picked = answers[index];
        return (
          <fieldset key={index} className="min-w-0 space-y-2">
            <legend className="mb-1 text-sm font-semibold">Question {index + 1} of {questions.length} · {question.question}</legend>
            {question.choices.map(choice => (
              <button key={choice} type="button" disabled={picked !== undefined}
                aria-pressed={picked === choice} onClick={() => choose(index, choice)}
                className="pressable block min-h-11 w-full rounded-lg border border-[var(--intindi-border)] px-3 py-2 text-left text-sm [overflow-wrap:anywhere] enabled:hover:bg-[var(--intindi-sky)] aria-pressed:bg-[var(--intindi-sky)]">
                {choice}
              </button>
            ))}
            {picked !== undefined && (
              <div role="status" className="answer-enter rounded-lg bg-[var(--intindi-paper)] p-3 text-sm leading-6 [overflow-wrap:anywhere]">
                <p><strong>{picked === question.answer ? "Correct." : "Correct answer:"}</strong>{picked !== question.answer && ` ${question.answer}`}</p>
                <p>{question.explanation}</p>
                <button type="button" onClick={() => onLocate(question.quote)}
                  className="mt-1 block text-left text-xs underline underline-offset-2">
                  <span className="sr-only">Find in excerpt: </span><code>{question.quote}</code>
                </button>
              </div>
            )}
            {picked !== undefined && (
              <button type="button"
                className="pressable min-h-11 rounded-lg border border-[var(--intindi-focus)] px-3 text-sm font-semibold"
                onClick={() => {
                  if (nextIndex === -1) setShowResults(true);
                  else setActiveIndex(nextIndex);
                }}>
                {nextIndex === -1 ? "See results" : "Next question"}
              </button>
            )}
          </fieldset>
        );
      })}
      {showResults && (
        <div className="answer-enter flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--intindi-sky)] p-3">
          <p role="status" className="text-sm font-bold tabular-nums">{score}/{questions.length} correct</p>
          {score < questions.length && (
            <button type="button" className="pressable min-h-10 rounded-lg border border-[var(--intindi-focus)] px-3 text-sm font-semibold"
              onClick={() => {
                setAnswers(Object.fromEntries(questions.flatMap((question, index) =>
                  answers[index] === question.answer ? [[index, question.answer]] : [],
                )));
                setActiveIndex(questions.findIndex((question, index) => answers[index] !== question.answer));
                setShowResults(false);
              }}>
              Retry missed questions
            </button>
          )}
        </div>
      )}
    </section>
  );
}
