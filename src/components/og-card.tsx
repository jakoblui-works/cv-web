import { cn } from "@/lib/utils";

// Bar widths (% of the page) for the page's lines; every fifth line is a section heading.
const lines = [92, 84, 88, 60, 90, 78, 86, 54, 88, 80, 72, 90, 64, 84, 76];
// The lines drawn in emerald: the ones the picks tailored.
const tailored = new Set([2, 6, 9, 12]);

/** A CV page as grey bars, with the tailored lines in emerald. No real content. */
const Page = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "flex h-[600px] w-[460px] flex-col gap-4 overflow-hidden rounded-md bg-white p-10 shadow-2xl",
      className,
    )}
  >
    <div className="h-7 w-56 rounded bg-neutral-800" />
    <div className="h-3.5 w-40 rounded bg-neutral-400" />
    <div className="mt-3 mb-1 h-px bg-neutral-200" />
    {lines.map((width, i) => (
      <div
        key={i}
        className={cn(
          "h-3 rounded",
          i % 5 === 0 ? "mt-3 h-4 bg-neutral-700" : "bg-neutral-300",
          tailored.has(i) && "bg-primary-500",
        )}
        style={{ width: `${i % 5 === 0 ? 34 : width}%` }}
      />
    ))}
  </div>
);

/**
 * The link preview image (og:image), 1200×630, always dark: "Tailored CV" and the caption on the
 * left, a CV page tilting in from the right. Everything to read stays inside the central safe zone
 * and X's crop. Rendered to `public/og.png` by `pnpm og`.
 */
export const OgCard = () => {
  return (
    <div
      data-og-card
      className="dark relative h-[630px] w-[1200px] overflow-hidden bg-background text-foreground"
    >
      <Page className="absolute top-[110px] right-[70px] -rotate-[4deg]" />
      {/* A faint emerald edge, so the card doesn't turn into a black box in dark feeds. */}
      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary-400)_35%,transparent),inset_0_0_72px_color-mix(in_oklab,var(--color-primary-400)_12%,transparent)]" />

      <div className="relative flex h-full flex-col px-24 py-18">
        {/* The header's logo, without the menu. */}
        <div className="flex items-center gap-2 font-logo text-[28px] leading-none font-semibold tracking-[-0.03em]">
          <span className="notch inline-flex items-center rounded-lg bg-primary py-1 pr-4 pl-2 text-[24px] tracking-[-0.02em] text-primary-foreground">
            cv
          </span>
          <span>
            <span className="text-primary">.</span>jakoblui
          </span>
        </div>
        <div className="flex-1" />
        <h1 className="font-heading text-[150px] leading-[0.86] font-bold tracking-[-0.055em]">
          Tailored
          <span className="block text-primary">CV</span>
        </h1>
        <p className="mt-10 font-heading text-[34px] leading-none font-medium tracking-[-0.02em] text-muted-foreground">
          Pick a role and skills <span className="text-primary">→</span> get a
          PDF
        </p>
      </div>
    </div>
  );
};
