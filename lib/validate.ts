import { SERIE_NAMES } from "./constants";

export type SeuilInput = { serie: string; annee: number; moyenne: number | null; remarque: string | null; is_demo: boolean };
export type SpecialtyInput = {
  slug: string; nom_ar: string; nom_fr: string; domaine: string; diplome: string; duree: string; description_ar: string;
  filiere: string[]; competences: string[]; debouches: string[]; universites: string[]; tags: string[];
  published: boolean; seuils: SeuilInput[];
};
type Result = { ok: true; value: SpecialtyInput } | { ok: false; error: string };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);
const fail = (error: string): Result => ({ ok: false, error });

export function validateSpecialty(raw: any): Result {
  const slug = text(raw?.slug).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return fail("المعرّف (slug) يجب أن يكون بحروف لاتينية صغيرة وأرقام وشرطات فقط، مثل genie-civil");
  const required: [string, string][] = [["nom_ar", "اسم التخصص بالعربية"], ["domaine", "المجال"], ["diplome", "الشهادة"], ["duree", "المدة"], ["description_ar", "الوصف"]];
  for (const [k, label] of required) if (!text(raw?.[k])) return fail(`الحقل مطلوب: ${label}`);

  const filiere = list(raw?.filiere);
  if (!filiere.length) return fail("اختر شعبة واحدة على الأقل");
  const badSerie = filiere.find((x) => !SERIE_NAMES.includes(x));
  if (badSerie) return fail(`شعبة غير معروفة: ${badSerie}`);

  const seen = new Set<string>();
  const seuils: SeuilInput[] = [];
  for (const t of Array.isArray(raw?.seuils) ? raw.seuils : []) {
    const serie = text(t?.serie);
    const annee = Number(t?.annee);
    const m = t?.moyenne === null || t?.moyenne === undefined || t?.moyenne === "" ? null : Number(t.moyenne);
    if (!SERIE_NAMES.includes(serie)) return fail(`شعبة غير معروفة في العتبات: ${serie || "(فارغة)"}`);
    if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) return fail(`سنة غير صالحة في عتبة ${serie}`);
    if (m !== null && (!Number.isFinite(m) || m < 0 || m > 20)) return fail(`المعدل يجب أن يكون بين 0 و20 (${serie})`);
    const key = `${serie}|${annee}`;
    if (seen.has(key)) return fail(`عتبة مكررة: ${serie} / ${annee}`);
    seen.add(key);
    seuils.push({ serie, annee, moyenne: m, remarque: text(t?.remarque) || null, is_demo: Boolean(t?.is_demo ?? t?.demo ?? true) });
  }

  return {
    ok: true,
    value: {
      slug, nom_ar: text(raw.nom_ar), nom_fr: text(raw.nom_fr), domaine: text(raw.domaine), diplome: text(raw.diplome),
      duree: text(raw.duree), description_ar: text(raw.description_ar), filiere,
      competences: list(raw.competences), debouches: list(raw.debouches), universites: list(raw.universites), tags: list(raw.tags),
      published: Boolean(raw.published), seuils,
    },
  };
}
