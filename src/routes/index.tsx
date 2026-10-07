import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useCvGetOptions } from "@/api/generated/cv/cv";
import { CvForm, type CvSelection } from "@/components/cv-form";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const emptySelection: CvSelection = { conceptIds: [], skillIds: [] };

function HomeComponent() {
  const optionsQuery = useCvGetOptions();
  const [selection, setSelection] = useState<CvSelection>(emptySelection);

  const options =
    optionsQuery.data?.status === 200 ? optionsQuery.data.data : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Tailored CV</h1>
      {optionsQuery.isPending && (
        <p className="text-muted-foreground">Loading options…</p>
      )}
      {!optionsQuery.isPending && options === undefined && (
        <p className="text-destructive">Couldn&rsquo;t load the CV options.</p>
      )}
      {options !== undefined && (
        <CvForm options={options} value={selection} onChange={setSelection} />
      )}
    </main>
  );
}
