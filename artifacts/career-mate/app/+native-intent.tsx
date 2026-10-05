import { getShareExtensionKey } from 'expo-share-intent';

// A share can open the app through a deep link the router doesn't know.
// Send it to the home screen; ShareIntentHandler picks the share up there.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) return '/';
    return path;
  } catch {
    return '/';
  }
}
