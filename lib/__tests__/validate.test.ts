import { describe, expect, it } from "vitest";
import { validateSpecialty } from "../validate";

const validBase = {
  slug: "genie-civil",
  nom_ar: "هندسة مدنية",
  nom_fr: "Génie Civil",
  domaine: "علوم وتكنولوجيا",
  diplome: "ليسانس",
  duree: "3 سنوات",
  description_ar: "وصف التخصص",
  filiere: ["علوم تجريبية"],
};

describe("validateSpecialty", () => {
  it("passes with a valid slug and required fields", () => {
    const res = validateSpecialty(validBase);
    expect(res.ok).toBe(true);
  });

  it("fails when slug starts with a hyphen or contains invalid format", () => {
    const res = validateSpecialty({ ...validBase, slug: "-invalid-slug" });
    expect(res.ok).toBe(false);
  });

  it("fails when a required field is missing", () => {
    const res = validateSpecialty({ ...validBase, nom_ar: "" });
    expect(res.ok).toBe(false);
  });
});
