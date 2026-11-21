# Intindi

> Understand code in Taglish.

Intindi is a tech tutor for Filipino dev students. Paste code or a documentation excerpt for a quick Taglish explanation. Choose **Go deeper** for a walkthrough and practice questions.

[Live app](https://intindi-hackathon.vercel.app/) · [FAQ](https://intindi-hackathon.vercel.app/#faq)

## Privacy & Accuracy

- **On-device • offline** means Gemini Nano generated the quick answer on your device.
- **Cloud** means Firebase AI Logic sent the excerpt to Gemini. **Go deeper** always uses the cloud. Remove passwords, tokens, and private data before pasting.
- Intindi can suggest why code fails. Verify the explanation with your own debugger, tests, or documentation. Walkthrough quotes are checked against your excerpt, while Gemini generates the explanations.

## Features

- **Quick explanation:** A short Taglish answer from Gemini Nano, with cloud fallback when Nano is unavailable and the browser is online.
- **Guided walkthrough:** A takeaway, source quotes you can locate in the editor, a worked example, and three practice questions with answers.
- **Local history:** Reopen recent explanations and completed walkthroughs in the same browser, even offline with the tab loaded.

## Input & Storage Limits

- Pasted text only, up to **6,000 characters** per request. Intindi does not fetch links or read files and screenshots.
- The latest **five** excerpts and their answers are saved in this browser’s site data. History does not sync across devices.

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
4. To test Nano, open Intindi in compatible desktop Chrome 139 or later. If needed, enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and relaunch. Stay online for the first model download.

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

[Apache License 2.0](LICENSE).
