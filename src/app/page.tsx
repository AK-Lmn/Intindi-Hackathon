"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, BookOpen, Braces, ChevronDown, CircleAlert, Cloud, Cpu, History, LoaderCircle, MessageCircle, RotateCcw, ScanLine, Trash2 } from "lucide-react";
import { explainInTaglish, getFollowUp, getTutorError, getWalkthrough, maxFollowUpLength, maxInputLength, type ExplainProgress, type FollowUpExchange, type TutorTask } from "@/lib/ai";
import { detectCodeLanguage } from "@/lib/code-language";
import { isFirebaseConfigured } from "@/lib/firebase";
import { historyLimit, readHistory, writeHistory, type SavedExplanation } from "@/lib/history";
import { getSourceLines, lineNoteLimit, type LineNote } from "@/lib/source-lines";
import { followUpLimit, followUpLimitKey, followUpWindowMinutes, readFollowUps } from "@/lib/follow-up-limit";
import { Faq } from "./faq";
import { MiniQuiz } from "./mini-quiz";
import { isQuiz } from "@/lib/quiz";

const samples = [
  { label: "Sample code", icon: Braces, excerpt: "[10, 20, 30].reduce((sum, price) => sum + price, 0);" },
  {
    label: "Sample docs",
    icon: BookOpen,
    excerpt: "An HTTP 304 response lets a client reuse its cached representation after revalidation.",
  },
];

const tourStorageKey = "intindi-tour-v1";
const tourSteps = [
  { title: "Try a sample", text: "Choose Sample code or Sample docs below, or paste your own excerpt." },
  { title: "Get a Taglish explanation", text: "Select Explain in Taglish. The Answer shows whether Gemini ran on your device or in the cloud. Nano may need a one-time download." },
  { title: "Ask about what’s unclear", text: "Use Go deeper for a walkthrough and quiz, or Ask a follow-up for a specific question." },
];

const walkthroughHeadings = /^(Takeaway|Step by step|Worked example|Examples|Practice questions|Answers)[ \t]*$/m;

type TutorProgress = ExplainProgress | { stage: "download"; percent?: undefined } | { stage: "walkthrough" | "follow-up" };

const loadingCopy = {
  checking: "Checking for Gemini Nano…",
  download: "Downloading Gemini Nano…",
  device: "Writing your explanation on this device…",
  cloud: "Writing your explanation with Gemini in the cloud…",
  walkthrough: "Building your walkthrough…",
  "follow-up": "Answering your follow-up…",
};

