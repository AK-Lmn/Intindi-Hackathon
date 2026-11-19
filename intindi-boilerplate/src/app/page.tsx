"use client";

// Intindi — Taglish tech tutor (starter UI).
// Paste code or an English doc excerpt, get it explained in Taglish.
// The AI call lives in src/lib/ai.ts and runs on-device (Gemini Nano) when
// possible, falling back to the cloud model otherwise.

import { useEffect, useState } from "react";
import {
  explainInTaglish,
  getOnDeviceStatus,
  type ExplainResult,
  type ExplainSource,
} from "@/lib/ai";
import { isFirebaseConfigured } from "@/lib/firebase";

const CODE_SAMPLE = `function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}`;

const DOC_SAMPLE = `A closure is a function that remembers the variables from the scope where it was created, even after that scope has finished executing. This lets the inner function access the outer function's variables later, whenever it is called.`;

const HISTORY_KEY = "intindi-history";
const HISTORY_LIMIT = 5;

interface HistoryItem {
  input: string;
  source: ExplainSource;
  at: string;
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function badgeFor(source: ExplainSource) {
  return source === "on-device"
    ? {
        label: "On-device • offline",
        className: "bg-emerald-100 text-emerald-800 border-emerald-300",
      }
    : {
        label: "Cloud",
        className: "bg-sky-100 text-sky-800 border-sky-300",
      };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<string>("unknown");

  useEffect(() => {
    setHistory(loadHistory());
    getOnDeviceStatus().then(setDeviceStatus).catch(() => undefined);
  }, []);

  function saveToHistory(item: HistoryItem) {
    const next = [item, ...loadHistory()].slice(0, HISTORY_LIMIT);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  }

  async function handleExplain() {
    setError("");
    setResult(null);
    setCopied(false);
    setLoading(true);
    setProgress("");
    try {
      const res = await explainInTaglish(input, setProgress);
      setResult(res);
      saveToHistory({ input: input.trim(), source: res.source, at: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "May nangyaring mali. Subukan ulit.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const configured = isFirebaseConfigured();
  const badge = result ? badgeFor(result.source) : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Intindi</h1>
        <p className="mt-1 text-zinc-600">
          Ipaliwanag sa Taglish — code at docs, sa salitang naiintindihan mo.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Starter para sa #BuildHybridAI 2026 • Firebase AI Logic (on-device + cloud)
        </p>
      </header>

      {!configured && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Firebase is not configured yet.</p>
          <p className="mt-1">
            Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> and fill in your
            Firebase project values. See the README for the setup steps.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <label htmlFor="input" className="mb-2 block text-sm font-semibold">
          I-paste ang code o English doc excerpt
        </label>
        <textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder={"Halimbawa:\nfunction debounce(fn, delay) { ... }"}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setInput(CODE_SAMPLE)}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
          >
            Halimbawa: code
          </button>
          <button
            type="button"
            onClick={() => setInput(DOC_SAMPLE)}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
          >
            Halimbawa: doc excerpt
          </button>
        </div>

        <button
          type="button"
          onClick={handleExplain}
          disabled={loading || !input.trim() || !configured}
          className="mt-4 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Iniisip…" : "Ipaliwanag sa Taglish"}
        </button>

        {loading && progress && (
          <p className="mt-3 text-center text-xs text-zinc-500" role="status">
            {progress}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
      </section>

      {result && badge && (
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span
              className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100"
            >
              {copied ? "Nakopya na!" : "Kopyahin"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.text}</p>
          <p className="mt-3 text-xs text-zinc-500">
            {result.source === "on-device"
              ? "Galing ito sa on-device model (Gemini Nano) — gumagana kahit walang internet."
              : "Galing ito sa cloud model — mas malalim na paliwanag, may mga halimbawa at practice questions."}
          </p>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-100/60 p-4 text-sm text-zinc-700">
        <p className="font-semibold">Pang-demo (wifi-off moment)</p>
        <p className="mt-1">
          I-off ang wifi, tapos i-click ang “Ipaliwanag sa Taglish”. Kung naka-download na
          ang on-device model sa Chrome, dapat gumana pa rin — at lalabas ang badge na{" "}
          <span className="font-semibold">“On-device • offline”</span>. I-on ulit ang wifi
          para sa mas malalim na cloud walkthrough.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          On-device status sa browser na ito:{" "}
          <span className="font-semibold">{deviceStatus}</span> (kailangan ng Chrome sa
          Desktop v139+ at naka-enable ang Prompt API flag — tingnan ang README).
        </p>
      </section>

      {history.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Huling mga paliwanag</h2>
          <ul className="space-y-2">
            {history.map((item, i) => (
              <li key={`${item.at}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    setInput(item.input);
                    setResult(null);
                    setError("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left text-sm hover:bg-zinc-100"
                >
                  <span className="block truncate font-mono text-xs text-zinc-600">
                    {item.input.slice(0, 80)}
                    {item.input.length > 80 ? "…" : ""}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {item.source === "on-device" ? "On-device • offline" : "Cloud"} •{" "}
                    {new Date(item.at).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 text-center text-xs text-zinc-400">
        Intindi — starter boilerplate, hindi pa ito ang final design.
      </footer>
    </main>
  );
}
