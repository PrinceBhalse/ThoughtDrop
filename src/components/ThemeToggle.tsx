"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

// Hydration-safe "is the client mounted" check without setState in an effect.
const subscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

export default function ThemeToggle() {
  const hydrated = useHydrated();
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (!hydrated) {
    return (
      <button className="glass-button p-2 rounded-full" aria-label="Theme toggle">
        <Monitor className="w-5 h-5" />
      </button>
    );
  }

  const themes = [
    { value: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
    { value: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
  ] as const;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => {
          const current = themes.findIndex(t => t.value === theme);
          const next = themes[(current + 1) % themes.length];
          setTheme(next.value);
        }}
        className="glass-button p-2 rounded-full"
        aria-label={`Current theme: ${theme}. Click to change.`}
      >
        {themes.find(t => t.value === resolvedTheme)?.icon || <Monitor className="w-5 h-5" />}
      </button>
    </div>
  );
}