function formatElapsed(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function TutorLoading({ progress, startedAt, onCancel }: {
  progress: TutorProgress;
  startedAt: number;
  onCancel: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const downloading = progress.stage === "download";
  useEffect(() => {
    const update = () => setElapsed(performance.now() - startedAt);
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [startedAt]);
  return (
    <div className="answer-enter mt-3 rounded-xl border border-[var(--intindi-border)] bg-white/75 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="flex items-center gap-2 text-sm font-semibold">
          <LoaderCircle aria-hidden="true" size={16} className="progress-icon shrink-0" />
          {loadingCopy[progress.stage]}
        </p>
        <span role="timer" aria-label="Elapsed time" className="text-xs tabular-nums text-[var(--intindi-muted)]">
          {formatElapsed(elapsed)} elapsed
        </span>
      </div>
      {downloading ? (
        <>
          <div className="mt-2 flex items-center gap-2">
            <progress aria-label="Gemini Nano download" value={progress.percent} max={100} className="h-3 min-w-0 flex-1 accent-[var(--intindi-focus)]" />
            {progress.percent !== undefined && <span aria-hidden="true" className="min-w-8 text-right text-xs font-semibold tabular-nums">{progress.percent}%</span>}
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--intindi-muted)]">First download can take a few minutes. Stay online and keep this tab open.</p>
        </>
      ) : (
        <div aria-hidden="true" className="mt-3 space-y-2">
          <div className="h-2 w-full rounded-full bg-[var(--intindi-border)]" />
          <div className="h-2 w-2/3 rounded-full bg-[var(--intindi-border)]" />
        </div>
      )}
      {!downloading && elapsed >= 12_000 && <p role="status" className="mt-2 text-xs text-[var(--intindi-muted)]">Still working. This is taking a little longer than usual.</p>}
      <button type="button" onClick={onCancel}
        className="pressable mt-1 min-h-11 rounded-md px-2 text-xs font-semibold underline underline-offset-2">
        Stop waiting
      </button>
    </div>
  );
}

function ExplanationText({ text }: { text: string }) {
  return text.split(/(`[^`\n]+`)/g).map((part, index) =>
    index % 2 === 1 ? <code key={index} className="rounded bg-white/65 px-1 font-mono text-[0.9em]">{part.slice(1, -1)}</code> : part,
  );
}

function LineByLine({ excerpt, notes, onLocate }: {
  excerpt: string;
  notes: LineNote[];
  onLocate: (offset: number, length: number) => void;
}) {
  const lines = getSourceLines(excerpt);
  const byNumber = new Map(notes.map(note => [note.line, note.explanation]));
  return (
    <details className="group rounded-xl border border-[var(--intindi-border)]">
      <summary className="pressable flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 text-sm font-bold hover:bg-[var(--intindi-sky)] [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 sm:gap-2"><Braces aria-hidden="true" size={15} /> Line by line</span>
        <ChevronDown aria-hidden="true" size={16} className="disclosure-chevron shrink-0 group-open:rotate-180" />
      </summary>
      {notes.length > 0 ? (
        <div className="answer-enter divide-y divide-[var(--intindi-border)] border-t border-[var(--intindi-border)]">
          {lines.length > lineNoteLimit && (
            <p className="px-4 py-3 text-xs text-[var(--intindi-muted)]">
              Showing the first {lineNoteLimit} non-blank lines. Paste a smaller section to go through the other lines.
            </p>
          )}
          {lines.slice(0, lineNoteLimit).map(({ line, text, offset }) => {
            const explanation = byNumber.get(line);
            if (!explanation) return null;
            return (
              <div key={line} className="px-4 py-3">
                <button
                  type="button"
                  aria-label={`Select line ${line} in the excerpt`}
                  onClick={() => onLocate(offset, text.length)}
                  className="pressable flex w-full items-start gap-3 rounded-lg bg-[var(--intindi-paper)] px-2 py-1.5 text-left font-mono text-xs leading-5 hover:bg-[var(--intindi-sky)]"
                >
                  <span className="w-6 shrink-0 text-right tabular-nums text-[var(--intindi-muted)]">{line}</span>
                  <code className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</code>
                </button>
                <p className="mt-2 text-sm leading-6 [overflow-wrap:anywhere]"><ExplanationText text={explanation} /></p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="border-t border-[var(--intindi-border)] px-4 py-3 text-sm text-[var(--intindi-muted)]">
          The line notes didn’t match the excerpt closely enough. The rest of the walkthrough is still available.
        </p>
      )}
    </details>
  );
}

function WalkthroughContent({ text, excerpt, onLocate, showPractice }: {
  text: string;
  excerpt: string;
  onLocate: (quote: string) => void;
  showPractice: boolean;
}) {
  const [intro, ...parts] = text.split(walkthroughHeadings);
  return (
    <div className="space-y-5 text-sm leading-6 [overflow-wrap:anywhere]">
      {intro.trim() && <p className="whitespace-pre-wrap"><ExplanationText text={intro.trim()} /></p>}
      {parts.map((heading, index) => {
        if (index % 2) return null;
        if (!showPractice && (heading === "Practice questions" || heading === "Answers")) return null;
        const body = parts[index + 1]?.trim();
        if (!body) return null;
        const items = body.split(/(?:^|\n)[ \t]*\d+\.[ \t]+/);
        const numbered = items.length > 1 && !items[0];

        if (heading === "Takeaway" || heading === "Worked example") {
          return (
            <div key={index} className={heading === "Takeaway"
              ? "rounded-xl bg-[var(--intindi-sky)] px-4 py-3"
              : "rounded-xl border border-[var(--intindi-border)] bg-[var(--intindi-paper)] px-4 py-3"}>
              <h3 className="font-bold">{heading}</h3>
              <p className="mt-1 whitespace-pre-wrap"><ExplanationText text={body} /></p>
            </div>
          );
        }

        if (heading === "Answers") {
          return (
            <details key={index} className="group rounded-xl border border-[var(--intindi-border)]">
              <summary className="pressable flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 font-bold hover:bg-[var(--intindi-sky)] [&::-webkit-details-marker]:hidden">
                Practice answers
                <ChevronDown aria-hidden="true" size={16} className="disclosure-chevron shrink-0 group-open:rotate-180" />
              </summary>
              <div className="answer-enter border-t border-[var(--intindi-border)] px-4 py-3">
                {numbered
                  ? <ol className="ml-5 list-decimal space-y-2">{items.slice(1).map((item, i) => <li key={i}><ExplanationText text={item.trim()} /></li>)}</ol>
                  : <p className="whitespace-pre-wrap"><ExplanationText text={body} /></p>}
              </div>
            </details>
          );
        }

        return (
          <div key={index}>
            <h3 className="font-bold">{heading}</h3>
            {numbered ? (
              <ol className="mt-2 ml-5 list-decimal space-y-3 marker:font-semibold">
                {items.slice(1).map((item, i) => {
                  const step = heading === "Step by step" ? item.trim().match(/^`([^`]+)` — ([\s\S]+)$/) : null;
                  return (
                    <li key={i} className="pl-1">
                      {step && excerpt.includes(step[1]) && excerpt.indexOf(step[1]) === excerpt.lastIndexOf(step[1]) ? (
                        <>
                          <button
                            type="button"
                            title="Select this quote in your excerpt"
                            onClick={() => onLocate(step[1])}
                            className="pressable inline-flex max-w-full items-center gap-2 rounded-md bg-[var(--intindi-sky)] px-2 py-1 text-left hover:bg-[var(--intindi-border)]"
                          >
                            <ScanLine aria-hidden="true" size={14} className="shrink-0" />
                            <code className="min-w-0 whitespace-pre-wrap text-xs">{step[1]}</code>
                          </button>
                          <p className="mt-1"><ExplanationText text={step[2]} /></p>
                        </>
                      ) : <ExplanationText text={item.trim()} />}
                    </li>
                  );
                })}
              </ol>
            ) : <p className="mt-1 whitespace-pre-wrap"><ExplanationText text={body} /></p>}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [expandedEditor, setExpandedEditor] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"code" | "answer">("code");
  const [progress, setProgress] = useState<TutorProgress | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [current, setCurrent] = useState<SavedExplanation | null>(null);
  const [fromHistory, setFromHistory] = useState(false);
  const [error, setError] = useState<{ task: TutorTask; message: string } | null>(null);
  const [question, setQuestion] = useState("");
  const [followUp, setFollowUp] = useState<FollowUpExchange | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [history, setHistory] = useState<SavedExplanation[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [availability, setAvailability] = useState("checking");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const mobileAnswerButtonRef = useRef<HTMLButtonElement>(null);
  const answerRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const busy = progress !== null;
  const followUpsLeft = followUpLimit - attempts.length;
  const tour = tourStep === null ? null : tourSteps[tourStep];
  const tourRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(tourStorageKey)) setTourStep(0);
    } catch {
      // Storage may be unavailable. The tour can still be replayed.
    }
  }, []);

  function dismissTour() {
    setTourStep(null);
    try {
      localStorage.setItem(tourStorageKey, "seen");
    } catch {
      // The current session still dismisses the tour.
    }
  }

  function replayTour() {
    setTourStep(0);
    setMobileView("code");
    requestAnimationFrame(() => {
      tourRef.current?.focus({ preventScroll: true });
      scrollToPanel(tourRef.current);
    });
  }
  useEffect(() => {
    function openLinkedFaq() {
      if (window.location.hash === "#faq") setFaqExpanded(true);
    }
    openLinkedFaq();
    window.addEventListener("hashchange", openLinkedFaq);
    return () => window.removeEventListener("hashchange", openLinkedFaq);
  }, []);
  useEffect(() => {
    const sync = () => setAttempts(previous => readFollowUps(previous));
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!attempts.length) return;
    const delay = attempts[0] + followUpWindowMinutes * 60_000 - Date.now();
    const timeout = window.setTimeout(
      () => setAttempts(previous => readFollowUps(previous)),
      Math.max(0, delay),
    );
    return () => window.clearTimeout(timeout);
  }, [attempts]);
  useEffect(() => {
    try {
      setHistory(readHistory());
    } catch {
      setHistoryError("Could not load saved history.");
    }
  }, []);
  useEffect(() => {
    const { LanguageModel } = window as Window & {
      LanguageModel?: { availability(options: object): Promise<string> };
    };
    if (!LanguageModel) {
      setAvailability("Prompt API unavailable");
      return;
    }
    LanguageModel.availability({ expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }] })
      .then(setAvailability, () => setAvailability("unknown"));
  }, []);
  const configured = isFirebaseConfigured();
  const excerptLength = input.trim().length;
  const tooLong = excerptLength > maxInputLength;
  const language = useMemo(() => tooLong ? null : detectCodeLanguage(input), [input, tooLong]);
  const savedMatch = history.find(entry => entry.input === input.trim() && entry.walkthrough)
    ?? history.find(entry => entry.input === input.trim());
  const canExplain = (configured || !!savedMatch) && excerptLength > 0 && !tooLong && !progress;
  const result = current?.result;
  const walkthrough = current?.walkthrough;
  const quiz = current && isQuiz(walkthrough?.quiz, current.input) ? walkthrough.quiz : undefined;
  const bestScore = current ? Math.max(-1, ...history
    .filter(entry => entry.input === current.input)
    .map(entry => entry.quizBest ?? -1)) : -1;

  function selectExcerpt(excerpt: string, saved: SavedExplanation | null = null) {
    setInput(excerpt);
    setCurrent(saved);
    setFromHistory(!!saved);
    setError(null);
    setQuestion("");
    setFollowUp(null);
  }

  function showAnswer(fromHistory = false) {
    setMobileView("answer");
    if (window.matchMedia("(width < 64rem)").matches) {
      mobileAnswerButtonRef.current?.focus({ preventScroll: true });
      scrollToPanel(workspaceRef.current);
    } else if (fromHistory) {
      answerRef.current?.focus({ preventScroll: true });
      scrollToPanel(answerRef.current);
    }
  }

  function scrollToPanel(panel: HTMLElement | null) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel?.scrollIntoView({ block: "start", behavior: reduceMotion ? "instant" : "smooth" });
  }

  function startRequest(stage: TutorProgress) {
    const request = new AbortController();
    requestRef.current = request;
    const start = performance.now();
    setStartedAt(start);
    setError(null);
    setProgress(stage);
    return { request, start };
  }

  function finishRequest(request: AbortController) {
    if (requestRef.current !== request) return;
    requestRef.current = null;
    setProgress(null);
  }

  function stopWaiting() {
    requestRef.current?.abort();
    requestRef.current = null;
    setProgress(null);
  }

  function selectSource(start: number, end: number) {
    setMobileView("code");
    requestAnimationFrame(() => {
      editorRef.current?.focus({ preventScroll: true });
      editorRef.current?.setSelectionRange(start, end);
      scrollToPanel(workspaceRef.current);
    });
  }

  function locateQuote(quote: string) {
    const start = input.indexOf(quote);
    if (start < 0) return;
    selectSource(start, start + quote.length);
  }

  function locateLine(offset: number, length: number) {
    const editor = editorRef.current;
    if (!editor || !current || editor.value.trim() !== current.input) return;
    const start = editor.value.length - editor.value.trimStart().length + offset;
    selectSource(start, start + length);
  }

  function save(entry: SavedExplanation) {
    const next = history.some(item => item.id === entry.id)
      ? history.map(item => item.id === entry.id ? entry : item)
      : [entry, ...history].slice(0, historyLimit);
    setCurrent(entry);
    setHistory(next);
    try {
      writeHistory(next);
      setHistoryError("");
    } catch {
      setHistoryError("Your answer is ready. The browser could not save it to history.");
    }
  }

  function clearHistory() {
    if (busy) return;
    try {
      writeHistory([]);
      setHistory([]);
      setHistoryError("");
      setConfirmClear(false);
      selectExcerpt(input);
    } catch {
      setHistoryError("Could not clear saved history. Try again or clear this site’s data in your browser settings.");
    }
  }

  async function explain(fresh = false) {
    if (!canExplain || requestRef.current) return;
    if (savedMatch && !fresh) {
      selectExcerpt(input, savedMatch);
      showAnswer();
      return;
    }
    if (!configured) return;
    const expectsDownload = navigator.onLine && (availability === "downloadable" || availability === "downloading");
    const { request, start } = startRequest(expectsDownload ? { stage: "download" } : { stage: "checking" });
    setCurrent(null);
    setFromHistory(false);
    setQuestion("");
    setFollowUp(null);
    showAnswer();
    try {
      const excerpt = input.trim();
      const explanation = await explainInTaglish(excerpt, update => {
        if (request.signal.aborted) return;
        if (update.stage !== "checking" || !expectsDownload) setProgress(update);
        if (update.stage === "device") setAvailability("available");
      }, request.signal);
      if (request.signal.aborted) return;
      save({
        id: crypto.randomUUID(),
        input: excerpt,
        result: { ...explanation, durationMs: performance.now() - start },
      });
    } catch (cause) {
      if (!request.signal.aborted) setError({ task: "quick", message: getTutorError(cause, "quick", navigator.onLine) });
    } finally {
      finishRequest(request);
    }
  }

  async function goDeeper() {
    if (!current || requestRef.current) return;
    const { request, start } = startRequest({ stage: "walkthrough" });
    try {
      const detail = await getWalkthrough(current.input);
      if (request.signal.aborted) return;
      save({ ...current, walkthrough: { ...detail, durationMs: performance.now() - start } });
    } catch (cause) {
      if (!request.signal.aborted) setError({ task: "walkthrough", message: getTutorError(cause, "walkthrough", navigator.onLine) });
    } finally {
      finishRequest(request);
    }
  }

  async function askFollowUp() {
    const trimmed = question.trim();
    if (!current || !configured || requestRef.current || !trimmed || trimmed.length > maxFollowUpLength) return;
    const now = Date.now();
    const recent = readFollowUps(attempts, now);
    if (recent.length >= followUpLimit) {
      setAttempts(recent);
      return;
    }
    if (navigator.onLine) {
      const next = [...recent, now];
      setAttempts(next);
      try {
        localStorage.setItem(followUpLimitKey, JSON.stringify(next));
      } catch {
        // The in-memory limit still applies until the tab reloads.
      }
    }
    const { request, start } = startRequest({ stage: "follow-up" });
    try {
      const answer = await getFollowUp(current.input, current.result.text, trimmed, followUp);
      if (request.signal.aborted) return;
      setFollowUp({ question: trimmed, answer: { ...answer, durationMs: performance.now() - start } });
      setQuestion("");
    } catch (cause) {
      if (!request.signal.aborted) setError({ task: "follow-up", message: getTutorError(cause, "follow-up", navigator.onLine) });
    } finally {
      finishRequest(request);
    }
  }

  return (
    <main className="mx-auto max-w-[82rem] px-3 pb-14 sm:px-8 lg:px-12">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[var(--intindi-border)] py-2 sm:py-4">
        <img src="/intindi.svg" width={112} height={31} alt="Intindi" className="w-24 sm:w-28" />
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:gap-4 text-[var(--intindi-muted)]">
          <p role="status" className="inline-flex items-center gap-1.5 sm:gap-2">
            <Cpu aria-hidden="true" size={16} />
            <span className="sm:hidden" aria-hidden="true">{availability === "Prompt API unavailable" ? "Nano unavailable" : `Nano: ${availability}`}</span><span className="sr-only sm:not-sr-only">Gemini Nano: {availability}</span>
          </p>
          <a href="#faq" onClick={() => setFaqExpanded(true)} className="inline-flex min-h-11 items-center rounded-sm px-2 underline underline-offset-4 hover:text-[var(--intindi-focus)]">FAQ</a>
        </div>
      </header>

      <div className="pb-5 pt-6 sm:pb-9 sm:pt-10">
        <h1 className="text-balance text-[clamp(1.875rem,6vw,3rem)] leading-[1.08] font-bold tracking-[-0.04em]">
          Understand code in Taglish.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--intindi-muted)] sm:text-base">
          Paste code or a docs excerpt for a quick explanation in everyday Filipino and English.
        </p>
      </div>

      {tour && tourStep !== null && (
        <section ref={tourRef} tabIndex={-1} aria-labelledby="tour-heading"
          className="mb-3 scroll-mt-16 rounded-xl border border-[var(--intindi-border)] bg-white px-3 py-2 sm:mb-4 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <div className="min-w-0 flex-1 py-1" aria-live="polite">
              <p className="text-xs font-semibold text-[var(--intindi-muted)]">Quick tour · {tourStep + 1} of {tourSteps.length}</p>
              <h2 id="tour-heading" className="mt-1 text-sm font-bold">{tour.title}</h2>
              <p className="mt-1 text-sm leading-5 text-[var(--intindi-muted)]">{tourStep === 2 && !result ? "Your explanation appears here. After it loads, try Go deeper or Ask a follow-up." : tour.text}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={dismissTour} className="pressable min-h-11 rounded-lg px-3 text-sm underline underline-offset-2">Skip</button>
              <button type="button" onClick={() => {
                if (tourStep === tourSteps.length - 1) {
                  dismissTour();
                } else {
                  const nextStep = tourStep + 1;
                  setTourStep(nextStep);
                  setMobileView(nextStep === 2 ? "answer" : "code");
                }
              }}
                className="pressable min-h-11 rounded-lg bg-[var(--intindi-sky)] px-3 text-sm font-bold hover:bg-[var(--intindi-border)]">
                {tourStep === tourSteps.length - 1 ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </section>
      )}

      <nav aria-label="Workspace view"
        className="sticky top-0 z-10 mb-3 grid grid-cols-2 gap-1 rounded-xl border border-[var(--intindi-border)] bg-[var(--intindi-paper)] p-1 lg:hidden">
        <button type="button" aria-pressed={mobileView === "code"} aria-controls="code-panel"
          className="pressable min-h-11 rounded-lg text-sm font-semibold aria-pressed:bg-[var(--intindi-ink)] aria-pressed:text-white"
          onClick={() => { setMobileView("code"); scrollToPanel(workspaceRef.current); }}>
          Code
        </button>
        <button ref={mobileAnswerButtonRef} type="button" aria-pressed={mobileView === "answer"} aria-controls="answer-panel"
          className="pressable min-h-11 rounded-lg text-sm font-semibold aria-pressed:bg-[var(--intindi-ink)] aria-pressed:text-white"
          onClick={() => { setMobileView("answer"); scrollToPanel(workspaceRef.current); }}>
          Answer
        </button>
      </nav>

      <div ref={workspaceRef} className="grid scroll-mt-16 items-start gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-6">
        <section id="code-panel" aria-label="Code editor" className={`workspace-panel min-w-0 rounded-2xl border border-[var(--intindi-border)] bg-white lg:block ${mobileView === "code" ? "" : "hidden"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--intindi-border)] px-4 py-3 sm:px-5">
            <label htmlFor="excerpt" className="font-bold">Code or docs</label>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {excerptLength > 0 && !tooLong && (
                <span id="detected-language" className="rounded-md bg-[var(--intindi-sky)] px-2 py-1 text-xs font-medium">
                  {language ?? "Unknown language"}
                </span>
              )}
              <p id="input-limit" className="text-xs tabular-nums text-[var(--intindi-muted)]">
                {excerptLength.toLocaleString("en-US")} / {maxInputLength.toLocaleString("en-US")}
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <textarea
              ref={editorRef}
              id="excerpt"
              rows={4}
              value={input}
              disabled={!!progress}
              placeholder="Paste your snippet here…"
              aria-describedby={excerptLength > 0 && !tooLong ? "detected-language input-limit cloud-note" : "input-limit cloud-note"}
              aria-invalid={tooLong}
              className={`block w-full resize-y rounded-lg border border-[var(--intindi-border)] bg-[var(--intindi-paper)] p-3 font-mono text-base leading-6 placeholder:text-[var(--intindi-muted)] lg:min-h-52 lg:text-sm ${expandedEditor ? "min-h-60" : "min-h-28"}`}
              onChange={event => selectExcerpt(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && canExplain) {
                  event.preventDefault();
                  void explain();
                }
              }}
            />
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0">
              <button type="button" aria-expanded={expandedEditor} aria-controls="excerpt"
                onClick={() => setExpandedEditor(!expandedEditor)}
                className="pressable min-h-11 rounded-lg px-2 text-xs font-semibold hover:bg-[var(--intindi-sky)] lg:hidden">
                {expandedEditor ? "Compact editor" : "Expand editor"}
              </button>
              {samples.map(({ label, icon: Icon, excerpt }) => (
                <button
                  key={label}
                  data-tour-highlight={tourStep === 0 && label === "Sample code" ? "" : undefined}
                  type="button"
                  disabled={!!progress}
                  className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold hover:bg-[var(--intindi-sky)] disabled:opacity-50"
                  onClick={() => {
                    selectExcerpt(excerpt);
                    if (window.matchMedia("(pointer: fine)").matches) editorRef.current?.focus({ preventScroll: true });
                  }}
                >
                  <Icon aria-hidden="true" size={15} />
                  {label}
                </button>
              ))}
            </div>
            {tooLong && <p role="alert" className="mt-2 text-sm text-[#8c3629]">Trim your excerpt to 6,000 characters.</p>}
            {!configured && <p role="status" className="mt-2 text-sm">Add your Firebase web config to .env.local first.</p>}
            <button
              type="button"
              onClick={() => void explain()}
              data-tour-highlight={tourStep === 1 ? "" : undefined}
              disabled={!canExplain}
              aria-keyshortcuts="Control+Enter Meta+Enter"
              className="pressable mt-2 flex min-h-12 sm:mt-3 w-full items-center justify-center gap-2 rounded-lg bg-[var(--intindi-apricot)] px-4 text-sm font-bold hover:bg-[#ffb678] disabled:opacity-50"
            >
              {busy && progress.stage !== "walkthrough" && progress.stage !== "follow-up"
                ? "Working on your explanation…"
                : savedMatch ? "Open saved answer" : "Explain in Taglish"}
              {busy && progress.stage !== "walkthrough" && progress.stage !== "follow-up"
                ? <LoaderCircle aria-hidden="true" size={17} className="progress-icon" />
                : <ArrowRight aria-hidden="true" size={17} />}
            </button>
            <p id="cloud-note" className="mt-2 text-xs leading-5 text-[var(--intindi-muted)]">
              Runs on your device when Nano is available. Otherwise, sends your excerpt to Gemini in the cloud.
            </p>
            {(availability === "downloadable" || availability === "downloading") && !busy && (
              <p className="mt-2 text-xs leading-5 text-[var(--intindi-muted)]">
                First time using Nano? Select Explain in Taglish to start the model download. It can take a few minutes. Stay online and keep this tab open.
              </p>
            )}
          </div>
        </section>

        <div id="answer-panel" className={`min-w-0 space-y-4 lg:block ${mobileView === "answer" ? "" : "hidden"}`}>
          <section
            ref={answerRef} tabIndex={-1}
            aria-labelledby="answer-heading"
            data-tour-highlight={tourStep === 2 && !result ? "" : undefined}
            className="workspace-panel min-h-36 scroll-mt-4 sm:min-h-48 rounded-2xl border border-[var(--intindi-border)] bg-[var(--intindi-sky)] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="answer-heading" className="font-bold">Quick explanation</h2>
              {result && (
                <span key={current.id} className="answer-source inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold">
                  {result.source === "on-device" ? <Cpu aria-hidden="true" size={14} /> : <Cloud aria-hidden="true" size={14} />}
                  {result.source === "on-device" ? "On-device • offline" : "Cloud"}
                </span>
              )}
            </div>
            <div aria-live="polite" className="mt-3">
              {result ? (
                <p key={current.id} className="answer-enter whitespace-pre-wrap leading-7 [overflow-wrap:anywhere]">
                  <ExplanationText text={result.text} />
                </p>
              ) : !progress && !error && (
                <p className="text-sm leading-6 text-[var(--intindi-muted)]">Your Taglish explanation will appear here.</p>
              )}
            </div>
            {fromHistory && result ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--intindi-muted)]">
                <p>Opened from History.</p>
                {configured && (
                  <button type="button" disabled={busy} onClick={() => void explain(true)}
                    className="pressable min-h-8 rounded px-1 font-semibold underline underline-offset-2 disabled:opacity-50">
                    Generate fresh
                  </button>
                )}
              </div>
            ) : result?.durationMs !== undefined && (
              <p className="mt-2 text-xs tabular-nums text-[var(--intindi-muted)]">Took {formatElapsed(result.durationMs)}</p>
            )}
            {result && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--intindi-border)] pt-3">
                {!walkthrough && progress?.stage !== "walkthrough" && error?.task !== "walkthrough" && (
                <button
                  type="button"
                  onClick={goDeeper}
                  data-tour-highlight={tourStep === 2 ? "" : undefined}
                  disabled={!!progress}
                  className="pressable inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--intindi-focus)] px-3 text-sm font-bold hover:bg-white disabled:opacity-50"
                >
                  Go deeper
                  <ArrowDown aria-hidden="true" size={16} />
                </button>
                )}
                <p className="basis-full text-xs leading-5 text-[var(--intindi-muted)]">Walkthroughs use Gemini in the cloud.</p>
              </div>
            )}
            {progress && progress.stage !== "walkthrough" && progress.stage !== "follow-up" && <TutorLoading progress={progress} startedAt={startedAt} onCancel={stopWaiting} />}
            {error && error.task !== "follow-up" && (
              <div className="answer-enter mt-3 rounded-xl border border-[#efc7b8] bg-[#fff4ee] p-3 text-[#763122]">
                <p role="alert" className="flex items-start gap-2 text-sm leading-6">
                  <CircleAlert aria-hidden="true" size={17} className="mt-1 shrink-0" />
                  {error.message}
                </p>
                <button
                  type="button"
                  onClick={error.task === "quick" ? () => void explain(true) : goDeeper}
                  className="pressable mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#efc7b8] px-3 text-sm font-semibold hover:bg-white"
                >
                  <RotateCcw aria-hidden="true" size={15} />
                  Try again
                </button>
              </div>
            )}
          </section>

          {progress?.stage === "walkthrough" && (
            <section aria-label="Walkthrough loading" className="answer-enter rounded-2xl border border-[var(--intindi-border)] bg-white p-4 sm:p-5">
              <h2 className="font-bold">Walkthrough</h2>
              <TutorLoading progress={progress} startedAt={startedAt} onCancel={stopWaiting} />
            </section>
          )}
          {walkthrough && (
            <section key={current.id} aria-live="polite" className="answer-enter space-y-4 rounded-2xl border border-[var(--intindi-border)] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold">Walkthrough</h2>
                  {walkthrough.durationMs !== undefined && (
                    <p className="mt-1 text-xs tabular-nums text-[var(--intindi-muted)]">Took {formatElapsed(walkthrough.durationMs)}</p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--intindi-sky)] px-2.5 py-1 text-xs font-semibold">
                  <Cloud aria-hidden="true" size={14} /> Cloud
                </span>
              </div>
              {walkthrough.lineNotes && <LineByLine excerpt={current.input} notes={walkthrough.lineNotes} onLocate={locateLine} />}
              <WalkthroughContent text={walkthrough.text} excerpt={current.input} onLocate={locateQuote} showPractice={!quiz} />
              {quiz && (
                <MiniQuiz questions={quiz} best={bestScore >= 0 ? bestScore : undefined}
                  onLocate={locateQuote}
                  onScore={score => {
                    if (score > bestScore) save({ ...current, quizBest: score });
                  }}
                />
              )}
            </section>
          )}
          {current && (
            <details key={`follow-up-${current.id}`} className="group scroll-mt-4 rounded-2xl border border-[var(--intindi-border)] bg-white">
              <summary data-tour-highlight={tourStep === 2 ? "" : undefined} className="pressable flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 text-sm font-bold hover:bg-[var(--intindi-sky)] [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-1.5 sm:gap-2"><MessageCircle aria-hidden="true" size={16} /> Ask a follow-up</span>
                <ChevronDown aria-hidden="true" size={16} className="disclosure-chevron shrink-0 group-open:rotate-180" />
              </summary>
              <div className="answer-enter space-y-4 border-t border-[var(--intindi-border)] p-4">
                {followUp && (
                  <div aria-live="polite" className="space-y-2.5 text-sm leading-6 [overflow-wrap:anywhere]">
                    <p className="ml-auto w-fit max-w-[90%] rounded-xl bg-[var(--intindi-paper)] px-3 py-2 font-medium">
                      <span className="sr-only">Your question: </span>{followUp.question}
                    </p>
                    <div className="rounded-xl bg-[var(--intindi-sky)] p-3">
                      <p className="whitespace-pre-wrap"><ExplanationText text={followUp.answer.text} /></p>
                      {followUp.answer.sourceQuote && (
                        <div className="mt-2 flex flex-wrap items-start gap-2 text-xs">
                          <span className="font-semibold">From your excerpt</span>
                          <code className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{followUp.answer.sourceQuote}</code>
                        </div>
                      )}
                      {followUp.answer.missingDetail && (
                        <p className="mt-2 text-xs"><strong>What would help:</strong> {followUp.answer.missingDetail}</p>
                      )}
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--intindi-muted)]">
                        <Cloud aria-hidden="true" size={13} /> Cloud
                        {followUp.answer.durationMs !== undefined && ` · Took ${formatElapsed(followUp.answer.durationMs)}`}
                      </p>
                    </div>
                  </div>
                )}
                <form
                  className="space-y-2"
                  onSubmit={event => {
                    event.preventDefault();
                    void askFollowUp();
                  }}
                >
                  <label htmlFor="follow-up-question" className="sr-only">Your question</label>
                  <textarea
                    id="follow-up-question"
                    value={question}
                    disabled={busy}
                    rows={2}
                    maxLength={maxFollowUpLength}
                    placeholder="What part is still unclear?"
                    aria-describedby="follow-up-privacy follow-up-limit"
                    className="block w-full resize-y rounded-lg border border-[var(--intindi-border)] bg-[var(--intindi-paper)] p-3 text-base lg:text-sm"
                    onChange={event => {
                      setQuestion(event.target.value);
                      if (error?.task === "follow-up") setError(null);
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p id="follow-up-privacy" className="text-xs leading-5 text-[var(--intindi-muted)]">
                      Sends your question, excerpt, and recent context to Gemini.
                    </p>
                    <button type="submit" disabled={!configured || busy || !question.trim() || followUpsLeft === 0}
                      className="pressable ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--intindi-apricot)] px-3 text-sm font-bold hover:bg-[#ffb678] disabled:opacity-50">
                      {error?.task === "follow-up" ? "Try again" : "Ask Gemini"}
                      <ArrowRight aria-hidden="true" size={15} />
                    </button>
                  </div>
                  <p id="follow-up-limit" role="status" className="text-xs text-[var(--intindi-muted)]">
                    {followUpsLeft > 0
                      ? `${followUpsLeft} of ${followUpLimit} follow-ups left in this ${followUpWindowMinutes}-minute window.`
                      : "You’ve reached the follow-up limit. Try again in a few minutes."}
                  </p>
                </form>
                {progress?.stage === "follow-up" && <TutorLoading progress={progress} startedAt={startedAt} onCancel={stopWaiting} />}
                {error?.task === "follow-up" && <p role="alert" className="text-sm text-[#763122]">{error.message}</p>}
              </div>
            </details>
          )}
        </div>
      </div>

      <section aria-labelledby="history-heading" className="mt-8 border-t border-[var(--intindi-border)] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="history-heading" className="flex items-center gap-2 font-bold">
            <History aria-hidden="true" size={17} /> History
          </h2>
          {history.length > 0 && (
            <button type="button" disabled={busy} aria-expanded={confirmClear}
              onClick={() => setConfirmClear(!confirmClear)}
              className="pressable inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold hover:bg-[var(--intindi-sky)] disabled:opacity-50">
              <Trash2 aria-hidden="true" size={15} /> Clear history
            </button>
          )}
        </div>
        <p role="status" className="mt-1 text-sm text-[var(--intindi-muted)]">
          {history.length > 0 ? "Your last five excerpts and answers are saved in this browser." : "No saved explanations."}
        </p>
        {historyError && <p role="status" className="mt-2 text-sm">{historyError}</p>}
        {confirmClear && history.length > 0 && (
          <div className="answer-enter mt-3 rounded-xl border border-[#efc7b8] bg-[#fff4ee] p-3">
            <p className="text-sm leading-6">Delete saved explanations, walkthroughs, and quiz scores from this browser?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setConfirmClear(false)}
                className="pressable min-h-10 rounded-lg border border-[#efc7b8] px-3 text-sm font-semibold hover:bg-white">Cancel</button>
              <button type="button" disabled={busy} onClick={clearHistory}
                className="pressable min-h-10 rounded-lg bg-[#763122] px-3 text-sm font-semibold text-white hover:bg-[#60271b] disabled:opacity-50">Delete history</button>
            </div>
          </div>
        )}
        {history.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--intindi-border)] overflow-hidden rounded-xl border border-[var(--intindi-border)] bg-white">
            {history.map(entry => (
              <li key={entry.id} className="history-row">
                <button
                  type="button"
                  disabled={!!progress}
                  aria-pressed={current?.id === entry.id}
                  className="pressable flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--intindi-sky)] focus-visible:outline-offset-[-3px] aria-pressed:bg-[var(--intindi-sky)] disabled:opacity-50"
                  onClick={() => {
                    selectExcerpt(entry.input, entry);
                    showAnswer(true);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{entry.input}</span>
                  <span className="text-xs font-medium text-[var(--intindi-muted)]">{entry.result.source === "on-device" ? "On-device" : "Cloud"}</span>
                  <ArrowRight aria-hidden="true" size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Faq expanded={faqExpanded} onToggle={() => setFaqExpanded(open => !open)} onReplayTour={replayTour} />
    </main>
  );
}
