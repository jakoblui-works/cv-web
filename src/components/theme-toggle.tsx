import { MoonIcon, SunIcon } from "lucide-react";
import { useState } from "react";
import { flushSync } from "react-dom";

import { Switch } from "@/components/ui/switch";

/** Must match the key read by the inline script in index.html. */
export const THEME_STORAGE_KEY = "theme";

const isDark = () => {
  return document.documentElement.classList.contains("dark");
};

const prefersReducedMotion = () => {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const ThemeToggle = () => {
  // index.html has already applied the stored or system theme before React mounts.
  const [dark, setDark] = useState(isDark);

  const apply = (next: boolean) => {
    // flushSync so the switch has moved before the view transition captures the new state.
    flushSync(() => setDark(next));
    document.documentElement.classList.toggle("dark", next);
  };

  const onCheckedChange = (next: boolean) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Storage can be blocked; the theme still applies for this page view.
    }

    // Crossfade the whole page; switch instantly where unsupported or unwanted.
    if (!document.startViewTransition || prefersReducedMotion()) {
      apply(next);
      return;
    }
    const transition = document.startViewTransition(() => apply(next));
    // A quick second toggle skips this animation; the theme is still applied.
    transition.ready.catch(() => {});
  };

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <SunIcon className="size-4" aria-hidden />
      <Switch
        checked={dark}
        onCheckedChange={onCheckedChange}
        aria-label="Dark theme"
      />
      <MoonIcon className="size-4" aria-hidden />
    </div>
  );
};
