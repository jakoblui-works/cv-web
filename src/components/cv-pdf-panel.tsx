import { DownloadIcon, ExternalLinkIcon, RotateCwIcon, XIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import type { CvFailureReason, CvGeneration } from "@/api/cv";
import { getCvGetPdfUrl } from "@/api/generated/cv/cv";
import { CopyLinkField } from "@/components/copy-link-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

type CvPdfPanelProps = {
  generation: CvGeneration;
  shareUrl: string;
  fileName: string;
  inline: boolean;
  /** Starts the generation over with a fresh task. */
  onRetry: () => void;
  /** Clears the selection; offered instead of retrying when the selection itself is invalid. */
  onClear: () => void;
};

const VIEWER_PARAMS = "#navpanes=0&pagemode=none&view=Fit";
const pageClassName = "min-h-0 w-full flex-1 rounded-md border";
const cardClassName =
  "flex flex-col items-center gap-4 rounded-md border p-6 text-center";

const FAILURE_MESSAGES: Record<CvFailureReason, string> = {
  error: "Something went wrong while generating the CV.",
  "rate-limited": "Too many requests. Try again in a minute.",
  "timed-out": "Generating the CV is taking too long.",
  "invalid-selection":
    "Some selected items are no longer available. Clear the selection to start over.",
};

const ProcessingStatus = () => (
  <div className="flex flex-col items-center gap-3 text-muted-foreground">
    <Spinner className="size-6" />
    <p aria-live="polite">Generating CV…</p>
  </div>
);

const PagePlaceholder = (props: ComponentProps<"div">) => (
  <div className="absolute inset-0" {...props}>
    <Skeleton className="absolute inset-0 rounded-none" />
    <div className="absolute inset-0 flex items-center justify-center">
      <ProcessingStatus />
    </div>
  </div>
);

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

export const CvPdfPanel = ({
  generation,
  shareUrl,
  fileName,
  inline,
  onRetry,
  onClear,
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
    // Retrying an invalid selection would fail again, so it offers to start over instead.
    const action =
      generation.reason === "invalid-selection" ? (
        <Button variant="outline" onClick={onClear}>
          <XIcon aria-hidden />
          Clear selection
        </Button>
      ) : (
        <Button variant="outline" onClick={onRetry}>
          <RotateCwIcon aria-hidden />
          Try again
        </Button>
      );
    const content = (
      <>
        <p role="alert" className="text-destructive">
          {FAILURE_MESSAGES[generation.reason]}
        </p>
        {action}
      </>
    );
    return inline ? (
      <div className="flex h-full flex-col">
        <div
          className={`${pageClassName} flex flex-col items-center justify-center gap-4 p-6 text-center`}
        >
          {content}
        </div>
      </div>
    ) : (
      <div className={cardClassName}>{content}</div>
    );
  }

  const pdfUrl = getCvGetPdfUrl(generation.digest);
  const linkClassName = buttonVariants({
    variant: inline ? "outline" : "default",
    size: inline ? "default" : "lg",
  });
  const links = (
    <div
      className={
        inline ? "flex shrink-0 gap-2" : "grid w-full grid-cols-2 gap-2"
      }
    >
      <a
        href={pdfUrl}
        target="_blank"
        rel="noreferrer"
        className={linkClassName}
      >
        <ExternalLinkIcon aria-hidden />
        Open<span className="sr-only"> PDF</span>
      </a>
      <a href={pdfUrl} download={fileName} className={linkClassName}>
        <DownloadIcon aria-hidden />
        Download<span className="sr-only"> PDF</span>
      </a>
    </div>
  );

  if (!inline) {
    return (
      <div className={cardClassName}>
        <p className="font-medium">CV is ready.</p>
        <CopyLinkField url={shareUrl} className="text-left" />
        {links}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <CopyLinkField url={shareUrl} className="min-w-0 flex-1" />
        {links}
      </div>
      {/* Keyed by the PDF, so a new CV starts hidden again until it has loaded. */}
      <CvPdfFrame key={pdfUrl} src={`${pdfUrl}${VIEWER_PARAMS}`} />
    </div>
  );
};
