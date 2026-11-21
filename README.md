# Intindi

Paste code or an English documentation excerpt for a short Taglish explanation. Slice 1 tries Gemini Nano on the device. If Nano cannot initialize, the same short prompt goes to Firebase AI Logic when online. The badge uses the SDK response source. The app keeps the last five excerpts and explanations in local browser storage, including completed walkthroughs.

## Run locally

1. In the Firebase console, use a Spark project. Enable AI Logic with the Gemini Developer API and register a web app.
2. Copy `.env.example` to `.env.local`. Set the web API key, project ID and app ID. The reCAPTCHA Enterprise site key is for non-debug builds.
3. Install with `npm ci` and start with `npm run dev`. Open http://localhost:3000.
4. During localhost development, the Firebase App Check SDK generates a debug token on initialization. Click Explain, copy the token from Chrome DevTools directly into Firebase Console (App Check, Apps, Manage debug tokens), then retry. Keep the token private.
5. In desktop Chrome 139 or later, enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and relaunch. Stay online for the first model download. Keep the loaded page open for offline inference.

[Firebase hybrid web setup](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) · [App Check debug provider](https://firebase.google.com/docs/app-check/web/debug-provider)

## Manual acceptance checks

Use these four inputs separately. For each, record the actual answer and badge. Pass when the answer correctly explains the excerpt in conversational Filipino and English, in 2–4 sentences.

| Input | Meaning to check |
| --- | --- |
| `[1, 2, 3, 4].filter(n => n % 2 === 0)` | Keeps 2 and 4 |
| `SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id;` | Counts orders per customer |
| `const next = items.map(item => ({ ...item, done: true }));` | Creates a new array of copies with done set to true |
| An HTTP 304 response lets a client reuse its cached representation after revalidation. | Client reuses cached content after checking with the server |

- Warm Nano online. Each local result must show **On-device • offline**.
- With the loaded page open, set DevTools Network to Offline. Submit a different excerpt and check for a fresh local answer.
- Open the app online in a browser without the Prompt API. Expect a cloud fallback notice, a short answer, and **Cloud**.
- Repeat without internet. Expect offline guidance and no result badge.
- Try whitespace and more than 6,000 characters. Explain stays disabled.

## Observed on November 19, 2026

Chrome 157.0.8103.79 on Windows reported Nano available. Using temporary Firebase demo identifiers and the loaded tab in DevTools Offline mode, the final prompt produced a fresh two-sentence Taglish answer for each of the four inputs above. All four responses carried the SDK on-device source. The filter answer explained the even-number rule. The SQL answer counted orders by customer. The map answer described copying properties and setting done. The documentation answer explained cached reuse after a 304.

One sentence from the SQL run: “`GROUP BY customer_id` ang nagpapangkat ng orders sa bawat customer, at ang `COUNT(*)` naman ay kinukuha ang bilang ng orders sa bawat grupo.”

The live Spark project is `intindi-45f74`. Firebase AI Logic and the Gemini Developer API are enabled. The local Chrome debug token is registered in Firebase App Check. With the Prompt API temporarily removed from the test tab, Firebase AI Logic returned HTTP 200 with a short Taglish explanation of HTTP 304 and the app showed **Cloud**. The request carried an App Check header. The Firebase console reported Basic - Unenforced during verification.

On November 21, 2026, Playwright verified offline inference with the live project configuration in a dedicated Chrome profile. After the Nano download, the browser reported offline before and after submission. Intindi showed **On-device • offline** and a Taglish explanation that correctly gave 60 for the `reduce()` sum. The answer also used misleading wording about subtraction.

## Go deeper

After a short explanation, select **Go deeper** to send the same excerpt to Gemini for a Taglish walkthrough, examples, and three practice questions with answers. The walkthrough displays a **Cloud** badge.

- Online, check for numbered steps, examples, three questions, and an answer section.
- Offline after a short answer, select **Go deeper**. Check that the internet connection message appears and the short answer remains visible.
- Edit the excerpt after getting a walkthrough. Check that the previous results clear.

Live verification in the dedicated Chrome profile passed after registering its localhost debug token for the Intindi web app. App Check and AI Logic returned HTTP 200. The live `reduce()` walkthrough showed the Cloud badge, numbered steps, two examples, and three practice questions with answers. The response repeated some prompt instructions in its headings.

## License

Intindi is available under the [Apache License 2.0](LICENSE).
