// Firebase app initialization for Intindi.
// Docs: https://firebase.google.com/docs/web/setup
//
// Config comes from environment variables ONLY — never hardcode keys.
// Copy `.env.example` to `.env.local` and fill in your own Firebase project
// values (Firebase console > Project settings > Your apps > Web app).

import { initializeApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const PLACEHOLDER_PREFIX = "your-";

function isValueSet(value: string | undefined): boolean {
  return !!value && !value.startsWith(PLACEHOLDER_PREFIX);
}

/** True when the required Firebase config values are present (not placeholders). */
export function isFirebaseConfigured(): boolean {
  return (
    isValueSet(firebaseConfig.apiKey) &&
    isValueSet(firebaseConfig.projectId) &&
    isValueSet(firebaseConfig.appId)
  );
}

let app: FirebaseApp | null = null;

/**
 * Lazily initialize (and cache) the Firebase app.
 * Throws a clear, human-readable error when the config is missing,
 * so the UI can show a setup hint instead of a cryptic Firebase error.
 */
export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and fill in your Firebase project values (see README).",
    );
  }
  app = initializeApp(firebaseConfig);
  return app;
}

// TODO: App Check. The Firebase AI Logic guided setup enforces App Check
// automatically, and AI Logic calls from localhost will fail until a debug
// token is registered (Firebase console > Security > App Check > Apps >
// Manage debug tokens). See:
// https://firebase.google.com/docs/ai-logic/hybrid/web/get-started (Step 4)
// For the deployed app, configure a real App Check provider (reCAPTCHA
// Enterprise) in the Firebase console.
