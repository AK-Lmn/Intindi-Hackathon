![Intindi logo](src/app/icon.svg)

# Intindi

**Understand code in Taglish.**

A tech tutor for Filipino dev students, built for the [KaneCLI Online Hackathon](https://www.kaneclihack.sh/).

[↗ Open the live app](https://intindi-hackathon.vercel.app/) · [ⓘ FAQ](https://intindi-hackathon.vercel.app/#faq)

## How to use

1. **Add a snippet.** Paste code or a docs excerpt, or select **Sample code** or **Sample docs**. Intindi detects common programming languages in your browser when the syntax gives it enough context.
2. **Get a quick answer.** Select **Explain in Taglish**. The source badge tells you where the answer was generated, and the timer shows how long it took.
3. **Work through an example.** Select **Go deeper** while online. Open **Line by line** for Taglish notes on the first 16 non-blank lines. Try the three-question **Mini quiz** for feedback, source references, and a personal best saved with your history. Score and retry it offline once loaded. Older walkthroughs still show **Practice answers**.
4. **Ask a follow-up.** While online, open **Ask a follow-up** and ask about the current snippet. Gemini gets your question, excerpt, and recent answer context. The thread clears when you change excerpts or reload.
5. **Pick up where you left off.** Select a saved explanation in **History** to reopen it in the same browser. Use **Clear history** to remove saved answers, walkthroughs, and quiz scores.

### Try it offline

Open the app in compatible desktop Chrome while online. If Gemini Nano needs a first-time download, paste a snippet and select **Explain in Taglish**. Give the download a few minutes and keep the tab open. Once the app reports **Gemini Nano: available**, switch the loaded tab offline and submit another snippet. Look for **On-device • offline**.

## How it works

| Mode | What you get |
| --- | --- |
| **On-device • offline** | A short Taglish explanation from Gemini Nano in compatible desktop Chrome. |
| **Cloud** | A short Gemini explanation when Nano is unavailable and you're online. |
| **Go deeper** | A cloud walkthrough with source quotes, a worked example, and three practice questions. |

## Privacy & Accuracy

- Offline inference keeps the excerpt on your device. Cloud requests send it to Gemini through Firebase AI Logic. Remove passwords, tokens, and private data before pasting.
- Click a uniquely matching quote in a walkthrough to select it in your excerpt. Intindi checks that the quoted text exists in the source. Gemini generates the explanation, so verify important claims with tests or docs.

## Input & Storage Limits

- Pasted text only, up to **6,000 characters** per request. Intindi does not fetch links or read files and screenshots.
- Follow-ups allow up to **five requests per five minutes** in the browser. The local cap is a usage guardrail. Firebase App Check and Firebase AI Logic quotas protect the cloud API.
- The latest **five** excerpts and their answers are saved in this browser’s site data. Saved walkthroughs can be reopened offline while the app is loaded. History does not sync across devices.

## Architecture

- **Next.js 15 App Router, React, and TypeScript** for the app.
- **Tailwind CSS and Lucide** for the interface.
- **Firebase AI Logic** for Gemini Nano and cloud Gemini. A separate Firebase app instance handles Nano requests. Production App Check initializes when a cloud request needs it.
- **Browser local storage** for explanation history.

## Installation & Local Development

1. In Firebase, register a web app and enable **Firebase AI Logic** with the **Gemini Developer API**.
2. Copy [`.env.example`](.env.example) to `.env.local`. Fill in the Firebase web API key, project ID, and app ID.

   ```sh
   cp .env.example .env.local
   npm ci
   npm run dev
   ```

   In PowerShell, use `Copy-Item .env.example .env.local` for the first command. Open [localhost:3000](http://localhost:3000/).

3. To test cloud calls locally, trigger **Go deeper** or a cloud fallback. Register the debug token from DevTools under **Firebase Console → App Check → Apps → Manage debug tokens**, then retry. Keep the token private.
4. To test Nano, open Intindi in compatible desktop Chrome 139 or later. If needed, enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and relaunch. If Nano is downloadable, select **Explain in Taglish** with a snippet to start the download. Give it a few minutes and keep the tab open and online until it finishes. The first answer can take longer because the timer includes the download.

For production, set the environment variables on your host. Create a score-based reCAPTCHA Enterprise key for the deployed hostname, register it with Firebase App Check, and set `NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY` before building.

[Firebase hybrid web setup](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) · [App Check debug provider](https://firebase.google.com/docs/app-check/web/debug-provider) · [Production App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)

## Testing

```sh
npm run typecheck
npm run build
```

- With Nano ready, take the loaded tab offline and submit `[10, 20, 30].reduce((sum, price) => sum + price, 0)`. Check for a Taglish answer with a total of `60` and the **On-device • offline** badge.
- Click **Go deeper** offline. The quick answer should stay visible with connection guidance. Reconnect and retry. Check for the **Cloud** badge, source quotes, and three practice questions.
- In a browser without Nano, use **Sample docs** online and check for the **Cloud** badge. Reopen the saved explanation from History.

## Known Limitations

- Offline inference requires desktop Chrome with the Nano model already downloaded. Keep the app tab open, since reopening or refreshing may need internet.
- The interface is English and answers target Taglish. English docs, JavaScript, and SQL have been tested. Other inputs may work, with varying accuracy.
- Intindi does not execute code or verify fixes. Include relevant definitions, inputs, and the exact error message when asking about broken code.

## License

[MIT License](LICENSE).
