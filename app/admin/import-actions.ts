"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { auditLog } from "@/lib/admin-log";
import { SERIE_NAMES } from "@/lib/constants";
import { ZIP_LIMITS, ZipError, readZip } from "@/lib/import/zip";
import { DATASETS, extractRows, parseBundle, validateDataset, type DatasetKey, type ImportPayload, type Issue } from "@/lib/import/datasets";

export type SummaryRow = { dataset: DatasetKey; total: number; existing: number; added: number; invalid: number };
export type ImportPreview = {
  error?: string; runId?: string; fileName?: string; kind?: "specialized" | "general";
  summary?: SummaryRow[]; issues?: Issue[]; warnings?: string[]; sources?: { title: string; url: string | null }[]; blocked?: boolean;
};
export type ReportRow = { dataset: DatasetKey; added: number; updated: number; skipped: number; failed: number };
export type CommitResult = { error?: string; report?: ReportRow[] };

const MAX_JSON_BYTES = 10 * 1024 * 1024;
const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024; // حد ما نخزّنه في import_runs.payload
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const chunked = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const uniq = <T,>(a: T[]) => Array.from(new Set(a));

type Sb = ReturnType<typeof adminClient>;

async function existingSet(sb: Sb, table: string, col: string, vals: string[]): Promise<Set<string>> {
  const have = new Set<string>();
  for (const part of chunked(vals, 150)) {
    const { data, error } = await sb.from(table).select(col).in(col, part);
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as any[]) have.add(r[col]);
  }
  return have;
}
async function universityIds(sb: Sb, slugs: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  for (const part of chunked(slugs, 150)) {
    const { data, error } = await sb.from("universities").select("id,slug").in("slug", part);
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as any[]) m.set(r.slug, r.id);
  }
  return m;
}

