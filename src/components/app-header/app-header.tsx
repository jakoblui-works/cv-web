import { SiteHeader, ThemeToggle } from "@jakoblui-works/shared-ui";
import { Link } from "@tanstack/react-router";

// The shared header as this site shows it, used by every page.
export const AppHeader = () => {
  return (
    <SiteHeader current="cv" homeLink={<Link to="/" />} className="bg-surface">
      <ThemeToggle />
    </SiteHeader>
  );
};
