# Intindi — Taglish Tech Tutor

Starter boilerplate for **#BuildHybridAI 2026**.

**The idea:** a Filipino dev student pastes code or an English doc excerpt and
gets it explained in Taglish. The on-device model (Gemini Nano) gives a short,
plain Taglish explanation offline; the cloud model gives a full walkthrough
with examples + 3 practice questions. That on-device/cloud split is the whole
point of the hackathon (Firebase AI Logic hybrid inference).

> This is a **starter**, not a finished app. The UI is intentionally plain so
> you can make it your own. The AI wiring follows the official Firebase docs
> (linked below) — no guessed API names.

## Quick start

### 1. Create a Firebase project + enable AI Logic

1. Go to the [Firebase console](https://console.firebase.google.com/) and
   create a project (or pick an existing one).
2. Go to **AI Services > AI Logic** and click **Get started** to launch the
   guided setup.
3. When asked for a Gemini API provider, choose the **Gemini Developer API**
   (free to start, no billing needed).
4. Register a **Web app** in the project and copy its Firebase config.

Docs: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started

### 2. Set up Chrome for on-device inference

On-device inference only works in **Chrome on Desktop v139+**:

1. Update Chrome (`chrome://settings/help`).
2. Enable the flag `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.
3. Restart Chrome.
4. Optional: pre-download the on-device model — open DevTools > Console and
   run `await LanguageModel.create()` (check with
   `await LanguageModel.availability()` first). Otherwise the model downloads
   automatically on the first request.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Firebase web config values in `.env.local`. Never commit real
keys — `.env.local` is gitignored.

### 4. Install + run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### 5. Deploy to Vercel

```bash
npx vercel
```

Add the same `NEXT_PUBLIC_FIREBASE_*` values in the Vercel project settings
(Environment Variables) — the app reads them at build/run time.

## How the hybrid split works

Code: [`src/lib/ai.ts`](src/lib/ai.ts) — the only file that talks to Firebase AI.

| | On-device | Cloud |
| --- | --- | --- |
| Model | Gemini Nano (built into Chrome) | `gemini-3.5-flash-lite` (explicit in `inCloudParams`) |
| API | `getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE })` | `getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD, inCloudParams: { model } })` |
| Prompt | Short, plain Taglish explanation (3–5 sentences) | Full walkthrough + examples + 3 practice questions |
| Badge | “On-device • offline” (green) | “Cloud” (blue) |
| Needs internet? | No (once the model is downloaded) | Yes |

Flow in `explainInTaglish(input)`:

1. Call `deviceModel.initializeDeviceModel()` — this **must** run on a user
   gesture (the Explain button click), per the docs.
2. Try the on-device model with the short prompt. If it answers, return it
   with `source: "on-device"`.
3. If on-device throws (not Chrome 139+, model not downloaded, no Prompt API
   flag), fall back to the cloud model with the full prompt and return it with
   `source: "cloud"`.
4. The response's `inferenceSource` property (`"ON_DEVICE"` / `"IN_CLOUD"`)
   is read to label the result.

References:

- Get started, hybrid inference (Web):
  https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
- Configuration options, hybrid inference (Web):
  https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options
- Firebase AI Logic docs: https://firebase.google.com/docs/ai-logic

## Project structure

```
intindi-boilerplate/
├── package.json                 # Next 15, React 19, firebase, Tailwind v4
├── next.config.ts
├── postcss.config.mjs           # Tailwind v4 PostCSS plugin
├── tsconfig.json
├── .env.example                 # Placeholder Firebase config (no real keys)
├── src/
│   ├── lib/
│   │   ├── firebase.ts          # Firebase app init from env vars
│   │   └── ai.ts                # explainInTaglish() — hybrid on-device/cloud
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx             # Textarea, Explain button, result + badge, history
│       └── globals.css          # Tailwind import
└── README.md
```

## Submission checklist (BuildHybridAI 2026)

From the Devpost rules — make sure all of these are true before submitting:

- [ ] Public repo with an open-source license file (any license; Apache is
      preferred by the organizers).
- [ ] `Firebase AI Logic` is actually **called at runtime** in the code — an
      import alone doesn't count. `src/lib/ai.ts` does this.
- [ ] Demo video (max 3 minutes) on YouTube, showing the app working —
      including the wifi-off moment (on-device still works offline).
- [ ] Text description: how you used Firebase AI Logic, features, value
      proposition.
- [ ] Hosted project URL (Vercel) included — strongly encouraged.
- [ ] Submit by **30 Nov 2026, 5:00 PM ET** (1 Dec, 6:00 AM Manila).

## TODO (left for the build)

- [ ] **App Check on localhost.** The AI Logic guided setup enforces App
      Check automatically. If calls fail locally with an App Check error,
      register a debug token: Firebase console > Security > App Check > Apps >
      Manage debug tokens. See the get-started guide (Step 4). For the
      deployed app, configure a real App Check provider (reCAPTCHA Enterprise).
- [ ] **Verify on-device in Chrome 139+.** Confirm the on-device path works
      end-to-end (flag on, model downloaded) and the “On-device • offline”
      badge appears. Test the wifi-off demo on camera.
- [ ] **On-device system prompt.** The on-device model gets its instructions
      from the prompt text itself (single-turn generation). If you want a
      persistent system prompt on-device, use `onDeviceParams.createOptions.initialPrompts`
      (see the configuration-options docs) and test that Nano follows it.
- [ ] **Taglish language hint.** The on-device config example uses
      `expectedInputs: [{ type: "text", languages: ["en"] }]`. Taglish is not
      a documented Prompt API language code — the prompt text itself is in
      Taglish, which is what matters, but verify Nano answers in Taglish
      (not English) in your tests.
- [ ] **Design.** The UI is a plain starter — give it a real visual identity
      (the hackathon judges score Design as a full criterion).
- [ ] **History.** History is localStorage-only (last 5). Decide if you want
      Firestore persistence or per-user saved explanations.
- [ ] **License.** Add a `LICENSE` file (e.g. MIT or Apache 2.0) before
      submitting — the repo must be open source with a detectable license.
- [ ] **Demo video.** Record the ≤3 min YouTube demo (wifi-off moment
      included) and write the submission description.
