import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { useCvGeneration } from "@/api/cv";
import { useCvGetOptions } from "@/api/generated/cv/cv";
import type { FormOptionsResponseOutput } from "@/api/generated/model";
import { CvForm } from "@/components/cv-form";
import { CvPdfPanel } from "@/components/cv-pdf-panel";
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

type CvEditorProps = {
  options: FormOptionsResponseOutput;
  committed: CvSelection;
};

const CvEditor = ({ options, committed }: CvEditorProps) => {
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
      <Button
        type="submit"
        size="lg"
        disabled={!canGenerate}
        className="mt-4 min-w-40 self-center px-6 text-base [view-transition-name:cv-generate]"
      >
        Generate
      </Button>
    </form>
  );
};

const HomeComponent = () => {
  const optionsQuery = useCvGetOptions();
  const search = Route.useSearch();
  const committed = fromCvSearch(search);

  const generation = useCvGeneration(committed);
  const largeScreen = useMediaQuery(LARGE_SCREEN_QUERY);
  // Browsers set to download PDFs never fire the iframe's load, so the inline PDF would never show.
  const inlinePdf = largeScreen && navigator.pdfViewerEnabled;

  const options =
    optionsQuery.data?.status === 200 ? optionsQuery.data.data : undefined;

  const editor = (
    <div className="flex flex-col gap-6 [view-transition-name:cv-editor]">
      <h1 className="text-2xl font-semibold">Tailored CV</h1>
      {optionsQuery.isPending && (
        <p className="text-muted-foreground">Loading options…</p>
      )}
      {!optionsQuery.isPending && options === undefined && (
        <p className="text-destructive">Couldn&rsquo;t load the CV options.</p>
      )}
      {options !== undefined && (
        <CvEditor
          key={JSON.stringify(toCvSearch(committed))}
          options={options}
          committed={committed}
        />
      )}
    </div>
  );

  // The committed selection only changes on load or Generate, so the layout does too.
  if (!isValidSelection(committed)) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 pt-24 pb-12 sm:pt-36">
        {editor}
      </main>
    );
  }

  return (
    // From lg up the result fills the viewport below the header, so the PDF fits on screen
    // next to the form and only the form column scrolls if it's taller.
    // Below lg the result card comes first, above the form.
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:h-[calc(100dvh-var(--spacing-header))] lg:grid-cols-[minmax(0,22rem)_auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <div className="lg:-m-1 lg:overflow-y-auto lg:p-1 lg:pt-16">{editor}</div>
      <Separator orientation="vertical" className="hidden lg:block" />
      <div className="order-first lg:order-0 [view-transition-name:cv-result]">
        <CvPdfPanel
          generation={generation}
          fileName={`Jakob-Lui-CV-${committed.titleId}.pdf`}
          inline={inlinePdf}
        />
      </div>
    </main>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: cvSearchSchema,
});
