"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { auditLog } from "@/lib/admin-log";
import { validateBlogPost } from "@/lib/blog-validate";
import { normalizeFooter } from "@/lib/footer";

export type FormState = { error?: string; ok?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function revalidateBlog(slug?: string) {
  revalidatePath("/blog"); revalidatePath("/"); revalidatePath("/sitemap.xml"); revalidatePath("/blog/rss.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog/category/[slug]", "page");
}

/* ---------- المقالات ---------- */
export async function saveBlogPost(_: FormState, fd: FormData): Promise<FormState> {
  const email = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (id && !UUID.test(id)) return { error: "معرّف المقال غير صالح." };
  const parsed = validateBlogPost(Object.fromEntries(fd.entries()));
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.value;
  const sb = adminClient();

  // التحقق من وجود التصنيف والتخصصات والجامعات المرتبطة (روابط داخلية صحيحة فقط)
  if (v.category_id) { const { data } = await sb.from("blog_categories").select("id").eq("id", v.category_id).maybeSingle(); if (!data) return { error: "التصنيف غير موجود." }; }
  if (v.related_specialties.length) {
    const { data } = await sb.from("specialties").select("slug").in("slug", v.related_specialties);
    const have = new Set((data ?? []).map((r: any) => r.slug));
    const miss = v.related_specialties.filter((s) => !have.has(s));
    if (miss.length) return { error: `تخصصات مرتبطة غير موجودة: ${miss.join("، ")}` };
  }
  if (v.related_universities.length) {
    const { data } = await sb.from("universities").select("slug").in("slug", v.related_universities);
    const have = new Set((data ?? []).map((r: any) => r.slug));
    const miss = v.related_universities.filter((s) => !have.has(s));
    if (miss.length) return { error: `جامعات مرتبطة غير موجودة: ${miss.join("، ")}` };
  }

  const row = { ...v, updated_at: new Date().toISOString() };
  let savedId = id;
  if (id) {
    const { error } = await sb.from("blog_posts").update(row).eq("id", id);
    if (error) return { error: /duplicate|unique/i.test(error.message) ? "هذا المعرّف (slug) مستعمل في مقال آخر." : `تعذر الحفظ: ${error.message}` };
  } else {
    const { data, error } = await sb.from("blog_posts").insert(row).select("id").single();
    if (error || !data) return { error: /duplicate|unique/i.test(error?.message ?? "") ? "هذا المعرّف (slug) مستعمل في مقال آخر." : `تعذر الحفظ: ${error?.message}` };
    savedId = (data as { id: string }).id;
  }
  await auditLog(email, id ? "update_post" : "create_post", v.slug);
  revalidateBlog(v.slug);
  revalidatePath("/admin/blog");
  if (!id) redirect(`/admin/blog/${savedId}`);
  return { ok: "تم الحفظ." };
}

export async function deleteBlogPost(fd: FormData) {
  const email = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID.test(id)) return;
  const sb = adminClient();
  const { data } = await sb.from("blog_posts").select("slug").eq("id", id).maybeSingle();
  await sb.from("blog_posts").delete().eq("id", id);
  await auditLog(email, "delete_post", (data as any)?.slug);
  revalidateBlog((data as any)?.slug);
  revalidatePath("/admin/blog");
}

export async function setPostStatus(fd: FormData) {
  const email = await requireAdmin();
  const id = String(fd.get("id") ?? ""), publish = String(fd.get("publish") ?? "") === "1";
  if (!UUID.test(id)) return;
  const sb = adminClient();
  const { data } = await sb.from("blog_posts").select("slug,published_at,content_md").eq("id", id).maybeSingle();
  if (!data) return;
  const p = data as { slug: string; published_at: string | null; content_md: string };
  if (publish && p.content_md.trim().length < 20) return;
  await sb.from("blog_posts").update({ status: publish ? "published" : "draft", published_at: publish ? (p.published_at ?? new Date().toISOString()) : p.published_at, updated_at: new Date().toISOString() }).eq("id", id);
  await auditLog(email, publish ? "publish_post" : "unpublish_post", p.slug);
  revalidateBlog(p.slug);
  revalidatePath("/admin/blog");
}

