import { describe, expect, it } from "vitest";
import { crc32, readZip, checkEntryName, type ZipLimits } from "../import/zip";
import { parseBundle, validateDataset } from "../import/datasets";

const enc = (s: string) => new TextEncoder().encode(s);
const u32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
const u16 = (n: number) => [n & 255, (n >>> 8) & 255];

async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const s = new Blob([data as unknown as BlobPart]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
/** يبني ملف ZIP للاختبار (stored أو deflate). */
async function makeZip(files: { name: string; data: string | Uint8Array; deflate?: boolean; badCrc?: boolean }[]): Promise<Uint8Array> {
  const parts: number[][] = []; const central: number[][] = []; let offset = 0;
  for (const f of files) {
    const raw = typeof f.data === "string" ? enc(f.data) : f.data;
    const comp = f.deflate ? await deflateRaw(raw) : raw;
    const nameBytes = Array.from(enc(f.name));
    const crc = crc32(raw) ^ (f.badCrc ? 1 : 0);
    const local = [...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(f.deflate ? 8 : 0), ...u16(0), ...u16(0), ...u32(crc >>> 0), ...u32(comp.length), ...u32(raw.length), ...u16(nameBytes.length), ...u16(0), ...nameBytes];
    parts.push(local, Array.from(comp));
    central.push([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(f.deflate ? 8 : 0), ...u16(0), ...u16(0), ...u32(crc >>> 0), ...u32(comp.length), ...u32(raw.length), ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nameBytes]);
    offset += local.length + comp.length;
  }
  const cd = central.flat();
  const eocd = [...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cd.length), ...u32(offset), ...u16(0)];
  return new Uint8Array([...parts.flat(), ...cd, ...eocd]);
}
const dec = (b: Uint8Array) => new TextDecoder().decode(b);
async function fails(p: Promise<unknown>): Promise<boolean> { try { await p; return false; } catch { return true; } }

describe("readZip", () => {
  it("يقرأ ملفات stored وdeflate بمحتوى مطابق", async () => {
    const zip = await makeZip([{ name: "a.json", data: '{"x":1}' }, { name: "b.json", data: '{"y":"مرحبا"}', deflate: true }]);
    const out = await readZip(zip);
    expect(out.map((e) => e.name).join(",")).toBe("a.json,b.json");
    expect(dec(out[1].data)).toBe('{"y":"مرحبا"}');
  });
  it("يرفض المسارات الخطرة والمطلقة", async () => {
    expect(await fails(readZip(await makeZip([{ name: "../evil.json", data: "{}" }])))).toBe(true);
    expect(await fails(readZip(await makeZip([{ name: "/abs.json", data: "{}" }])))).toBe(true);
    expect(checkEntryName("a\\b.json")).not.toBeNull();
  });
  it("يرفض الملفات غير JSON (تنفيذية وغيرها)", async () => {
    expect(await fails(readZip(await makeZip([{ name: "run.exe", data: "MZ" }])))).toBe(true);
    expect(await fails(readZip(await makeZip([{ name: "x.sh", data: "rm -rf /" }])))).toBe(true);
  });
  it("يكشف تلف البيانات (CRC)", async () => {
    expect(await fails(readZip(await makeZip([{ name: "a.json", data: "{}", badCrc: true }])))).toBe(true);
  });
  it("يطبّق الحدود: عدد الملفات وحجم الملف", async () => {
    const lim: ZipLimits = { maxZipBytes: 1e6, maxEntries: 1, maxFileBytes: 10, maxTotalBytes: 1e6 };
    expect(await fails(readZip(await makeZip([{ name: "a.json", data: "{}" }, { name: "b.json", data: "{}" }]), lim))).toBe(true);
    expect(await fails(readZip(await makeZip([{ name: "a.json", data: "x".repeat(50) }]), lim))).toBe(true);
  });
  it("يرفض ملفاً ليس ZIP", async () => {
    expect(await fails(readZip(enc("هذا ليس zip إطلاقاً ولا يحتوي توقيعاً صحيحاً")))).toBe(true);
  });
});

