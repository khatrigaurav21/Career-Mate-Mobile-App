---
name: Expo storage compatibility
description: Runtime constraints for session persistence in this Expo app.
---

Native sessions must use Expo SecureStore. The Expo web preview does not reliably expose every SecureStore method, so web-only persistence needs a separate compatibility path.

**Why:** The web preview threw when calling SecureStore deletion even though the native package was installed correctly.

**How to apply:** Keep SecureStore for iOS and Android; use a browser-compatible storage fallback only when `Platform.OS === "web"`. When logging in, pass the newly verified token directly to the first authenticated profile request instead of relying on a later React state effect.