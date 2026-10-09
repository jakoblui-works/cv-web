import { DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import type { CvGeneration } from "@/api/cv";
import { getCvGetPdfUrl } from "@/api/generated/cv/cv";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

type CvPdfPanelProps = {
  generation: CvGeneration;
  /** File name the Download link saves the PDF as. */
  fileName: string;
  /**
   * Show the PDF in the page. Phone browsers don't show inline PDFs reliably, and some browsers
   * download PDFs instead, so without it the panel is a compact card with only the links.
   */
  inline: boolean;
};

/**
 * Viewer open parameters for the inline PDF: hide the bookmarks sidebar (Chrome: `navpanes`,
 * Firefox: `pagemode`) and fit the whole page in the frame.
 */
const VIEWER_PARAMS = "#navpanes=0&pagemode=none&view=Fit";

/** Fills the panel's height, so the whole PDF fits on screen next to the form. */
const pageClassName = "min-h-0 w-full flex-1 rounded-md border";

const cardClassName =
  "flex flex-col items-center gap-4 rounded-md border p-6 text-center";

const ProcessingStatus = () => (
  <div className="flex flex-col items-center gap-3 text-muted-foreground">
    <Spinner className="size-6" />
    <p aria-live="polite">Generating CV…</p>
  </div>
);

/** The processing look of the inline page: a skeleton with the status on top. */
const PagePlaceholder = (props: ComponentProps<"div">) => (
  <div className="absolute inset-0" {...props}>
    <Skeleton className="absolute inset-0 rounded-none" />
    <div className="absolute inset-0 flex items-center justify-center">
      <ProcessingStatus />
    </div>
  </div>
);

/**
 * The inline PDF, kept invisible over the processing placeholder until the viewer has loaded,
 * so the viewer building itself (blank frame, toolbar, then the page) never shows.
 */
const CvPdfFrame = ({ src }: { src: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`${pageClassName} relative overflow-hidden`}>
      <PagePlaceholder aria-hidden />
      <iframe
        src={src}
        title="Generated CV"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 size-full bg-muted motion-safe:transition-opacity motion-safe:duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};

/** The generated CV: a processing state, then Open and Download links and, if `inline`, the PDF. */
export const CvPdfPanel = ({
  generation,
  fileName,
  inline,
}: CvPdfPanelProps) => {
  if (generation.status === "idle") return null;

  if (generation.status === "processing") {
    return inline ? (
      <div className="flex h-full flex-col">
        <div className={`${pageClassName} relative overflow-hidden`}>
          <PagePlaceholder />
        </div>
      </div>
    ) : (
      <div className={cardClassName}>
        <ProcessingStatus />
      </div>
    );
  }

  if (generation.status === "failed") {
    const message = <>Couldn&rsquo;t generate the CV.</>;
    return inline ? (
      <div className="flex h-full flex-col">
        <div
          role="alert"
          className={`${pageClassName} flex items-center justify-center p-6 text-center text-destructive`}
        >
          {message}
        </div>
      </div>
    ) : (
      <div role="alert" className={`${cardClassName} text-destructive`}>
        {message}
      </div>
    );
  }

  const pdfUrl = getCvGetPdfUrl(generation.digest);
  const linkClassName = buttonVariants({
    variant: inline ? "outline" : "default",
    size: inline ? "default" : "lg",
    className: inline ? undefined : "w-full",
  });
  const links = (
    <div
      className={inline ? "flex flex-wrap gap-2" : "flex w-full flex-col gap-2"}
    >
      <a
        href={pdfUrl}
        target="_blank"
        rel="noreferrer"
        className={linkClassName}
      >
        <ExternalLinkIcon aria-hidden />
        Open PDF
      </a>
      <a href={pdfUrl} download={fileName} className={linkClassName}>
        <DownloadIcon aria-hidden />
        Download PDF
      </a>
    </div>
  );

  if (!inline) {
    return (
      <div className={cardClassName}>
        <p className="font-medium">CV is ready.</p>
        {links}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {links}
      {/* Keyed by the PDF, so a new CV starts hidden again until it has loaded. */}
      <CvPdfFrame key={pdfUrl} src={`${pdfUrl}${VIEWER_PARAMS}`} />
    </div>
  );
};
