---
name: Career Mate UI boundaries
description: User-stated scope limits and navigation constraints for Career Mate visual changes.
---

For Career Mate UI restyling, leave `eas.json`, the plugins section of `app.json`, `lib/errorReporting.ts`, `components/ShareIntentHandler.tsx`, `app/+native-intent.tsx`, `context/AuthContext.tsx`, and the `request` / session-refresh code in `lib/api.ts` unchanged (the last two keep people signed in by renewing the 1-hour login token one refresh at a time; an edit there can sign every user out). Other components and app screen files may be restyled. The preferred navigation is three persistent tabs: Home, Evaluate, and Profile. Keep the BrandMark below Android's top safe area so it is not clipped by the notch. Keep text readable on phones: body text 16pt, card titles at least 16pt, and nothing (pills, captions, labels) below 12pt — the user has flagged tiny text before. Evaluate is a tab that stays mounted: shared jobs arrive as sharedUrl/sharedText + shareId params, so keep the effect that applies them on each new shareId.

**Why:** The user identified those files as build or feature wiring rather than UI, chose three tabs, and reported that the BrandMark was clipped on Android.

**How to apply:** For future Career Mate visual work, make UI-only edits outside the excluded files, preserve those three destinations, and maintain Android top-safe-area spacing. Change these constraints only if the user explicitly asks.
