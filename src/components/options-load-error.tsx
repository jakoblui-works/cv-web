import { ApiError } from "@/api/fetcher";

/** Why the CV options couldn't be loaded. A 503 means the api hasn't published them yet. */
export const OptionsLoadError = ({ error }: { error: unknown }) => (
  <p role="alert" className="text-destructive">
    {error instanceof ApiError && error.status === 503
      ? "CV options aren’t available yet. Please check back later."
      : "Couldn’t load the CV options."}
  </p>
);
