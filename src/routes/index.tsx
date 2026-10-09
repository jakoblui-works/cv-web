import { createFileRoute, useLocation } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useCvGeneration } from "@/api/cv";
import { ApiError } from "@/api/fetcher";
import { useCvGetOptions } from "@/api/generated/cv/cv";
import type { FormOptionsResponseOutput } from "@/api/generated/model";
import { CvForm, CvFormSkeleton } from "@/components/cv-form";
import { CvPdfPanel } from "@/components/cv-pdf-panel";
import { OptionsLoadError } from "@/components/options-load-error";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LARGE_SCREEN_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import {
  cvSearchSchema,
  fromCvSearch,
  isValidSelection,
  sameSelection,
  toCvSearch,
  type CvSelection,
} from "@/lib/cv-search";

const GenerateButton = ({ disabled }: { disabled: boolean }) => (
  <Button
    type="submit"
    size="lg"
    disabled={disabled}
    className="mt-4 min-w-40 self-center px-6 text-base [view-transition-name:cv-generate]"
  >
    <SparklesIcon aria-hidden />
    Generate
  </Button>
);

/** `CvEditor`'s layout while the options load, so the real form replaces it without moving. */
const CvEditorSkeleton = () => (
  <div className="flex flex-col gap-6">
    <CvFormSkeleton />
    <GenerateButton disabled />
  </div>
);

type CvEditorProps = {
  options: FormOptionsResponseOutput;
  committed: CvSelection;
  /** The generation for `committed` failed (the result panel says why and offers a retry). */
  failed: boolean;
};

const CvEditor = ({ options, committed, failed }: CvEditorProps) => {
  const navigate = Route.useNavigate();
  const [draft, setDraft] = useState<CvSelection>(committed);
  const canGenerate =
    isValidSelection(draft) && !sameSelection(draft, committed);

  const leavingEditingPage = !isValidSelection(committed);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canGenerate) return;
    // The router resets scroll to the top, which brings the result card (first on phones) into view.
    navigate({ search: toCvSearch(draft), viewTransition: leavingEditingPage });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <CvForm options={options} value={draft} onChange={setDraft} />
      <GenerateButton disabled={!canGenerate} />
      {failed && sameSelection(draft, committed) && (
        <p className="-mt-2 text-center text-sm text-destructive">
          Couldn&rsquo;t generate the CV.
        </p>
      )}
    </form>
  );
};

const HomeComponent = () => {
  const navigate = Route.useNavigate();
  const optionsQuery = useCvGetOptions({
    query: {
      // A 503 means the options aren't published yet, and a 4xx won't change on a retry,
      // so only network and other server errors are retried.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && (error.status < 500 || error.status === 503)) &&
        failureCount < 2,
    },
  });
  const search = Route.useSearch();
  const committed = fromCvSearch(search);

  const { generation, retry } = useCvGeneration(committed);
  const largeScreen = useMediaQuery(LARGE_SCREEN_QUERY);
  const inlinePdf = largeScreen && navigator.pdfViewerEnabled;
  const shareUrl =
    window.location.origin + useLocation({ select: (l) => l.href });

  const options = optionsQuery.data?.data;

  const editor = (
    <div className="flex flex-col gap-6 [view-transition-name:cv-editor]">
      <h1 className="text-2xl font-semibold">Tailored CV</h1>
      {optionsQuery.isPending && <CvEditorSkeleton />}
      {!optionsQuery.isPending && options === undefined && (
        <OptionsLoadError error={optionsQuery.error} />
      )}
      {options !== undefined && (
        <CvEditor
          key={JSON.stringify(toCvSearch(committed))}
          options={options}
          committed={committed}
          failed={generation.status === "failed"}
        />
      )}
    </div>
  );

  if (!isValidSelection(committed)) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 pt-24 pb-12 sm:pt-36">
        {editor}
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:h-[calc(100dvh-var(--spacing-header))] lg:grid-cols-[minmax(0,22rem)_auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <div className="lg:-m-1 lg:overflow-y-auto lg:p-1 lg:pt-16">{editor}</div>
      <Separator orientation="vertical" className="hidden lg:block" />
      <div className="order-first lg:order-0 [view-transition-name:cv-result]">
        <CvPdfPanel
          generation={generation}
          shareUrl={shareUrl}
          fileName={`Jakob-Lui-CV-${committed.titleId}.pdf`}
          inline={inlinePdf}
          onRetry={retry}
          // Back to the editing layout with an empty form.
          onClear={() => navigate({ search: {} })}
        />
      </div>
    </main>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: cvSearchSchema,
});
