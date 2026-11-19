// Hybrid AI for Intindi — Taglish explanations via Firebase AI Logic.
//
// Official docs (read these first):
// - Get started, hybrid inference (Web):
//   https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
// - Configuration options, hybrid inference (Web):
//   https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options
//
// How it works, per the docs:
// - `getAI(firebaseApp, { backend: new GoogleAIBackend() })` creates the
//   AI Logic service (Gemini Developer API backend).
// - `getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE })` uses the
//   on-device model (Gemini Nano, via Chrome's Prompt API) and THROWS if it
//   is unavailable — so we can fall back to the cloud ourselves.
// - `getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD, ... })`
//   always uses the cloud-hosted model.
// - `result.response.inferenceSource` is "ON_DEVICE" or "IN_CLOUD"
//   (JS SDK v12.5.0+).
// - `model.initializeDeviceModel()` MUST be called after/on a user interaction
//   (e.g. a button click) and before `generateContent()`.
// - On-device inference only supports single-turn text generation (no chat)
//   and requires Chrome on Desktop v139+ with the Prompt API flag enabled
//   (chrome://flags/#prompt-api-for-gemini-nano-multimodal-input).
// - The default cloud-hosted fallback model is `gemini-3.5-flash-lite`
//   (JS SDK v13.0.0+). We set it explicitly via `inCloudParams` below.

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  type GenerativeModel,
} from "firebase/ai";
import { getFirebaseApp } from "./firebase";

export type ExplainSource = "on-device" | "cloud";

export interface ExplainResult {
  text: string;
  source: ExplainSource;
}

// Cloud model used for the full walkthrough. Documented default fallback is
// `gemini-3.5-flash-lite` (JS SDK v13.0.0+); override here if you want a
// different Gemini model.
// Docs: https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options
const CLOUD_MODEL = "gemini-3.5-flash-lite";

/** Short, plain Taglish explanation — the on-device prompt (Gemini Nano). */
const ON_DEVICE_PROMPT = (input: string) =>
  `Ipaliwanag ito sa simpleng Taglish, maikli lang (3-5 pangungusap lang). Para ito sa isang Filipino computer science student. Kung code ito, sabihin kung ano ang ginagawa nito sa simpleng salita. Kung teksto ito, ibuod lang ang pinakamahalagang punto. Gumamit ng natural na Taglish (halo ng Tagalog at English, tulad ng pakikipag-usap sa kaklase). Huwag gumamit ng mahirap na salita.\n\nIpapaliwanag:\n${input}`;

/** Full walkthrough with examples + practice questions — the cloud prompt. */
const CLOUD_PROMPT = (input: string) =>
  `Ikaw ay isang matiyagang tutor para sa isang Filipino computer science student. Ipaliwanag ang sumusunod na code o teksto sa Taglish (natural na halo ng Tagalog at English, parang kaklase na nagtuturo). Istraktura ang sagot mo ng ganito:\n\n1. **Buod** — 2-3 pangungusap lang.\n2. **Hakbang-hakbang na paliwanag** — may mga halimbawa.\n3. **3 practice questions** — may sagot sa dulo.\n\nGumamit ng simpleng salita at iwasan ang jargon hangga't maaari.\n\nIpapaliwanag:\n${input}`;

let deviceModel: GenerativeModel | null = null;
let cloudModel: GenerativeModel | null = null;

/** Lazily create the two model instances (on-device + cloud). */
function getModels(): { deviceModel: GenerativeModel; cloudModel: GenerativeModel } {
  if (!deviceModel || !cloudModel) {
    const ai = getAI(getFirebaseApp(), { backend: new GoogleAIBackend() });

    // On-device only: throws when Gemini Nano is unavailable, so the caller
    // can fall back to the cloud model.
    deviceModel = getGenerativeModel(ai, {
      mode: InferenceMode.ONLY_ON_DEVICE,
    });

    // Cloud only, with the cloud model set explicitly.
    cloudModel = getGenerativeModel(ai, {
      mode: InferenceMode.ONLY_IN_CLOUD,
      inCloudParams: { model: CLOUD_MODEL },
    });
  }
  return { deviceModel, cloudModel };
}

function readText(result: Awaited<ReturnType<GenerativeModel["generateContent"]>>): string {
  return result.response.text()?.trim() ?? "";
}

function readSource(
  result: Awaited<ReturnType<GenerativeModel["generateContent"]>>,
  fallback: ExplainSource,
): ExplainSource {
  // `inferenceSource` is "ON_DEVICE" or "IN_CLOUD" (JS SDK v12.5.0+).
  // Read it defensively so a future SDK type change can't break the build.
  const raw = (result.response as { inferenceSource?: unknown }).inferenceSource;
  if (raw === "ON_DEVICE") return "on-device";
  if (raw === "IN_CLOUD") return "cloud";
  return fallback;
}

/**
 * Explain `input` in Taglish, trying on-device first (Gemini Nano) and
 * falling back to the cloud model when on-device is unavailable.
 *
 * Must be called from a user gesture (e.g. the Explain button click):
 * `initializeDeviceModel()` requires user activation.
 *
 * Returns the explanation plus where it ran, so the UI can show the
 * "On-device • offline" or "Cloud" badge.
 */
export async function explainInTaglish(
  input: string,
  onProgress?: (message: string) => void,
): Promise<ExplainResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Walang input — mag-paste muna ng code o teksto.");
  }

  const { deviceModel, cloudModel } = getModels();

  // 1. Try on-device first (Gemini Nano, via Chrome's Prompt API).
  try {
    onProgress?.("Tinitingnan kung available ang on-device model…");
    await deviceModel.initializeDeviceModel((fraction: number) => {
      onProgress?.(
        `Dina-download ang on-device model… ${Math.round(fraction * 100)}%`,
      );
    });

    const result = await deviceModel.generateContent(ON_DEVICE_PROMPT(trimmed));
    const text = readText(result);
    if (text) {
      return { text, source: readSource(result, "on-device") };
    }
    // Empty response — fall through to the cloud model.
  } catch (err) {
    // On-device unavailable (not Chrome 139+, model not downloaded, no
    // Prompt API flag, etc.) — fall back to the cloud model.
    // Logged for debugging; the user just sees the cloud badge instead.
    console.warn("On-device inference unavailable, falling back to cloud:", err);
  }

  // 2. Cloud fallback: full walkthrough with examples + practice questions.
  onProgress?.("Gumagamit ng cloud model…");
  const result = await cloudModel.generateContent(CLOUD_PROMPT(trimmed));
  const text = readText(result);
  if (!text) {
    throw new Error("Walang sagot mula sa cloud model. Subukan ulit.");
  }
  return { text, source: readSource(result, "cloud") };
}

/**
 * Check whether Chrome's on-device model (Gemini Nano) is available.
 * Uses the Prompt API's `LanguageModel.availability()`, as shown in the
 * Firebase get-started guide (Step 1).
 * Returns "unknown" when the API doesn't exist (non-Chrome browser, SSR).
 * Docs: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
 */
export async function getOnDeviceStatus(): Promise<
  "available" | "downloading" | "downloadable" | "unavailable" | "unknown"
> {
  try {
    if (typeof window === "undefined") return "unknown";
    const lm = (
      window as unknown as {
        LanguageModel?: { availability: () => Promise<string> };
      }
    ).LanguageModel;
    if (!lm?.availability) return "unknown";
    const status = await lm.availability();
    if (
      status === "available" ||
      status === "downloading" ||
      status === "downloadable" ||
      status === "unavailable"
    ) {
      return status;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}