/* ---------- التصنيفات ---------- */
export async function saveBlogCategory(_: FormState, fd: FormData): Promise<FormState> {
  const email = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const slug = String(fd.get("slug") ?? "").trim().toLowerCase();
  const name_ar = String(fd.get("name_ar") ?? "").trim().slice(0, 80);
  const description_ar = String(fd.get("description_ar") ?? "").trim().slice(0, 300) || null;
  const sort_order = Math.max(0, Math.min(999, Number(fd.get("sort_order") ?? 0) || 0));
  if (id && !UUID.test(id)) return { error: "تصنيف غير صالح." };
  if (!SLUG.test(slug)) return { error: "معرّف التصنيف (slug) غير صالح." };
  if (name_ar.length < 2) return { error: "اسم التصنيف مطلوب." };
  const sb = adminClient();
  const { error } = id
    ? await sb.from("blog_categories").update({ slug, name_ar, description_ar, sort_order }).eq("id", id)
    : await sb.from("blog_categories").insert({ slug, name_ar, description_ar, sort_order });
  if (error) return { error: /duplicate|unique/i.test(error.message) ? "هذا المعرّف مستعمل في تصنيف آخر." : `تعذر الحفظ: ${error.message}` };
  await auditLog(email, id ? "update_blog_category" : "create_blog_category", slug);
  revalidateBlog();
  revalidatePath("/admin/blog/categories");
  return { ok: "تم الحفظ." };
}

export async function deleteBlogCategory(fd: FormData) {
  const email = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID.test(id)) return;
  await adminClient().from("blog_categories").delete().eq("id", id); // المقالات تبقى بلا تصنيف (on delete set null)
  await auditLog(email, "delete_blog_category", id);
  revalidateBlog();
  revalidatePath("/admin/blog/categories");
}

/* ---------- الفوتر ---------- */
const parseLinks = (v: FormDataEntryValue | null) => String(v ?? "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [label, ...rest] = l.split("|"); return { label: (label ?? "").trim(), href: rest.join("|").trim() }; });

export async function saveFooterSettings(_: FormState, fd: FormData): Promise<FormState> {
  const email = await requireAdmin();
  const raw = {
    about: { description: fd.get("description") },
    quick: parseLinks(fd.get("quick")), help: parseLinks(fd.get("help")),
    contact: { email: fd.get("email"), phone: fd.get("phone"), address: fd.get("address") },
    social: { facebook: fd.get("facebook"), instagram: fd.get("instagram"), telegram: fd.get("telegram"), twitter: fd.get("twitter"), youtube: fd.get("youtube") },
    copyright: fd.get("copyright"),
    show: { about: fd.get("show_about") === "on", quick: fd.get("show_quick") === "on", help: fd.get("show_help") === "on", contact: fd.get("show_contact") === "on" },
  };
  // روابط/عناوين اجتماعية غير صالحة تُرفض صراحةً بدل إسقاطها بصمت
  for (const k of ["facebook", "instagram", "telegram", "twitter", "youtube"] as const) {
    const s = String(fd.get(k) ?? "").trim();
    if (s && !/^https?:\/\/[^\s]+$/i.test(s)) return { error: `رابط ${k} يجب أن يبدأ بـ https://` };
  }
  const email_v = String(fd.get("email") ?? "").trim();
  if (email_v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_v)) return { error: "البريد الإلكتروني غير صالح." };
  const lines = [...parseLinks(fd.get("quick")), ...parseLinks(fd.get("help"))];
  const bad = lines.find((l) => !l.label || !l.href);
  if (bad) return { error: "كل رابط يكتب بالشكل: النص | الرابط (مثال: المدونة | /blog)." };
  const value = normalizeFooter(raw);
  const { error } = await adminClient().from("site_settings").upsert({ key: "footer", value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { error: `تعذر الحفظ: ${error.message}` };
  await auditLog(email, "save_footer");
  revalidatePath("/", "layout");
  return { ok: "تم حفظ إعدادات الفوتر." };
}
