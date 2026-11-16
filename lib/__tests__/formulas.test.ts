import { describe, expect, it } from "vitest";
import { FORMULAS, SUBJECTS, weighted } from "../formulas";

describe("weighted", () => {
  const terms = FORMULAS["علوم تجريبية"]["علوم طبية"];

  it("computes the expected weighted average with valid marks", () => {
    const marks = {
      [SUBJECTS.general]: "15",
      [SUBJECTS.science]: "16",
      [SUBJECTS.math]: "14",
    };
    expect(weighted(terms, marks)).toBeCloseTo(15.2, 5);
  });

  it("returns null when a required mark is missing", () => {
    const marks = {
      [SUBJECTS.general]: "15",
      [SUBJECTS.science]: "16",
    };
    expect(weighted(terms, marks)).toBeNull();
  });

  it("returns null when a mark is outside 0..20", () => {
    const marks = {
      [SUBJECTS.general]: "21",
      [SUBJECTS.science]: "16",
      [SUBJECTS.math]: "14",
    };
    expect(weighted(terms, marks)).toBeNull();
  });
});
