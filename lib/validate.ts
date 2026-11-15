import { SERIE_NAMES } from "./constants";

export type SeuilInput = { serie: string; annee: number; moyenne: number | null; remarque: string | null; is_demo: boolean };
export type SpecialtyInput = {
  slug: string; nom_ar: string; nom_fr: string; domaine: string; diplome: string; duree: string; description_ar: string;
  filiere: string[]; competences: string[]; debouches: string[]; universites: string[]; tags: string[];
  published: boolean; seuils: SeuilInput[];
};
type Result = { ok: true; value: SpecialtyInput } | { ok: false; error: string };
const text = (v: unknown, max = 5000) => typeof v === "string" ? v.trim().slice(0, max) : "";
const list = (v: unknown, maxItems = 100, maxLength = 180): string[] => {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === "string").map(x => x.trim().slice(0, maxLength)).filter(Boolean))].slice(0, maxItems);
};
const fail = (error: string): Result => ({ ok: false, error });

export function validateSpecialty(raw: unknown): Result {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("بيانات التخصص غير صالحة.");
  const r = raw as Record<string, unknown>;
  const slug = text(r.slug, 90).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return fail("المعرّف يجب أن يتكون من حروف لاتينية صغيرة وأرقام وشرطات، مثل genie-civil.");
  const fields: [string, string, number][] = [["nom_ar", "اسم التخصص بالعربية", 180], ["domaine", "المجال", 120], ["diplome", "الشهادة", 120], ["duree", "المدة", 80], ["description_ar", "الوصف", 5000]];
  for (const [key, label, max] of fields) {
    if (!text(r[key], max)) return fail(`الحقل مطلوب: ${label}`);
    if (typeof r[key] === "string" && (r[key] as string).trim().length > max) return fail(`الحقل ${label} طويل جداً.`);
  }
  const filiere = list(r.filiere, 6, 80);
  if (!filiere.length) return fail("اختر شعبة واحدة على الأقل.");
  const badSerie = filiere.find(x => !SERIE_NAMES.includes(x));
  if (badSerie) return fail(`شعبة غير معروفة: ${badSerie}`);
  if (r.seuils !== undefined && !Array.isArray(r.seuils)) return fail("قائمة العتبات غير صالحة.");
  const inputSeuils = Array.isArray(r.seuils) ? r.seuils : [];
  if (inputSeuils.length > 1000) return fail("عدد العتبات يتجاوز الحد المسموح (1000).");
  const seen = new Set<string>();
  const seuils: SeuilInput[] = [];
  for (const item of inputSeuils) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return fail("إحدى العتبات غير صالحة.");
    const t = item as Record<string, unknown>;
    const serie = text(t.serie, 80), annee = Number(t.annee);
    const m = t.moyenne === null || t.moyenne === undefined || t.moyenne === "" ? null : Number(t.moyenne);
    if (!SERIE_NAMES.includes(serie)) return fail(`شعبة غير معروفة في العتبات: ${serie || "فارغة"}`);
    if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) return fail(`سنة غير صالحة في عتبة ${serie}.`);
    if (m !== null && (!Number.isFinite(m) || m < 0 || m > 20)) return fail(`المعدل يجب أن يكون بين 0 و20 (${serie}).`);
    const key = `${serie}|${annee}`;
    if (seen.has(key)) return fail(`عتبة مكررة: ${serie} / ${annee}`);
    seen.add(key);
    seuils.push({ serie, annee, moyenne: m, remarque: text(t.remarque, 500) || null, is_demo: Boolean(t.is_demo ?? t.demo ?? true) });
  }
  return { ok: true, value: {
    slug, nom_ar: text(r.nom_ar, 180), nom_fr: text(r.nom_fr, 180), domaine: text(r.domaine, 120),
    diplome: text(r.diplome, 120), duree: text(r.duree, 80), description_ar: text(r.description_ar, 5000), filiere,
    competences: list(r.competences), debouches: list(r.debouches), universites: list(r.universites), tags: list(r.tags, 40, 60),
    published: r.published === true, seuils,
  }};
}
