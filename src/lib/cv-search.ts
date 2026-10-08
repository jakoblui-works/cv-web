import { z } from "zod";

/** What the user picked, as option ids. Ids are slugs and never contain commas. */
export type CvSelection = {
  titleId?: string;
  conceptIds: string[];
  skillIds: string[];
};

export type ValidCvSelection = CvSelection & {
  titleId: string;
  skillIds: [string, ...string[]];
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

const canonicalIds = (ids: Iterable<string>): string[] => {
  const trimmed = Array.from(ids, (id) => id.trim());
  return [...new Set(trimmed)].filter((id) => id !== "").sort();
};

const canonicalTitle = (titleId: string | undefined): string | undefined => {
  return titleId?.trim() || undefined;
};

const joinIds = (ids: string[]): string | undefined => {
  const canonical = canonicalIds(ids);
  return canonical.length > 0 ? canonical.join(SEPARATOR) : undefined;
};

const splitIds = (value: string | undefined): string[] => {
  return canonicalIds((value ?? "").split(SEPARATOR));
};

/** Trimmed, sorted, de-duplicated ids; a blank title becomes no title. */
export const canonicalSelection = (selection: CvSelection): CvSelection => {
  return {
    titleId: canonicalTitle(selection.titleId),
    conceptIds: canonicalIds(selection.conceptIds),
    skillIds: canonicalIds(selection.skillIds),
  };
};

/** The selection as search params; empty parts are left out so links stay short. */
export const toCvSearch = (selection: CvSelection): CvSearch => {
  const search: CvSearch = {
    title: canonicalTitle(selection.titleId),
    concepts: joinIds(selection.conceptIds),
    skills: joinIds(selection.skillIds),
  };
  return Object.fromEntries(
    Object.entries(search).filter(([, value]) => value !== undefined),
  );
};

/** Reads search params back into a canonical selection, ignoring empty or stray entries. */
export const fromCvSearch = (search: CvSearch): CvSelection => {
  return {
    titleId: canonicalTitle(search.title),
    conceptIds: splitIds(search.concepts),
    skillIds: splitIds(search.skills),
  };
};

/** Whether two selections would generate the same CV (order and duplicates don't matter). */
export const sameSelection = (a: CvSelection, b: CvSelection): boolean => {
  const x = toCvSearch(a);
  const y = toCvSearch(b);
  return (
    x.title === y.title && x.concepts === y.concepts && x.skills === y.skills
  );
};

/** Whether the selection can be generated: a title and at least one skill. */
export const isValidSelection = (
  selection: CvSelection,
): selection is ValidCvSelection => {
  const cleanSelection = canonicalSelection(selection);
  return (
    cleanSelection.titleId !== undefined && cleanSelection.skillIds.length > 0
  );
};
