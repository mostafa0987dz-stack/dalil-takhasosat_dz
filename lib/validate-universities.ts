import { SERIE_NAMES } from "./constants";

/** صيغة ملف JSON لرفع الجامعات ومعدلات القبول (انظر public/templates/universities-template.json). */
export type UniversityRow = {
  slug: string; name_ar: string; name_fr: string | null; type: string | null; wilaya: string | null; city: string | null;
  address: string | null; website_url: string | null; latitude: number | null; longitude: number | null;
  description_ar: string | null; is_published: boolean | null;
};
export type LinkRow = { university_slug: string; specialty_slug: string; faculty_name: string | null; is_active: boolean };
export type RateRow = {
  university_slug: string; specialty_slug: string; bac_branch: string; year: number; score: number | null;
  source_url: string | null; source_title: string | null; notes: string | null; is_official: boolean;
};
export type UniversitiesImport = { universities: UniversityRow[]; links: LinkRow[]; rates: RateRow[] };
type Result = { ok: true; value: UniversitiesImport } | { ok: false; error: string };

export const MAX_UNIVERSITIES = 500;
export const MAX_RATES = 50000;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t || null;
};
const num = (v: unknown): number | null | undefined => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v.trim().replace(",", ".")) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined; // undefined = قيمة غير صالحة
};
const httpUrl = (v: unknown): string | null | undefined => {
  const s = str(v, 2000);
  if (!s) return null;
  try { return ["http:", "https:"].includes(new URL(s).protocol) ? s : undefined; } catch { return undefined; }
};

/** يقبل مصفوفة جامعات مباشرة أو كائناً بالشكل { "universities": [...] }. */
export function extractUniversities(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (isObj(raw) && Array.isArray(raw.universities)) return raw.universities;
  return null;
}

/** كل معرّفات التخصصات المذكورة في الملف (لفحص وجودها في قاعدة البيانات قبل الكتابة). */
export function collectSpecialtySlugs(raw: unknown): string[] {
  const out = new Set<string>();
  for (const u of extractUniversities(raw) ?? []) {
    if (!isObj(u) || !Array.isArray(u.specialties)) continue;
    for (const s of u.specialties) if (isObj(s) && typeof s.specialty_slug === "string") out.add(s.specialty_slug.trim());
  }
  return [...out].filter(Boolean);
}

