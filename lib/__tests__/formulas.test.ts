import { describe, expect, it } from "vitest";
import { FORMULAS, SUBJECTS, weighted, type Term } from "../formulas";

const terms: Term[] = [{ subject: SUBJECTS.general, coef: 2 }, { subject: SUBJECTS.science, coef: 2 }];

describe("weighted", () => {
  it("يحسب المتوسط المرجّح بعلامات كاملة: (15×2 + 16×2) / 4 = 15.5", () => {
    expect(weighted(terms, { [SUBJECTS.general]: "15", [SUBJECTS.science]: "16" })).toBeCloseTo(15.5, 5);
  });

  it("يعمل مع صيغة حقيقية ومع الفاصلة العشرية: علوم تجريبية / علوم طبية", () => {
    const f = FORMULAS["علوم تجريبية"]["علوم طبية"]; // عام×2 + علوم×2 + رياضيات×1
    const v = weighted(f, { [SUBJECTS.general]: "15,0", [SUBJECTS.science]: "16", [SUBJECTS.math]: "14" });
    expect(v).toBeCloseTo((15 * 2 + 16 * 2 + 14) / 5, 5); // 15.2
  });

  it("يعيد null إذا نقصت علامة", () => {
    expect(weighted(terms, { [SUBJECTS.general]: "15" })).toBeNull();
    expect(weighted(terms, { [SUBJECTS.general]: "15", [SUBJECTS.science]: "" })).toBeNull();
  });

  it("يعيد null إذا كانت علامة خارج 0..20 أو غير رقمية", () => {
    expect(weighted(terms, { [SUBJECTS.general]: "21", [SUBJECTS.science]: "16" })).toBeNull();
    expect(weighted(terms, { [SUBJECTS.general]: "-1", [SUBJECTS.science]: "16" })).toBeNull();
    expect(weighted(terms, { [SUBJECTS.general]: "abc", [SUBJECTS.science]: "16" })).toBeNull();
  });
});