const ctx = { allowedSeries: ["علوم تجريبية", "رياضيات", "تقني رياضي"] };

describe("validateDataset", () => {
  it("الجامعات: صالح، مكرر، رابط خاطئ", () => {
    const r = validateDataset("universities", [
      { slug: "u-1", name_ar: "جامعة 1" }, { slug: "u-1", name_ar: "مكرر" }, { slug: "u-2", name_ar: "جامعة 2", website_url: "javascript:alert(1)" },
    ], ctx);
    expect(r.rows.length).toBe(1);
    expect(r.issues.length).toBe(2);
  });
  it("العتبات: رسمي بلا مصدر وشعبة مجهولة", () => {
    const base = { university_slug: "u-1", specialty_slug: "medecine", bac_branch: "علوم تجريبية", year: 2026, score: 16.3 };
    expect(validateDataset("thresholds", [base], ctx).rows.length).toBe(1);
    expect(validateDataset("thresholds", [{ ...base, is_official: true }], ctx).issues.length).toBe(1);
    expect(validateDataset("thresholds", [{ ...base, bac_branch: "وهمية" }], ctx).issues.length).toBe(1);
    expect(validateDataset("thresholds", [{ ...base, score: 25 }], ctx).issues.length).toBe(1);
  });
  it("التخصصات تُحوَّل إلى غير منشورة مع thresholds", () => {
    const r = validateDataset("specialties", [{ slug: "x-y", nom_ar: "س", domaine: "د", diplome: "ل", duree: "3", description_ar: "وصف", filiere: ["رياضيات"], published: true, seuils: [{ serie: "رياضيات", annee: 2025, moyenne: 14 }] }], ctx);
    expect(r.rows[0].published).toBe(false);
    expect(r.rows[0].thresholds.length).toBe(1);
  });
  it("المقالات تُحوَّل إلى مسودة وتحمل category_slug", () => {
    const r = validateDataset("articles", [{ slug: "post-1", title: "عنوان المقال", content_md: "محتوى كاف للمقال هنا", status: "published", category_slug: "guide" }], ctx);
    expect(r.rows[0].category_slug).toBe("guide");
    expect("status" in r.rows[0]).toBe(false);
  });
});

describe("parseBundle", () => {
  const manifest = (counts: object) => JSON.stringify({ schema_version: 1, created_at: "2026-11-20T10:00:00Z", counts, sources: [{ title: "منشور", url: "https://a.dz" }] });
  const unis = JSON.stringify([{ slug: "u-1", name_ar: "جامعة 1" }]);
  it("أرشيف صالح مع manifest مطابق", async () => {
    const entries = await readZip(await makeZip([{ name: "manifest.json", data: manifest({ universities: 1 }) }, { name: "universities.json", data: unis, deflate: true }]));
    const r = parseBundle(entries, ctx);
    expect(r.issues.length).toBe(0);
    expect(r.payload.universities?.length).toBe(1);
    expect(r.manifest?.sources.length).toBe(1);
  });
  it("عدم تطابق الأعداد في manifest خطأ", async () => {
    const entries = await readZip(await makeZip([{ name: "manifest.json", data: manifest({ universities: 5 }) }, { name: "universities.json", data: unis }]));
    expect(parseBundle(entries, ctx).issues.some((i) => i.dataset === "manifest")).toBe(true);
  });
  it("غياب manifest وملف مجهول أخطاء", async () => {
    const entries = await readZip(await makeZip([{ name: "universities.json", data: unis }, { name: "other.json", data: "[]" }]));
    const r = parseBundle(entries, ctx);
    expect(r.issues.some((i) => /manifest/.test(i.message))).toBe(true);
    expect(r.issues.some((i) => /other.json/.test(i.message))).toBe(true);
  });
  it("مجلد جذر واحد يُزال تلقائياً", async () => {
    const entries = await readZip(await makeZip([{ name: "data/manifest.json", data: manifest({ universities: 1 }) }, { name: "data/universities.json", data: unis }]));
    expect(parseBundle(entries, ctx).issues.length).toBe(0);
  });
});
