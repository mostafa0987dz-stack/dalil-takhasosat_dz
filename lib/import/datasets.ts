import { validateSpecialty } from "../validate";
import { validateBlogPost } from "../blog-validate";
import { safeUrl } from "../markdown";
import type { ZipEntry } from "./zip";

export const DATASETS = ["bac_series", "wilayas", "universities", "faculties", "specialties", "thresholds", "categories", "articles"] as const;
export type DatasetKey = (typeof DATASETS)[number];
export const DATASET_LABELS: Record<DatasetKey, string> = {
  bac_series: "شعب البكالوريا", wilayas: "الولايات والمواقع", universities: "الجامعات", faculties: "الكليات والمعاهد",
  specialties: "التخصصات", thresholds: "العتبات ومعدلات القبول", categories: "تصنيفات المقالات", articles: "المقالات",
};
export const FILE_TO_DATASET: Record<string, DatasetKey> = {
  "bac-series.json": "bac_series", "wilayas.json": "wilayas", "universities.json": "universities", "faculties.json": "faculties",
  "specialties.json": "specialties", "thresholds.json": "thresholds", "categories.json": "categories", "articles.json": "articles",
};
export type ImportPayload = Partial<Record<DatasetKey, any[]>>;
export type Issue = { dataset: DatasetKey | "manifest" | "sources" | "zip" | "file"; index?: number; message: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const txt = (v: unknown, max: number): string | null => { if (typeof v !== "string") return null; const t = v.trim().slice(0, max); return t || null; };
const num = (v: unknown): number | null | undefined => { if (v === null || v === undefined || v === "") return null; const n = typeof v === "string" ? Number(v.trim().replace(",", ".")) : typeof v === "number" ? v : NaN; return Number.isFinite(n) ? n : undefined; };
const http = (v: unknown): string | null | undefined => { const s = txt(v, 2000); if (!s) return null; try { return ["http:", "https:"].includes(new URL(s).protocol) ? s : undefined; } catch { return undefined; } };

/** مفتاح التكرار (داخل الملف وأمام قاعدة البيانات) لكل نوع. */
export function rowKey(ds: DatasetKey, r: any): string {
  switch (ds) {
    case "wilayas": return r.code;
    case "faculties": return `${r.university_slug}|${r.name_ar}`;
    case "thresholds": return `${r.university_slug}|${r.specialty_slug}|${r.bac_branch}|${r.year}`;
    default: return r.slug;
  }
}

type Ctx = { allowedSeries: readonly string[] };
type RowResult = { row: any } | { error: string };
const err = (error: string): RowResult => ({ error });

const validators: Record<DatasetKey, (raw: unknown, ctx: Ctx) => RowResult> = {
  bac_series(raw) {
    if (!isObj(raw)) return err("عنصر غير صالح.");
    const slug = (txt(raw.slug, 90) ?? "").toLowerCase();
    if (!SLUG.test(slug)) return err("slug غير صالح.");
    const name_ar = txt(raw.name_ar, 80); if (!name_ar) return err("name_ar مطلوب.");
    const so = num(raw.sort_order ?? 0); if (so === undefined || so === null || so < 0 || so > 999) return err("sort_order بين 0 و999.");
    return { row: { slug, name_ar, name_fr: txt(raw.name_fr, 80), name_en: txt(raw.name_en, 80), sort_order: Math.round(so), is_active: raw.is_active !== false } };
  },
  wilayas(raw) {
    if (!isObj(raw)) return err("عنصر غير صالح.");
    const code = String(raw.code ?? "").trim();
    if (!/^\d{1,2}$/.test(code)) return err("code يجب أن يكون رقماً من خانة أو خانتين.");
    const name_ar = txt(raw.name_ar, 80); if (!name_ar) return err("name_ar مطلوب.");
    return { row: { code: code.padStart(2, "0"), name_ar, name_fr: txt(raw.name_fr, 80) } };
  },
  universities(raw) {
    if (!isObj(raw)) return err("عنصر غير صالح.");
    const slug = (txt(raw.slug, 90) ?? "").toLowerCase();
    if (!SLUG.test(slug)) return err("slug غير صالح.");
    const name_ar = txt(raw.name_ar, 180); if (!name_ar || name_ar.length < 2) return err("name_ar مطلوب.");
    const web = http(raw.website_url); if (web === undefined) return err("website_url غير صالح.");
    const lat = num(raw.latitude), lng = num(raw.longitude);
    if (lat === undefined || lng === undefined || (lat !== null && Math.abs(lat) > 90) || (lng !== null && Math.abs(lng) > 180)) return err("إحداثيات غير صالحة.");
    if ((lat === null) !== (lng === null)) return err("أدخل latitude وlongitude معاً أو احذفهما.");
    return { row: { slug, name_ar, name_fr: txt(raw.name_fr, 180), type: txt(raw.type, 80), wilaya: txt(raw.wilaya, 80), city: txt(raw.city, 80), address: txt(raw.address, 300), website_url: web, latitude: lat, longitude: lng, description_ar: txt(raw.description_ar, 3000) } };
  },
  faculties(raw) {
    if (!isObj(raw)) return err("عنصر غير صالح.");
    const university_slug = (txt(raw.university_slug, 90) ?? "").toLowerCase();
    if (!SLUG.test(university_slug)) return err("university_slug غير صالح.");
    const name_ar = txt(raw.name_ar, 180); if (!name_ar) return err("name_ar مطلوب.");
    return { row: { university_slug, name_ar, name_fr: txt(raw.name_fr, 180) } };
  },
  specialties(raw, ctx) {
    const r = validateSpecialty(raw, ctx.allowedSeries);
    if (!r.ok) return err(r.error);
    const { seuils, ...rest } = r.value;
    return { row: { ...rest, published: false, thresholds: seuils } }; // لا نشر تلقائي
  },
  thresholds(raw, ctx) {
    if (!isObj(raw)) return err("عنصر غير صالح.");
    const university_slug = (txt(raw.university_slug, 90) ?? "").toLowerCase();
    const specialty_slug = (txt(raw.specialty_slug, 90) ?? "").toLowerCase();
    if (!SLUG.test(university_slug) || !SLUG.test(specialty_slug)) return err("university_slug/specialty_slug غير صالحين.");
    const bac_branch = txt(raw.bac_branch ?? raw.serie, 120);
    if (!bac_branch || !ctx.allowedSeries.includes(bac_branch)) return err(`شعبة غير معروفة «${bac_branch ?? ""}».`);
    const year = Number(raw.year ?? raw.annee);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return err("year غير صالح.");
    const score = num(raw.score ?? raw.moyenne);
    if (score === undefined || (score !== null && (score < 0 || score > 20))) return err("score بين 0 و20 أو null.");
    const source_url = http(raw.source_url); if (source_url === undefined) return err("source_url غير صالح.");
    const is_official = raw.is_official === true;
    if (is_official && !source_url) return err("السجل الرسمي يتطلب source_url.");
    return { row: { university_slug, specialty_slug, bac_branch, year, score: score === null ? null : Math.round(score * 100) / 100, source_url, source_title: txt(raw.source_title, 200), is_official, notes: txt(raw.notes, 500) } };
  },
  categories(raw) {
    if (!isObj(raw)) return err("عنصر غير صالح.");
    const slug = (txt(raw.slug, 90) ?? "").toLowerCase();
    if (!SLUG.test(slug)) return err("slug غير صالح.");
    const name_ar = txt(raw.name_ar, 80); if (!name_ar || name_ar.length < 2) return err("name_ar مطلوب.");
    const so = num(raw.sort_order ?? 0); if (so === undefined || so === null || so < 0 || so > 999) return err("sort_order بين 0 و999.");
    return { row: { slug, name_ar, description_ar: txt(raw.description_ar, 300), sort_order: Math.round(so) } };
  },
  articles(raw) {
    if (!isObj(raw)) return err("عنصر غير صالح.");
    const categorySlug = (txt(raw.category_slug, 90) ?? "").toLowerCase();
    if (categorySlug && !SLUG.test(categorySlug)) return err("category_slug غير صالح.");
    // يُجبر على مسودة: لا نشر تلقائي. نستعمل مدقق المقالات نفسه (يتحقق من الروابط والأطوال).
    const r = validateBlogPost({ ...raw, status: "draft", category_id: "" });
    if (!r.ok) return err(r.error);
    const { category_id: _c, status: _s, ...rest } = r.value;
    return { row: { ...rest, category_slug: categorySlug || null } };
  },
};

/** يتحقق من كل صفوف نوع واحد: يجمع الأخطاء (لا يتوقف عند أول خطأ) ويكشف التكرار داخل الملف. */
export function validateDataset(ds: DatasetKey, raw: unknown[], ctx: Ctx, maxIssues = 200): { rows: any[]; issues: Issue[] } {
  const rows: any[] = [], issues: Issue[] = [], seen = new Map<string, number>();
  raw.forEach((item, i) => {
    const r = validators[ds](item, ctx);
    if ("error" in r) { if (issues.length < maxIssues) issues.push({ dataset: ds, index: i + 1, message: r.error }); return; }
    const k = rowKey(ds, r.row);
    const prev = seen.get(k);
    if (prev !== undefined) { if (issues.length < maxIssues) issues.push({ dataset: ds, index: i + 1, message: `مكرر داخل الملف (نفس السجل رقم ${prev}).` }); return; }
    seen.set(k, i + 1);
    rows.push(r.row);
  });
  return { rows, issues };
}

const CAMEL: Record<DatasetKey, string[]> = {
  bac_series: ["bac_series", "bac-series", "bacSeries", "series"], wilayas: ["wilayas"], universities: ["universities"], faculties: ["faculties"],
  specialties: ["specialties"], thresholds: ["thresholds", "rates"], categories: ["categories"], articles: ["articles"],
};
/** ملف نوع واحد: مصفوفة مباشرة أو كائن بمفتاح النوع. */
export function extractRows(ds: DatasetKey, parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (isObj(parsed)) for (const k of CAMEL[ds]) if (Array.isArray(parsed[k])) return parsed[k] as unknown[];
  return null;
}

export type Manifest = { schema_version: number; created_at: string | null; datasets: DatasetKey[]; counts: Partial<Record<DatasetKey, number>>; sources: { title: string; url: string | null }[] };

/** يفكّ ملفات ZIP إلى payload بعد التحقق من manifest وتطابق الأعداد. */
export function parseBundle(entries: ZipEntry[], ctx: Ctx): { payload: ImportPayload; manifest: Manifest | null; issues: Issue[]; fileCounts: Partial<Record<DatasetKey, number>> } {
  const issues: Issue[] = [];
  const td = new TextDecoder("utf-8");
  // إن كانت كل الملفات داخل مجلد جذر واحد نزيله
  const roots = new Set(entries.map((e) => (e.name.includes("/") ? e.name.split("/")[0] : "")));
  const strip = roots.size === 1 && !roots.has("");
  const files = new Map<string, Uint8Array>();
  for (const e of entries) {
    const name = strip ? e.name.split("/").slice(1).join("/") : e.name;
    if (name.includes("/")) { issues.push({ dataset: "zip", message: `ملفات داخل مجلدات فرعية غير مدعومة: ${e.name}` }); continue; }
    files.set(name, e.data);
  }
  const json = (name: string): unknown | undefined => {
    const d = files.get(name); if (!d) return undefined;
    try { return JSON.parse(td.decode(d).replace(/^\ufeff/, "")); } catch { issues.push({ dataset: "file", message: `${name}: JSON غير صالح.` }); return undefined; }
  };

  let manifest: Manifest | null = null;
  const m = json("manifest.json");
  if (!files.has("manifest.json")) issues.push({ dataset: "manifest", message: "الملف manifest.json مطلوب في الأرشيف." });
  else if (m !== undefined) {
    if (!isObj(m)) issues.push({ dataset: "manifest", message: "manifest.json يجب أن يكون كائناً." });
    else {
      if (m.schema_version !== 1) issues.push({ dataset: "manifest", message: "schema_version غير مدعوم (المدعوم: 1)." });
      const created = typeof m.created_at === "string" && !Number.isNaN(Date.parse(m.created_at)) ? m.created_at : null;
      if (!created) issues.push({ dataset: "manifest", message: "created_at مطلوب بصيغة تاريخ صالحة." });
      const sources = Array.isArray(m.sources) ? m.sources.flatMap((s) => (isObj(s) && txt(s.title, 200) ? [{ title: txt(s.title, 200)!, url: http(s.url) ?? null }] : [])) : [];
      manifest = { schema_version: 1, created_at: created, datasets: [], counts: isObj(m.counts) ? (m.counts as any) : {}, sources };
    }
  }
  const sourcesFile = json("sources.json");
  if (Array.isArray(sourcesFile) && manifest) for (const s of sourcesFile) if (isObj(s) && txt(s.title, 200)) manifest.sources.push({ title: txt(s.title, 200)!, url: http(s.url) ?? null });

  const payload: ImportPayload = {};
  const fileCounts: Partial<Record<DatasetKey, number>> = {};
  for (const [file, ds] of Object.entries(FILE_TO_DATASET)) {
    if (!files.has(file)) continue;
    const raw = json(file); if (raw === undefined) continue;
    const arr = extractRows(ds, raw);
    if (!arr) { issues.push({ dataset: ds, message: `${file}: يجب أن يكون مصفوفة أو كائناً يحوي المفتاح ${CAMEL[ds][0]}.` }); continue; }
    fileCounts[ds] = arr.length;
    const { rows, issues: iss } = validateDataset(ds, arr, ctx);
    issues.push(...iss);
    if (rows.length) payload[ds] = rows;
  }
  const known = new Set(["manifest.json", "sources.json", ...Object.keys(FILE_TO_DATASET)]);
  for (const f of files.keys()) if (!known.has(f)) issues.push({ dataset: "zip", message: `ملف غير معروف في الأرشيف: ${f}` });
  if (!Object.keys(fileCounts).length) issues.push({ dataset: "zip", message: "الأرشيف لا يحتوي أي ملف بيانات معروف." });
  if (manifest) {
    manifest.datasets = Object.keys(fileCounts) as DatasetKey[];
    for (const [k, n] of Object.entries(manifest.counts)) {
      const ds = k as DatasetKey;
      if ((DATASETS as readonly string[]).includes(k) && fileCounts[ds] !== undefined && fileCounts[ds] !== n) issues.push({ dataset: "manifest", message: `عدد سجلات ${k} في manifest (${n}) لا يطابق الملف (${fileCounts[ds]}).` });
    }
  }
  return { payload, manifest, issues, fileCounts };
}
