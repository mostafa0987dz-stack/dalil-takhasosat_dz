import { safeUrl } from "./markdown";

export type BlogPostInput = {
  slug: string; title: string; excerpt: string; content_md: string; category_id: string | null; tags: string[]; author_name: string;
  cover_image_url: string | null; cover_image_alt: string | null; status: "draft" | "published"; published_at: string | null;
  seo_title: string | null; seo_description: string | null; og_image_url: string | null; canonical_url: string | null; keywords: string[];
  related_specialties: string[]; related_universities: string[];
};
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const orNull = (v: unknown, max: number) => txt(v, max) || null;
const list = (v: unknown, max: number, each: number) => Array.from(new Set(String(v ?? "").split(/[\n,،]/).map((x) => x.trim().slice(0, each)).filter(Boolean))).slice(0, max);

/** التوقيت المحلي للجزائر (UTC+1 بلا توقيت صيفي) من حقل datetime-local إلى ISO. */
export function algiersToIso(local: string): string | null {
  const m = local.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/);
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2]}:00+01:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export function isoToAlgiersLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 3600_000);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
}

export function validateBlogPost(raw: Record<string, unknown>, now = new Date()): Result<BlogPostInput> {
  const slug = txt(raw.slug, 120).toLowerCase();
  if (!SLUG.test(slug)) return { ok: false, error: "المعرّف (slug) يجب أن يكون لاتينياً صغيراً بشرطات، مثل how-to-choose-major." };
  const title = txt(raw.title, 200);
  if (title.length < 3) return { ok: false, error: "العنوان مطلوب (3 أحرف على الأقل)." };
  const content_md = String(raw.content_md ?? "").slice(0, 200_000);
  const status = raw.status === "published" ? "published" : "draft";
  if (status === "published" && content_md.trim().length < 20) return { ok: false, error: "لا يمكن نشر مقال بلا محتوى كافٍ." };
  const category_id = txt(raw.category_id, 40) || null;
  if (category_id && !UUID.test(category_id)) return { ok: false, error: "تصنيف غير صالح." };

  const img = (v: unknown, label: string): Result<string | null> => {
    const s = txt(v, 1000);
    if (!s) return { ok: true, value: null };
    const u = safeUrl(s, { allowMail: false });
    return u ? { ok: true, value: u } : { ok: false, error: `${label} غير صالح (http/https أو مسار داخلي).` };
  };
  const cover = img(raw.cover_image_url, "رابط الصورة الرئيسية"); if (!cover.ok) return cover;
  const og = img(raw.og_image_url, "رابط صورة المشاركة"); if (!og.ok) return og;
  let canonical: string | null = null;
  const c = txt(raw.canonical_url, 1000);
  if (c) { if (!/^https?:\/\//i.test(c) || !safeUrl(c)) return { ok: false, error: "الرابط الأساسي (canonical) يجب أن يكون https:// كاملاً." }; canonical = c; }

  let published_at: string | null = null;
  const pa = txt(raw.published_at, 40);
  if (pa) { published_at = algiersToIso(pa) ?? (Number.isNaN(Date.parse(pa)) ? null : new Date(pa).toISOString()); if (!published_at) return { ok: false, error: "تاريخ النشر غير صالح." }; }
  if (status === "published" && !published_at) published_at = now.toISOString();

  const rs = list(raw.related_specialties, 10, 90), ru = list(raw.related_universities, 10, 90);
  if ([...rs, ...ru].some((x) => !SLUG.test(x))) return { ok: false, error: "معرّفات التخصصات/الجامعات المرتبطة يجب أن تكون slug صالحة (سطر لكل معرّف)." };

  return { ok: true, value: {
    slug, title, excerpt: txt(raw.excerpt, 400), content_md, category_id, tags: list(raw.tags, 15, 40), author_name: txt(raw.author_name, 80),
    cover_image_url: cover.value, cover_image_alt: orNull(raw.cover_image_alt, 200), status, published_at,
    seo_title: orNull(raw.seo_title, 120), seo_description: orNull(raw.seo_description, 300), og_image_url: og.value, canonical_url: canonical,
    keywords: list(raw.keywords, 15, 40), related_specialties: rs, related_universities: ru,
  } };
}

/** حالة العرض: مسودة / مجدول / منشور. */
export function postState(p: { status: string; published_at: string | null }, now = new Date()): "draft" | "scheduled" | "published" {
  if (p.status !== "published") return "draft";
  return p.published_at && new Date(p.published_at).getTime() > now.getTime() ? "scheduled" : "published";
}
