import { SiteHeader } from "@jakoblui-works/shared-ui";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

import { ThemeToggle } from "@/components/theme-toggle";

const RootComponent = () => {
  return (
    <>
      <SiteHeader current="cv" homeLink={<Link to="/" />} className="bg-surface">
        <ThemeToggle />
      </SiteHeader>
      <Outlet />
    </>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
