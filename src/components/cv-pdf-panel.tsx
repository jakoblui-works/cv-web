import { DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import type { CvGeneration } from "@/api/cv";
import { getCvGetPdfUrl } from "@/api/generated/cv/cv";
import { CopyLinkField } from "@/components/copy-link-field";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

type CvPdfPanelProps = {
  generation: CvGeneration;
  shareUrl: string;
  fileName: string;
  inline: boolean;
};

const VIEWER_PARAMS = "#navpanes=0&pagemode=none&view=Fit";
const pageClassName = "min-h-0 w-full flex-1 rounded-md border";
const cardClassName =
  "flex flex-col items-center gap-4 rounded-md border p-6 text-center";

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