/** مراجع (جامعة/تخصص/تصنيف موجودة؟) + عدّ الجديد والموجود. يُرجع صفوفاً مصفّاة وأخطاء مراجع. */
async function analyze(sb: Sb, payload: ImportPayload) {
  const issues: Issue[] = [], warnings: string[] = [];
  const P = (k: DatasetKey) => (payload[k] ?? []) as any[];

  const uniSlugs = uniq([...P("universities").map((r) => r.slug), ...P("faculties").map((r) => r.university_slug), ...P("thresholds").map((r) => r.university_slug)]);
  const specSlugs = uniq([...P("specialties").map((r) => r.slug), ...P("thresholds").map((r) => r.specialty_slug)]);
  const catSlugs = uniq([...P("categories").map((r) => r.slug), ...P("articles").map((r) => r.category_slug).filter(Boolean)]);
  const [uniIds, specDb, catDb, seriesDb, wilayaDb, postDb] = await Promise.all([
    universityIds(sb, uniSlugs),
    existingSet(sb, "specialties", "slug", specSlugs),
    existingSet(sb, "blog_categories", "slug", catSlugs),
    existingSet(sb, "bac_series", "slug", P("bac_series").map((r) => r.slug)),
    existingSet(sb, "wilayas", "code", P("wilayas").map((r) => r.code)),
    existingSet(sb, "blog_posts", "slug", P("articles").map((r) => r.slug)),
  ]);
  const inFileUni = new Set(P("universities").map((r) => r.slug));
  const inFileSpec = new Set(P("specialties").map((r) => r.slug));
  const inFileCat = new Set(P("categories").map((r) => r.slug));

  const bad = (dataset: DatasetKey, i: number, message: string) => { if (issues.length < 300) issues.push({ dataset, index: i + 1, message }); };
  const keep = <T,>(ds: DatasetKey, rows: T[], ok: (r: T) => string | null): T[] => rows.filter((r, i) => { const m = ok(r); if (m) { bad(ds, i, m); return false; } return true; });

  payload.faculties = keep("faculties", P("faculties"), (r) => (uniIds.has(r.university_slug) || inFileUni.has(r.university_slug) ? null : `الجامعة ${r.university_slug} غير موجودة (ولا في الملف).`));
  payload.thresholds = keep("thresholds", P("thresholds"), (r) =>
    !(uniIds.has(r.university_slug) || inFileUni.has(r.university_slug)) ? `الجامعة ${r.university_slug} غير موجودة.`
      : !(specDb.has(r.specialty_slug) || inFileSpec.has(r.specialty_slug)) ? `التخصص ${r.specialty_slug} غير موجود.` : null);
  payload.articles = keep("articles", P("articles"), (r) => (!r.category_slug || catDb.has(r.category_slug) || inFileCat.has(r.category_slug) ? null : `التصنيف ${r.category_slug} غير موجود.`));
  for (const k of DATASETS) if (!payload[k]?.length) delete payload[k];

  // الموجود فعلاً (للتكرار)
  const existing: Record<string, number> = {};
  existing.bac_series = P("bac_series").filter((r) => seriesDb.has(r.slug)).length;
  existing.wilayas = P("wilayas").filter((r) => wilayaDb.has(r.code)).length;
  existing.universities = P("universities").filter((r) => uniIds.has(r.slug)).length;
  existing.specialties = P("specialties").filter((r) => specDb.has(r.slug)).length;
  existing.categories = P("categories").filter((r) => catDb.has(r.slug)).length;
  existing.articles = P("articles").filter((r) => postDb.has(r.slug)).length;

  const facs = P("faculties");
  if (facs.length) {
    const ids = [...uniIds.values()];
    const have = new Set<string>();
    const slugById = new Map([...uniIds].map(([s, id]) => [id, s]));
    for (const part of chunked(ids, 100)) {
      const { data } = await sb.from("faculties").select("university_id,name_ar").in("university_id", part);
      for (const r of (data ?? []) as any[]) have.add(`${slugById.get(r.university_id)}|${r.name_ar}`);
    }
    existing.faculties = facs.filter((r) => have.has(`${r.university_slug}|${r.name_ar}`)).length;
  }
  const thr = P("thresholds");
  if (thr.length) {
    const slugById = new Map([...uniIds].map(([s, id]) => [id, s]));
    const involved = [...new Set(thr.map((r) => uniIds.get(r.university_slug)).filter(Boolean) as string[])];
    const have = new Set<string>();
    for (const part of chunked(involved, 50)) {
      for (let from = 0; from < 50000; from += 1000) {
        const { data, error } = await sb.from("acceptance_rates").select("university_id,specialty_slug,bac_branch,year").in("university_id", part).order("id").range(from, from + 999);
        if (error) throw new Error(error.message);
        for (const r of (data ?? []) as any[]) have.add(`${slugById.get(r.university_id)}|${r.specialty_slug}|${r.bac_branch}|${r.year}`);
        if (!data || data.length < 1000) break;
      }
    }
    existing.thresholds = thr.filter((r) => have.has(`${r.university_slug}|${r.specialty_slug}|${r.bac_branch}|${r.year}`)).length;
  }

  // تحذيرات غير مانعة
  const wilayaNames = new Set<string>();
  if (P("wilayas").length || wilayaDb.size) {
    const { data } = await sb.from("wilayas").select("name_ar");
    for (const r of (data ?? []) as any[]) wilayaNames.add(r.name_ar);
    for (const r of P("wilayas")) wilayaNames.add(r.name_ar);
    const unknown = uniq(P("universities").map((r) => r.wilaya).filter((w) => w && !wilayaNames.has(w)));
    if (wilayaNames.size && unknown.length) warnings.push(`ولايات غير موجودة في جدول الولايات: ${unknown.slice(0, 8).join("، ")}`);
  }
  if (P("articles").some((r) => (r.related_specialties?.length ?? 0) > 0)) warnings.push("المقالات تحوي تخصصات مرتبطة؛ تأكد أنها موجودة قبل نشرها.");
  return { issues, warnings, existing };
}

