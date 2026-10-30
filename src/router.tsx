import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter as createTanstackRouter, defaultStringifySearch } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { routeTree } from "./routeTree.gen";

// Shared by the browser (`main.tsx`) and the prerender (`prerender.tsx`), so the page hydrates
// against the same router it was rendered with.
export const createRouter = () => {
  // One client per router, so prerendering never shares a cache between pages.
  const queryClient = new QueryClient();
  return createTanstackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    stringifySearch: (search) => defaultStringifySearch(search).replaceAll("%2C", ","),
    Wrap: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        {children}
      </QueryClientProvider>
    ),
  });
};

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
