import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { useCvGetOptions } from "@/api/generated/cv/cv";
import type { FormOptionsResponseOutput } from "@/api/generated/model";
import { CvForm } from "@/components/cv-form";
import { Button } from "@/components/ui/button";
import {
  cvSearchSchema,
  fromCvSearch,
  sameSelection,
  toCvSearch,
  type CvSelection,
} from "@/lib/cv-search";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: cvSearchSchema,
});

type CvEditorProps = {
  options: FormOptionsResponseOutput;
  committed: CvSelection;
};

function CvEditor({ options, committed }: CvEditorProps) {
  const navigate = Route.useNavigate();
  const [draft, setDraft] = useState<CvSelection>(committed);
  const canGenerate =
    draft.titleId !== undefined &&
    draft.skillIds.length > 0 &&
    !sameSelection(draft, committed);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canGenerate) return;
    navigate({ search: toCvSearch(draft) });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <CvForm options={options} value={draft} onChange={setDraft} />
      <Button type="submit" disabled={!canGenerate} className="self-start">
        Generate
      </Button>
    </form>
  );
}

function HomeComponent() {
  const optionsQuery = useCvGetOptions();
  const search = Route.useSearch();
  const committed = fromCvSearch(search);

  const options =
    optionsQuery.data?.status === 200 ? optionsQuery.data.data : undefined;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
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
    </main>
  );
}
