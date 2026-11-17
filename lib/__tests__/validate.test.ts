import { describe, expect, it } from "vitest";
import { validateSpecialty } from "../validate";

const valid = {
  slug: "genie-civil", nom_ar: "الهندسة المدنية", domaine: "علوم وتكنولوجيا", diplome: "ليسانس", duree: "3 سنوات",
  description_ar: "تخصص يُعنى بتصميم وإنجاز المنشآت.", filiere: ["علوم تجريبية"],
};

describe("validateSpecialty", () => {
  it("يقبل slug صالحاً ويعيد القيم منظّفة", () => {
    const r = validateSpecialty(valid);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.value.slug).toBe("genie-civil"); expect(r.value.published).toBe(false); }
  });

  it("يرفض slug غير صالح (شرطة في البداية أو شرطة سفلية أو فراغ)", () => {
    for (const slug of ["-genie", "genie-", "genie_civil", "genie civil", "génie"]) {
      expect(validateSpecialty({ ...valid, slug }).ok).toBe(false);
    }
  });

  it("الحروف الكبيرة في slug تُحوَّل إلى صغيرة (سلوك الكود الحالي) فلا تفشل", () => {
    const r = validateSpecialty({ ...valid, slug: "Genie-Civil" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.slug).toBe("genie-civil");
  });

  it("يرفض حقلاً إلزامياً مفقوداً", () => {
    for (const key of ["nom_ar", "domaine", "diplome", "duree", "description_ar"] as const) {
      const copy: Record<string, unknown> = { ...valid };
      delete copy[key];
      expect(validateSpecialty(copy).ok).toBe(false);
    }
  });

  it("يرفض شعبة غير معروفة وغياب الشعب", () => {
    expect(validateSpecialty({ ...valid, filiere: ["شعبة وهمية"] }).ok).toBe(false);
    expect(validateSpecialty({ ...valid, filiere: [] }).ok).toBe(false);
  });
});
