import { describe, expect, it } from "vitest";
import { ADMISSION_NEAR, admissionStatus, latestMin, minByYear } from "../rates";
import { autoSpecialtyDescription, autoUniversityDescription } from "../autotext";

const rates = [
  { bac_branch: "علوم تجريبية", year: 2025, score: 16.5 },
  { bac_branch: "علوم تجريبية", year: 2025, score: 15.8 },
  { bac_branch: "علوم تجريبية", year: 2024, score: 15.2 },
  { bac_branch: "رياضيات", year: 2025, score: 15.1 },
  { bac_branch: "رياضيات", year: 2023, score: null },
];

describe("latestMin", () => {
  it("يعيد أدنى معدل في أحدث سنة مع الشعبة", () => {
    expect(latestMin(rates)).toEqual({ year: 2025, score: 15.1, branch: "رياضيات" });
  });
  it("يعيد null عند غياب المعدلات", () => {
    expect(latestMin([])).toBeNull();
    expect(latestMin([{ bac_branch: "أ", year: 2025, score: null }])).toBeNull();
  });
});

describe("minByYear", () => {
  it("أدنى معدل لكل سنة لشعبة، من الأقدم إلى الأحدث", () => {
    expect(minByYear(rates, "علوم تجريبية")).toEqual([{ year: 2024, score: 15.2 }, { year: 2025, score: 15.8 }]);
  });
  it("يقتصر على آخر limit سنوات", () => {
    const many = [2019, 2020, 2021, 2022, 2023, 2024, 2025].map((year, i) => ({ bac_branch: "أ", year, score: 14 + i / 10 }));
    expect(minByYear(many, "أ", 3).map((p) => p.year)).toEqual([2023, 2024, 2025]);
  });
});

describe("admissionStatus", () => {
  it("ok / near / high", () => {
    expect(admissionStatus(15, 15)).toBe("ok");
    expect(admissionStatus(15, 16)).toBe("ok");
    expect(admissionStatus(15, 15 - ADMISSION_NEAR)).toBe("near");
    expect(admissionStatus(15, 13.9)).toBe("high");
  });
});

describe("النص المولَّد", () => {
  it("وصف التخصص يحوي الأجزاء المتوفرة فقط", () => {
    const full = autoSpecialtyDescription({ nom_ar: "الطب", domaine: "علوم الصحة", duree: "7 سنوات", filiere: ["علوم تجريبية"] }, 22, { year: 2026, score: 16.33, branch: "علوم تجريبية" });
    expect(full.includes("يُدرّس في 22 جامعة")).toBe(true);
    expect(full.includes("16.33 في 2026 (علوم تجريبية)")).toBe(true);
    const bare = autoSpecialtyDescription({ nom_ar: "الطب", domaine: "علوم الصحة", duree: "", filiere: [] }, 0, null);
    expect(bare).toBe("الطب تخصص في مجال علوم الصحة.");
  });
  it("وصف الجامعة", () => {
    const t = autoUniversityDescription({ name_ar: "جامعة وهران 1", type: null, wilaya: "وهران" }, 3, 2, { year: 2025, score: 15.1 });
    expect(t.includes("في ولاية وهران")).toBe(true);
    expect(t.includes("3 تخصصاً في 2 مجالات")).toBe(true);
  });
});
