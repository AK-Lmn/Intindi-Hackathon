# Intindi · Devpost write-up

**Tagline:** Understand code in Taglish, even offline.

## Inspiration

Most programming docs are in English. When Filipino students study together, they often explain the tricky parts in Taglish. Intindi brings that conversation to the snippet you’re stuck on.

## What it does

Paste code or a docs excerpt and get a short Taglish explanation. **Go deeper** opens a cloud walkthrough with source quotes, one worked example, and three practice questions. Tap a unique source quote to find it in the editor. Your last five explanations stay in your browser and can be reopened offline.

## How we built it

Intindi is a Next.js and TypeScript app. Firebase AI Logic runs the short explanation through Gemini Nano on compatible desktop Chrome browsers. The same request can fall back to Gemini in the cloud when Nano is unavailable. The result badge comes from the SDK’s reported inference source. App Check protects the hosted cloud route.

The longer walkthrough uses Gemini structured output. Intindi checks that each quoted fragment appears in the original excerpt before showing it. The model still generates the explanations and answers.

## What we learned

Nano sometimes answered entirely in English or used formal Tagalog. Examples of everyday Taglish worked better than a language label alone. We tested the offline path in a dedicated Chrome profile with networking disabled, then confirmed that the cloud path still worked when Nano was unavailable.

## Demo notes

Keep the loaded tab open for offline inference. Desktop Chrome needs a compatible, downloaded Nano model. Cloud fallback and **Go deeper** require internet access.

- [Source code](https://github.com/AK-Lmn/Intindi-Hackathon)
- Hosted app and YouTube link go in the Devpost links once verified.
