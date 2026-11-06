import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ThoughtDrop Android app.
 *
 * The Next.js app is server-rendered (server actions, SSR, Supabase SSR cookies),
 * so it cannot be statically exported into the APK. The native shell therefore
 * loads the deployed site, while the native layer adds what a web page cannot
 * do on its own:
 *   - FCM push notifications (wired to the `notifications` table)
 *   - native share sheet
 *   - native splash / status bar / keyboard handling
 *   - deep links into ideas and profiles
 *
 * Production: no `server.url` is set, so the APK boots `capacitor-web/index.html`,
 * a branded loader that pings the API and hands off to the hosted app (with an
 * offline screen + retry). This keeps the "open" moment branded and recoverable.
 *
 * Local testing against the dev server:
 *   set CAPACITOR_SERVER_URL=http://<your-lan-ip>:3000  (cleartext is enabled automatically)
 */
const devServerUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.thoughtdrop.app",
  appName: "ThoughtDrop",
  webDir: "capacitor-web",
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          androidScheme: "https" as const,
          cleartext: devServerUrl.startsWith("http://"),
          allowNavigation: [devServerUrl],
        },
      }
    : {}),
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#0b0d12",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0b0d12",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#131620",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "alert", "sound"],
    },
  },
};

export default config;
