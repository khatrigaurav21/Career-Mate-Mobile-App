---
name: Career Mate UI boundaries
description: User-stated scope limits and navigation constraints for Career Mate visual changes.
---

For Career Mate UI restyling, leave `eas.json`, the plugins section of `app.json`, `lib/errorReporting.ts`, `components/ShareIntentHandler.tsx`, and `app/+native-intent.tsx` unchanged. Other components and app screen files may be restyled. The preferred navigation is three persistent tabs: Home, Evaluate, and Profile. Keep the BrandMark below Android's top safe area so it is not clipped by the notch.

**Why:** The user identified those files as build or feature wiring rather than UI, chose three tabs, and reported that the BrandMark was clipped on Android.

**How to apply:** For future Career Mate visual work, make UI-only edits outside the excluded files, preserve those three destinations, and maintain Android top-safe-area spacing. Change these constraints only if the user explicitly asks.
