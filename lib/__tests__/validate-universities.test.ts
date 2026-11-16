import { describe, expect, it } from "vitest";
import { validateUniversities } from "../validate-universities";

const knownSpecialties = new Set(["genie-civil"]);

describe("validateUniversities", () => {
  it("passes with a valid universities payload", () => {
    const res = validateUniversities(
      [
        {
          slug: "universite-alger-1",
          name_ar: "جامعة الجزائر 1",
          specialties: [
            {
              specialty_slug: "genie-civil",
              rates: [{ bac_branch: "علوم تجريبية", year: 2025, score: 13.5 }],
            },
          ],
        },
      ],
      { knownSpecialties }
    );
    expect(res.ok).toBe(true);
  });

  it("fails when score is outside 0..20", () => {
    const res = validateUniversities(
      [
        {
          slug: "universite-alger-1",
          name_ar: "جامعة الجزائر 1",
          specialties: [
            {
              specialty_slug: "genie-civil",
              rates: [{ bac_branch: "علوم تجريبية", year: 2025, score: 22 }],
            },
          ],
        },
      ],
      { knownSpecialties }
    );
    expect(res.ok).toBe(false);
  });

  it("fails when (bac_branch, year) is duplicated inside the same specialty", () => {
    const res = validateUniversities(
      [
        {
          slug: "universite-alger-1",
          name_ar: "جامعة الجزائر 1",
          specialties: [
            {
              specialty_slug: "genie-civil",
              rates: [
                { bac_branch: "علوم تجريبية", year: 2025, score: 13.5 },
                { bac_branch: "علوم تجريبية", year: 2025, score: 14.0 },
              ],
            },
          ],
        },
      ],
      { knownSpecialties }
    );
    expect(res.ok).toBe(false);
  });
});