export function validateUniversities(
  raw: unknown,
  opts: { knownSpecialties: ReadonlySet<string>; allowedSeries?: readonly string[]; publishAll?: boolean },
): Result {
  const fail = (error: string): Result => ({ ok: false, error });
  const allowedSeries = opts.allowedSeries ?? SERIE_NAMES;
  const list = extractUniversities(raw);
  if (!list) return fail("يجب أن يكون الملف مصفوفة جامعات، أو كائناً يحوي المفتاح universities.");
  if (!list.length) return fail("الملف لا يحتوي أي جامعة.");
  if (list.length > MAX_UNIVERSITIES) return fail(`الحد الأقصى ${MAX_UNIVERSITIES} جامعة في الملف الواحد.`);

  const universities: UniversityRow[] = [], links: LinkRow[] = [], rates: RateRow[] = [];
  const seenUni = new Set<string>();

  for (let i = 0; i < list.length; i++) {
    const at = `الجامعة رقم ${i + 1}`;
    const u = list[i];
    if (!isObj(u)) return fail(`${at}: عنصر غير صالح.`);
    const slug = (str(u.slug, 90) ?? "").toLowerCase();
    if (!SLUG.test(slug)) return fail(`${at}: المعرّف (slug) يجب أن يكون لاتينياً صغيراً بشرطات، مثل universite-alger-1.`);
    if (seenUni.has(slug)) return fail(`${at}: المعرّف مكرر داخل الملف (${slug}).`);
    seenUni.add(slug);
    const where = `${at} (${slug})`;

    const name_ar = str(u.name_ar, 180);
    if (!name_ar || name_ar.length < 2) return fail(`${where}: الاسم العربي مطلوب (name_ar).`);
    const website = httpUrl(u.website_url);
    if (website === undefined) return fail(`${where}: رابط الموقع الرسمي غير صالح.`);
    const lat = num(u.latitude), lng = num(u.longitude);
    if (lat === undefined || lng === undefined || (lat !== null && Math.abs(lat) > 90) || (lng !== null && Math.abs(lng) > 180)) return fail(`${where}: إحداثيات غير صالحة.`);
    if ((lat === null) !== (lng === null)) return fail(`${where}: أدخل latitude وlongitude معاً أو احذفهما.`);

    universities.push({
      slug, name_ar, name_fr: str(u.name_fr, 180), type: str(u.type, 80), wilaya: str(u.wilaya, 80), city: str(u.city, 80),
      address: str(u.address, 300), website_url: website, latitude: lat, longitude: lng,
      description_ar: str(u.description_ar, 3000),
      is_published: opts.publishAll ? true : typeof u.is_published === "boolean" ? u.is_published : null,
    });

    if (u.specialties !== undefined && !Array.isArray(u.specialties)) return fail(`${where}: specialties يجب أن تكون مصفوفة.`);
    const seenSpec = new Set<string>();
    for (const sp of (u.specialties ?? []) as unknown[]) {
      if (!isObj(sp)) return fail(`${where}: إحدى التخصصات غير صالحة.`);
      const specialty_slug = (str(sp.specialty_slug, 90) ?? "").toLowerCase();
      if (!SLUG.test(specialty_slug)) return fail(`${where}: specialty_slug غير صالح.`);
      if (!opts.knownSpecialties.has(specialty_slug)) return fail(`${where}: التخصص «${specialty_slug}» غير موجود. أضفه أولاً من «إضافة تخصص» أو «استيراد التخصصات».`);
      if (seenSpec.has(specialty_slug)) return fail(`${where}: التخصص ${specialty_slug} مكرر؛ ضع كل معدلاته داخل عنصر واحد.`);
      seenSpec.add(specialty_slug);
      links.push({ university_slug: slug, specialty_slug, faculty_name: str(sp.faculty_name, 180), is_active: sp.is_active === false ? false : true });

      if (sp.rates !== undefined && !Array.isArray(sp.rates)) return fail(`${where} / ${specialty_slug}: rates يجب أن تكون مصفوفة.`);
      const seenRate = new Set<string>();
      for (const r of (sp.rates ?? []) as unknown[]) {
        const rw = `${where} / ${specialty_slug}`;
        if (!isObj(r)) return fail(`${rw}: أحد سجلات المعدلات غير صالح.`);
        const bac_branch = str(r.bac_branch ?? r.serie, 120);
        if (!bac_branch || !allowedSeries.includes(bac_branch)) return fail(`${rw}: شعبة غير معروفة «${bac_branch ?? "فارغة"}». استخدم اسماً مطابقاً لإدارة الشعب.`);
        const year = Number(r.year ?? r.annee);
        if (!Number.isInteger(year) || year < 2000 || year > 2100) return fail(`${rw}: سنة غير صالحة في ${bac_branch}.`);
        const score = num(r.score ?? r.moyenne);
        if (score === undefined || (score !== null && (score < 0 || score > 20))) return fail(`${rw}: المعدل يجب أن يكون بين 0 و20 أو null (${bac_branch} / ${year}).`);
        const key = `${bac_branch}|${year}`;
        if (seenRate.has(key)) return fail(`${rw}: سجل مكرر ${bac_branch} / ${year}.`);
        seenRate.add(key);
        const source_url = httpUrl(r.source_url);
        if (source_url === undefined) return fail(`${rw}: رابط المصدر غير صالح (${bac_branch} / ${year}).`);
        const is_official = r.is_official === true;
        if (is_official && !source_url) return fail(`${rw}: لا يمكن وسم السجل «رسمي» بدون source_url (${bac_branch} / ${year}).`);
        rates.push({ university_slug: slug, specialty_slug, bac_branch, year, score: score === null ? null : Math.round(score * 100) / 100, source_url, source_title: str(r.source_title, 200), notes: str(r.notes, 500), is_official });
        if (rates.length > MAX_RATES) return fail(`الحد الأقصى ${MAX_RATES} سجل معدل في الملف الواحد.`);
      }
    }
  }
  return { ok: true, value: { universities, links, rates } };
}
