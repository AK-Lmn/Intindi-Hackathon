# Intindi — Base Plan

Plan for the BuildHybridAI 2026 entry. Taglish tech tutor for Filipino dev students.

## 1. The problem, not the feature

- **Who:** Filipino CS/dev students learning from English docs and code.
- **Problem:** English is the language of the docs, but Taglish is the language they think in. That gap slows learning, and existing explainers are English-only and cloud-only (need signal, send your stuff to a server).
- **Done:** a web app where a student pastes code or a doc excerpt and gets a clear Taglish explanation. On-device Nano gives a short explanation offline (the wifi-off demo); cloud gives a full walkthrough + examples + 3 practice questions. Submitted by Dec 1, 6:00 AM Manila: public repo with Firebase AI Logic actually called in code, demo video ≤3 min, write-up, hosted URL.
- **Out of scope:** accounts/auth, cloud-saved history, other languages (Taglish only), mobile apps (web only), photo/OCR input, chat mode (Nano is single-turn only), code execution.

## 2. Constraints

- **Timeline:** build Nov 23–30; Kane deadline Nov 26 sits in the middle; submit by Dec 1, 6:00 AM Manila.
- **Team:** Solo
- **Budget:** $0 — free tiers only (Firebase, Vercel).
- **Users:** judges + demo users; low traffic expected.
- **Privacy:** pasted code/docs stay on-device for the on-device path; no accounts; no tracking.
- **Non-functional:** must work offline for the on-device path; fast load; on-device requires desktop Chrome 139+ with the Prompt API flag; mobile gets the cloud fallback.

## 3. Data first

- **One entity: Explanation.** No users, no auth, no backend DB for MVP.
- **Type:** `Explanation { id, input, kind: 'code' | 'doc', shortTaglish, walkthrough?, questions?: string[], source: 'on-device' | 'cloud', createdAt }`
- **Storage:** localStorage (last 5). Firestore only if cloud history is added later — explicitly deferred.
- **Relationships:** none (flat list). Deliberate: no backend DB for MVP.

## 4. Flows

- Land → paste code/doc → Explain → on-device attempt (loading: "Checking on-device…") → short Taglish explanation + "On-device • offline" badge → "Go deeper" (cloud) → walkthrough + examples + 3 practice questions → saved to history → history list → reopen an old one.
- **Loading:** Nano init/download progress; generating spinner; cloud fallback notice.
- **Empty:** no history yet; empty input (button disabled).
- **Errors:** Nano unavailable → auto cloud fallback + note; cloud fails offline → "You're offline and on-device isn't available — check Chrome 139+ and the Prompt API flag"; input too long → guidance to trim.

## 5. Architecture + tradeoffs (ADRs)

- Single Next.js App Router app, no separate backend; Firebase AI Logic called client-side; hosted on Vercel.
- **ADR 1 — client-only vs server proxy:** client-only. On-device inference runs in the browser by design; one repo, one deploy, nothing to maintain in 7 days. Tradeoff: Firebase web config is public by design; App Check mitigates abuse; no server-side rate limiting (free-tier quotas apply).
- **ADR 2 — localStorage vs Firestore:** localStorage. Privacy (code stays on-device) + zero setup. Tradeoff: history is per-device; Firestore later if cloud history is wanted.
- **ADR 3 — two models vs one PREFER_ON_DEVICE:** two models (ONLY_ON_DEVICE + ONLY_IN_CLOUD). The two paths need different prompts (short vs full walkthrough), so separate instances. Tradeoff: slightly more code, but distinct prompts and badges work.

## 6. De-risk the unknowns (spikes — do Nov 23)

- **Spike 1:** get ONLY_ON_DEVICE working in Chrome 139+ (flag on), confirm `inferenceSource`, confirm cloud fallback. If Nano won't run, the on-device story dies — prove it day one.
- **Spike 2:** Taglish quality — Nano has no documented Taglish language code; test 3–5 real snippets and confirm it answers in Taglish.
- **Spike 3:** App Check debug token on localhost (setup gotcha).

## 7. Vertical slices (MVP first)

- **Slice 1 (MVP):** paste → on-device short Taglish explanation → badge. The demo's core.
- **Slice 2:** cloud fallback + "Go deeper" walkthrough + practice questions.
- **Slice 3:** history (localStorage) + one-click sample snippets + error/empty states.
- **Slice 4:** Vercel deploy + demo video + write-up + LICENSE.
- **Later:** Firestore cloud history, accounts, photo/OCR, mobile app, more languages, chat mode.

## 8. Quality

- **Testing:** manual matrix — Nano available vs unavailable; wifi off vs on; empty input; long input; code vs doc. No automated suite for MVP; checklist in README.
- **Deploys:** Vercel, preview on push; env vars in Vercel dashboard, never in the repo.
- **Observability:** none for MVP (no backend); user-facing errors in plain language; Firebase console for AI Logic usage/quota.
