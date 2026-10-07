import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";

import {
  canonicalSelection,
  fromCvSearch,
  sameSelection,
  toCvSearch,
  type CvSelection,
} from "./cv-search";

const id = fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/);

const selection = fc.record({
  titleId: fc.option(id, { nil: undefined }),
  conceptIds: fc.array(id, { maxLength: 8 }),
  skillIds: fc.array(id, { maxLength: 8 }),
});

/** The same selection with ids reordered and some repeated. */
const shuffledWithDuplicates = (s: CvSelection) =>
  fc.record({
    titleId: fc.constant(s.titleId),
    conceptIds: fc.shuffledSubarray([...s.conceptIds, ...s.conceptIds], {
      minLength: s.conceptIds.length * 2,
    }),
    skillIds: fc.shuffledSubarray([...s.skillIds, ...s.skillIds], {
      minLength: s.skillIds.length * 2,
    }),
  });

describe("toCvSearch / fromCvSearch", () => {
  test.prop([selection])("round-trips to the canonical selection", (s) => {
    expect(fromCvSearch(toCvSearch(s))).toEqual(canonicalSelection(s));
  });

  test.prop([selection.chain((s) => fc.tuple(fc.constant(s), shuffledWithDuplicates(s)))])(
    "gives the same search regardless of id order or duplicates",
    ([s, shuffled]) => {
      expect(toCvSearch(shuffled)).toEqual(toCvSearch(s));
    },
  );

  test.prop([selection])("leaves out exactly the empty parts", (s) => {
    const search = toCvSearch(s);
    expect("title" in search).toBe(s.titleId !== undefined);
    expect("concepts" in search).toBe(s.conceptIds.length > 0);
    expect("skills" in search).toBe(s.skillIds.length > 0);
  });

  test.prop([selection])("ignores stray separators and whitespace", (s) => {
    const search = toCvSearch(s);
    const messy = {
      ...search,
      concepts: search.concepts && `, ${search.concepts.split(",").join(" ,, ")} ,`,
      skills: search.skills && `${search.skills},,`,
    };
    expect(fromCvSearch(messy)).toEqual(fromCvSearch(search));
  });
});

describe("canonicalSelection", () => {
  test.prop([selection])("is idempotent", (s) => {
    const once = canonicalSelection(s);
    expect(canonicalSelection(once)).toEqual(once);
  });
});

describe("sameSelection", () => {
  test.prop([selection.chain((s) => fc.tuple(fc.constant(s), shuffledWithDuplicates(s)))])(
    "treats reordered or repeated ids as the same",
    ([s, shuffled]) => {
      expect(sameSelection(s, shuffled)).toBe(true);
    },
  );

  test.prop([selection, id])("notices an added skill", (s, extra) => {
    fc.pre(!s.skillIds.includes(extra));
    expect(sameSelection(s, { ...s, skillIds: [...s.skillIds, extra] })).toBe(false);
  });

  test.prop([selection, id])("notices a different title", (s, other) => {
    fc.pre(s.titleId !== other);
    expect(sameSelection(s, { ...s, titleId: other })).toBe(false);
  });

  test.prop([selection, selection])("is symmetric", (a, b) => {
    expect(sameSelection(a, b)).toBe(sameSelection(b, a));
  });
});
