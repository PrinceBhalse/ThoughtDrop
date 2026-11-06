"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { isAndroid, isNative, NATIVE_OAUTH_CALLBACK, pathFromUrl } from "@/lib/native";

/**
 * Native shell glue for the Android build.
 *
 *  - opens https://thoughtdrop.app/... links inside the app
 *  - routes the Android hardware Back button through the app history
 *  - registers the device with FCM and stores the token in public.push_tokens
 *
 * Renders nothing on the web.
 */
export default function NativeApp() {
  const router = useRouter();
  const pushReady = useRef(false);

  // Deep links, OAuth callback + hardware back button.
  useEffect(() => {
    if (!isNative()) return;

    let disposed = false;
    const listeners: Array<{ remove: () => Promise<void> }> = [];

    const handleUrl = async (url: string) => {
      if (url.startsWith(NATIVE_OAUTH_CALLBACK)) {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("code");
        const oauthError = parsed.searchParams.get("error_description");

        if (code) {
          const supabase = createClient();
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            router.replace("/");
            router.refresh();
          }
        } else if (oauthError) {
          console.warn("[native] oauth failed:", oauthError);
        }

        import("@capacitor/browser")
          .then(({ Browser }) => Browser.close())
          .catch(() => {});
        return;
      }

      const path = pathFromUrl(url);
      if (path) router.push(path);
    };

    (async () => {
      const { App } = await import("@capacitor/app");
      if (disposed) return;

      // Cold start from an App Link / OAuth callback: the URL is not emitted as
      // appUrlOpen, it only exists as the launch URL. Capacitor keeps returning
      // it, so record it and only handle it once.
      if (isAndroid()) {
        const launch = await App.getLaunchUrl();
        if (launch?.url) {
          const seen = localStorage.getItem("td:launch-url");
          if (seen !== launch.url) {
            localStorage.setItem("td:launch-url", launch.url);
            await handleUrl(launch.url);
          }
        }
      }

      listeners.push(
        await App.addListener("appUrlOpen", ({ url }) => {
          void handleUrl(url);
        })
      );

      listeners.push(
        await App.addListener("backButton", () => {
          if (window.history.length > 1) {
            router.back();
          } else {
            App.minimizeApp();
          }
        })
      );
    })().catch(() => {
      /* native plugins unavailable — nothing to do */
    });

    return () => {
      disposed = true;
      listeners.forEach((listener) => listener.remove().catch(() => {}));
    };
  }, [router]);

  // Push notification registration.
  useEffect(() => {
    if (!isNative()) return;

    const supabase = createClient();

    const storeToken = async (token: string, userId: string) => {
      const { error } = await supabase
        .from("push_tokens")
        .upsert(
          { user_id: userId, token, platform: "android" },
          { onConflict: "token" }
        );
      if (error) console.error("[native] failed to store push token:", error.message);
    };

    const register = async (userId: string) => {
      if (pushReady.current) return;
      pushReady.current = true;

      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Android 8+ drops notifications that target a channel that does not
        // exist, so create it before registering.
        if (isAndroid()) {
          await PushNotifications.createChannel({
            id: "default",
            name: "Activity",
            description: "Comments, replies, upvotes and new followers",
            importance: 4,
            visibility: 1,
            vibration: true,
            lights: true,
          });
        }

        let permission = await PushNotifications.checkPermissions();
        if (permission.receive !== "granted") {
          permission = await PushNotifications.requestPermissions();
        }
        if (permission.receive !== "granted") return;

        await PushNotifications.register();

        await PushNotifications.addListener("registration", (token) => {
          storeToken(token.value, userId);
        });
      } catch (error) {
        // Happens when google-services.json / Firebase is not configured yet.
        console.warn("[native] push registration unavailable:", error);
        pushReady.current = false;
      }
    };

    let authSubscription: { unsubscribe: () => void } | undefined;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) await register(user.id);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          register(session.user.id);
        }
      });

      authSubscription = subscription;
    })().catch((error) => {
      console.error("[native] push setup failed:", error);
    });

    return () => {
      authSubscription?.unsubscribe();
    };
  }, []);

  // Tapping a notification opens the idea / profile it points at.
  useEffect(() => {
    if (!isNative()) return;

    let disposed = false;
    let actionListener: { remove: () => Promise<void> } | undefined;

    (async () => {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      if (disposed) return;

      actionListener = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notification) => {
          const path = notification.notification.data?.path;
          if (typeof path === "string" && path.startsWith("/")) {
            router.push(path);
          }
        }
      );

      // Cold start: the notification that launched the app is still in the
      // tray. Route to it only if it was created moments ago, then clear it so
      // it does not re-open on the next launch.
      const delivered = await PushNotifications.getDeliveredNotifications();
      const latest = delivered?.notifications?.[0];
      const path = latest?.data?.path;
      if (typeof path === "string" && path.startsWith("/")) {
        const createdAt = Number(latest?.data?.createdAt ?? 0);
        if (!createdAt || Date.now() - createdAt < 60_000) {
          router.push(path);
        }
      }
      if (delivered?.notifications?.length) {
        await PushNotifications.removeAllDeliveredNotifications();
      }
    })().catch(() => {
      /* push plugin unavailable */
    });

    return () => {
      disposed = true;
      actionListener?.remove().catch(() => {});
    };
  }, [router]);

  return null;
}
