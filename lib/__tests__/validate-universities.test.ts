import { describe, expect, it } from "vitest";
import { validateUniversities } from "../validate-universities";

const known = new Set(["medecine"]);
const make = (rates: unknown[]) => ({
  universities: [{
    slug: "univ-alger-1", name_ar: "جامعة الجزائر 1", wilaya: "الجزائر",
    specialties: [{ specialty_slug: "medecine", rates }],
  }],
});
const ok = { bac_branch: "علوم تجريبية", year: 2025, score: 16.5 };

describe("validateUniversities", () => {
  it("يقبل ملفاً صالحاً ويسطّحه (جامعات / روابط / معدلات)", () => {
    const r = validateUniversities(make([ok, { bac_branch: "رياضيات", year: 2025, score: "16,25" }]), { knownSpecialties: known });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.universities.length).toBe(1);
      expect(r.value.links.length).toBe(1);
      expect(r.value.rates.length).toBe(2);
      expect(r.value.rates[1].score).toBeCloseTo(16.25, 5);
    }
  });

  it("يرفض معدلاً خارج 0..20", () => {
    expect(validateUniversities(make([{ ...ok, score: 21 }]), { knownSpecialties: known }).ok).toBe(false);
    expect(validateUniversities(make([{ ...ok, score: -0.5 }]), { knownSpecialties: known }).ok).toBe(false);
  });

  it("يرفض (bac_branch, year) مكرراً داخل نفس التخصص", () => {
    const r = validateUniversities(make([ok, { ...ok, score: 16.8 }]), { knownSpecialties: known });
    expect(r.ok).toBe(false);
  });

  it("يرفض تخصصاً غير موجود وشعبة غير معروفة", () => {
    expect(validateUniversities(make([ok]), { knownSpecialties: new Set() }).ok).toBe(false);
    expect(validateUniversities(make([{ ...ok, bac_branch: "شعبة وهمية" }]), { knownSpecialties: known }).ok).toBe(false);
  });
});
