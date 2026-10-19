import { Outlet, createRootRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";

const RootComponent = () => {
  return (
    <>
      <SiteHeader />
      <Outlet />
    </>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
