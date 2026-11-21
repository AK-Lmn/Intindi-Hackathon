# Intindi brand kit

Intindi helps Filipino dev students make sense of code and English docs. Write like a classmate who can explain why the code works.

## Logo

[In Focus](logos/intindi-mark.svg) puts a lowercase i inside a pair of code brackets. Use the [horizontal lockup](logos/intindi-horizontal.svg) in app headers, on repo pages, and in video title cards. The [stacked lockup](logos/intindi-stacked.svg) fits square layouts. The [wordmark](logos/intindi-wordmark.svg) works in tight headers where the icon already identifies Intindi.

- Leave clear space equal to the square dot above the i.
- Keep the horizontal logo at least 108 CSS px wide. Use the mark by itself under 108 px and the [small cut](icons/favicon.svg) at 16 px.
- Use ink on light surfaces, [paper on ink](logos/intindi-horizontal-reverse.svg), or the [black lockup](logos/intindi-horizontal-black.svg) for single-ink work.
- Use the [apricot app tile](icons/app-icon.svg) as drawn. Keep its proportions and avoid shadows, outlines, and gradient fills.

## Color

| Color | Hex | Use |
| --- | --- | --- |
| Ink | #172C69 | Logo, body text, primary links |
| Paper | #FBF8F2 | Page background, reversed logo |
| Apricot | #FFC28F | Primary action and app tile |
| Sky | #E4EDFF | Quick explanation and source indicators |
| Muted ink | #4E5C78 | Supporting text on Paper |
| Border | #BECBE7 | Panel borders |
| Focus | #3158CC | Visible keyboard focus on light surfaces |

Use Ink text on Apricot and Sky. Keep source labels visible in text. [CSS tokens](tokens.css) are ready to copy.

## Type and layout

Use **Instrument Sans** for interface copy, with 700 for headings and 400 or 500 for body text. Use **IBM Plex Mono** for code. Both are optional design dependencies. System sans and monospace are the fallbacks. The logo lettering is drawn as paths.

Show the editor and quick explanation side by side when there is room. On narrow screens, the editor comes first. Use one bright primary action. Keep the answer source near the result and use length or color only as a secondary cue.

## Voice

Use English for the interface, pitch, and demo narration. Tutor answers use everyday Taglish. Keep technical terms like cache, callback, and array in English.

| Where | Copy |
| --- | --- |
| Intro | Understand code in Taglish. |
| Main action | Explain in Taglish |
| On-device answer | On-device • offline |
| Cloud follow-up | Go deeper |
| Offline follow-up | You’re offline. Connect to the internet to go deeper. |
| Example tutor answer | May local copy na ang browser. Kapag 304 ang response, it can reuse that copy without downloading the file again. |

Cloud inference sends the excerpt to Gemini. Say so next to the action. Keep the labels short and use the actual model name in setup instructions.

### Demo subtitle example

| Taglish answer | English subtitle |
| --- | --- |
| May local copy na ang browser. Kapag 304 ang response, it can reuse that copy without downloading the file again. | The browser already has a local copy. A 304 response tells it to reuse that copy without downloading the file again. |

Use the actual answer from the recording for the final subtitles.

[View the brand board](board.html).

## Icon exports

- [SVG favicon](icons/favicon.svg)
- [SVG app tile](icons/app-icon.svg)
- [180 px PNG](icons/intindi-180.png)
- [192 px PNG](icons/intindi-192.png)
- [512 px PNG](icons/intindi-512.png)

The board uses local font fallbacks when the specified typefaces are unavailable.