export async function previewImport(_: ImportPreview, fd: FormData): Promise<ImportPreview> {
  const email = await requireAdmin();
  const kind = fd.get("mode") === "general" ? "general" : "specialized";
  const skipInvalid = fd.get("skip_invalid") === "on";
  const file = fd.get("file");
  if (!file || typeof file === "string" || file.size === 0) return { error: "اختر ملفاً للاستيراد." };

  const sb = adminClient();
  try {
    // الشعب المسموحة: قاعدة البيانات + الثابتة (+ شعب الملف نفسه عند ZIP)
    const { data: sdata } = await sb.from("bac_series").select("name_ar");
    const allowedSeries = new Set<string>([...SERIE_NAMES, ...((sdata ?? []) as any[]).map((r) => r.name_ar)]);

    const payload: ImportPayload = {};
    let manifest: any = null;
    let issues: Issue[] = [];
    let dataset: DatasetKey | null = null;

    if (kind === "general") {
      if (file.size > ZIP_LIMITS.maxZipBytes) return { error: "حجم ملف ZIP يتجاوز 25 ميغابايت." };
      const buf = new Uint8Array(await file.arrayBuffer());
      if (buf[0] !== 0x50 || buf[1] !== 0x4b) return { error: "الملف ليس أرشيف ZIP صالحاً." };
      const entries = await readZip(buf);
      // شعب جديدة داخل الأرشيف تُقبل كمراجع في العتبات/التخصصات
      const sf = entries.find((e) => e.name.split("/").pop() === "bac-series.json");
      if (sf) { try { const arr = JSON.parse(new TextDecoder().decode(sf.data)); for (const s of Array.isArray(arr) ? arr : []) if (s?.name_ar) allowedSeries.add(String(s.name_ar).trim()); } catch { /* يُبلَّغ عنه في parseBundle */ } }
      const parsed = parseBundle(entries, { allowedSeries: [...allowedSeries] });
      Object.assign(payload, parsed.payload);
      manifest = parsed.manifest;
      issues = parsed.issues;
    } else {
      const ds = String(fd.get("dataset") ?? "");
      if (!(DATASETS as readonly string[]).includes(ds)) return { error: "اختر نوع البيانات." };
      dataset = ds as DatasetKey;
      if (file.size > MAX_JSON_BYTES) return { error: "حجم الملف يتجاوز 10 ميغابايت." };
      let parsedJson: unknown;
      try { parsedJson = JSON.parse((await file.text()).replace(/^\ufeff/, "")); } catch { return { error: "JSON غير صالح: تحقق من الفواصل والأقواس." }; }
      const rows = extractRows(dataset, parsedJson);
      if (!rows) return { error: "يجب أن يكون الملف مصفوفة، أو كائناً يحوي مفتاح النوع." };
      if (!rows.length) return { error: "الملف لا يحتوي أي سجل." };
      const v = validateDataset(dataset, rows, { allowedSeries: [...allowedSeries] });
      issues = v.issues;
      if (v.rows.length) payload[dataset] = v.rows;
    }

    const valid = Object.values(payload).reduce((n, a) => n + (a?.length ?? 0), 0);
    const validationIssues = issues.length;
    const ref = valid ? await analyze(sb, payload) : { issues: [] as Issue[], warnings: [] as string[], existing: {} as Record<string, number> };
    const all = [...issues, ...ref.issues];
    const left = Object.values(payload).reduce((n, a) => n + (a?.length ?? 0), 0);
    const structural = issues.some((i) => i.dataset === "manifest" || i.dataset === "zip" || i.dataset === "file");
    const invalidByDs = (d: DatasetKey) => all.filter((i) => i.dataset === d).length;

    if (all.length && (!skipInvalid || structural || !left)) {
      return { error: structural ? "بنية الملف تحتوي أخطاء مانعة." : "توجد سجلات غير صالحة. صحّحها أو فعّل «تجاهل السجلات غير الصالحة».", issues: all.slice(0, 100), blocked: true, kind };
    }
    if (!left) return { error: "لا توجد سجلات صالحة للاستيراد." };

    const summary: SummaryRow[] = DATASETS.filter((k) => payload[k]?.length || invalidByDs(k)).map((k) => {
      const total = payload[k]?.length ?? 0, existing = ref.existing[k] ?? 0;
      return { dataset: k, total, existing, added: total - existing, invalid: invalidByDs(k) };
    });
    const size = JSON.stringify(payload).length;
    if (size > MAX_PAYLOAD_BYTES) return { error: "حجم البيانات بعد التحقق كبير؛ قسّم الاستيراد إلى ملفات أصغر." };

    const { data: run, error } = await sb.from("import_runs").insert({
      kind, dataset, status: "previewed", file_name: file.name.slice(0, 200), summary: { rows: summary, validation_issues: validationIssues },
      manifest, payload, created_by: email,
    }).select("id").single();
    if (error || !run) return { error: /import_runs/.test(error?.message ?? "") ? "جداول الاستيراد غير موجودة: نفّذ migration 20261121_import_v2.sql في Supabase." : `تعذر حفظ المعاينة: ${error?.message}` };

    await auditLog(email, "import_preview", `${kind}:${dataset ?? "bundle"}:${file.name}`);
    return { runId: (run as { id: string }).id, fileName: file.name, kind, summary, issues: all.slice(0, 100), warnings: ref.warnings, sources: manifest?.sources ?? [] };
  } catch (e) {
    if (e instanceof ZipError) return { error: e.message };
    return { error: `تعذرت المعاينة: ${e instanceof Error ? e.message.slice(0, 300) : "خطأ غير معروف"}` };
  }
}

