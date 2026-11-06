import { Capacitor } from "@capacitor/core";

/**
 * Custom-scheme deep link the Android OAuth flow returns to. Must also be
 * allow-listed in Supabase → Authentication → URL Configuration.
 */
export const NATIVE_OAUTH_CALLBACK = "com.thoughtdrop.app://login-callback";

/**
 * Thin wrapper around Capacitor so the rest of the app can branch on the
 * runtime platform without importing native plugins into the web bundle.
 */
export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function nativePlatform(): string {
  try {
    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
}

export function isAndroid(): boolean {
  return nativePlatform() === "android";
}

/**
 * Deep links opened while the app is running (https://thoughtdrop.app/idea/123).
 * Returns the in-app path, or null when the URL is not ours.
 */
export function pathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`;
    return path && path !== "/" ? path : "/";
  } catch {
    return null;
  }
}
