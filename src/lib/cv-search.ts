import { z } from "zod";

/** What the user picked, as option ids. Ids are slugs and never contain commas. */
export type CvSelection = {
  titleId?: string;
  conceptIds: string[];
  skillIds: string[];
};

/**
 * Search params as the route accepts them: `?title=…&concepts=a,b&skills=c,d`.
 * Anything that isn't a string (missing, or a value the router JSON-parsed, like `?title=123`)
 * is dropped instead of failing the page.
 */
export const cvSearchSchema = z.object({
  title: z.string().optional().catch(undefined),
  concepts: z.string().optional().catch(undefined),
  skills: z.string().optional().catch(undefined),
});

/** The selection as URL search params. */
export type CvSearch = z.output<typeof cvSearchSchema>;

const SEPARATOR = ",";

function canonicalIds(ids: Iterable<string>): string[] {
  return [...new Set(ids)].filter((id) => id !== "").sort();
}

function joinIds(ids: string[]): string | undefined {
  const canonical = canonicalIds(ids);
  return canonical.length > 0 ? canonical.join(SEPARATOR) : undefined;
}

function splitIds(value: string | undefined): string[] {
  return canonicalIds((value ?? "").split(SEPARATOR).map((id) => id.trim()));
}

/** Sorted, de-duplicated ids; an empty title becomes no title. */
export function canonicalSelection(selection: CvSelection): CvSelection {
  return {
    titleId: selection.titleId || undefined,
    conceptIds: canonicalIds(selection.conceptIds),
    skillIds: canonicalIds(selection.skillIds),
  };
}

/** The selection as search params; empty parts are left out so links stay short. */
export function toCvSearch(selection: CvSelection): CvSearch {
  const search: CvSearch = {
    title: selection.titleId || undefined,
    concepts: joinIds(selection.conceptIds),
    skills: joinIds(selection.skillIds),
  };
  return Object.fromEntries(
    Object.entries(search).filter(([, value]) => value !== undefined),
  );
}

/** Reads search params back into a canonical selection, ignoring empty or stray entries. */
export function fromCvSearch(search: CvSearch): CvSelection {
  return {
    titleId: search.title?.trim() || undefined,
    conceptIds: splitIds(search.concepts),
    skillIds: splitIds(search.skills),
  };
}

/** Whether two selections would generate the same CV (order and duplicates don't matter). */
export function sameSelection(a: CvSelection, b: CvSelection): boolean {
  const x = toCvSearch(a);
  const y = toCvSearch(b);
  return (
    x.title === y.title && x.concepts === y.concepts && x.skills === y.skills
  );
}