export async function commitImport(_: CommitResult, fd: FormData): Promise<CommitResult> {
  const email = await requireAdmin();
  const runId = String(fd.get("run_id") ?? "");
  const policy = fd.get("policy") === "update" ? "update" : "skip";
  if (!UUID.test(runId)) return { error: "معرّف الاستيراد غير صالح." };
  const sb = adminClient();
  const { data: run } = await sb.from("import_runs").select("id,status,summary,dataset,kind").eq("id", runId).maybeSingle();
  if (!run) return { error: "عملية الاستيراد غير موجودة." };
  if ((run as any).status !== "previewed") return { error: "هذه العملية نُفِّذت أو أُلغيت سابقاً؛ ابدأ معاينة جديدة." };

  const { data, error } = await sb.rpc("apply_import_v2", { p_run_id: runId, p_policy: policy });
  if (error) {
    // المعاملة تراجعت بالكامل؛ نسجّل الفشل
    await sb.from("import_runs").update({ status: "failed", error: error.message.slice(0, 500) }).eq("id", runId);
    await auditLog(email, "import_failed", runId);
    return { error: `فشل الاستيراد وتم التراجع عنه بالكامل (لم يُحفظ شيء): ${error.message.slice(0, 300)}` };
  }
  const rep = (data ?? {}) as Record<string, { added: number; updated: number; skipped: number }>;
  const invalid = new Map<string, number>((((run as any).summary?.rows ?? []) as SummaryRow[]).map((r) => [r.dataset, r.invalid]));
  const report: ReportRow[] = DATASETS.filter((k) => rep[k]).map((k) => ({ dataset: k, added: rep[k].added, updated: rep[k].updated, skipped: rep[k].skipped, failed: invalid.get(k) ?? 0 }));
  await auditLog(email, `import_commit:${policy}`, runId);
  revalidatePath("/", "layout");
  revalidatePath("/admin/import");
  return { report };
}

export async function undoImport(fd: FormData): Promise<void> {
  const email = await requireAdmin();
  const runId = String(fd.get("run_id") ?? "");
  if (!UUID.test(runId)) return;
  const { error } = await adminClient().rpc("undo_import_v2", { p_run_id: runId });
  await auditLog(email, error ? "import_undo_failed" : "import_undo", runId);
  revalidatePath("/", "layout");
  revalidatePath("/admin/import");
}

