import { Outlet, createRootRoute } from "@tanstack/react-router";

import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <a
            href="https://jakoblui.com"
            className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-md bg-primary text-base font-extrabold tracking-tight text-primary-foreground"
            >
              JL
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Jakob Lui
            </span>
          </a>
          <ThemeToggle />
        </div>
      </header>
      <Outlet />
    </>
  );
}
