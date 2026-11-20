"use client";
import { useActionState, useState } from "react";
import { saveBlogPost, type FormState } from "@/app/admin/content-actions";
import { isoToAlgiersLocal } from "@/lib/blog-validate";
import MarkdownView from "@/components/blog/MarkdownView";
import SubmitButton from "./SubmitButton";

export type PostFormValue = {
  id?: string; slug: string; title: string; excerpt: string; content_md: string; category_id: string | null; tags: string[]; author_name: string;
  cover_image_url: string | null; cover_image_alt: string | null; status: "draft" | "published"; published_at: string | null;
  seo_title: string | null; seo_description: string | null; og_image_url: string | null; canonical_url: string | null; keywords: string[];
  related_specialties: string[]; related_universities: string[];
};
const EMPTY: PostFormValue = { slug: "", title: "", excerpt: "", content_md: "", category_id: null, tags: [], author_name: "", cover_image_url: null, cover_image_alt: null, status: "draft", published_at: null, seo_title: null, seo_description: null, og_image_url: null, canonical_url: null, keywords: [], related_specialties: [], related_universities: [] };
const initial: FormState = {};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold">{label}{hint && <small className="mr-2 font-normal text-slate-500">{hint}</small>}<div className="mt-1">{children}</div></label>;
}

export default function BlogPostForm({ post, categories, specialtySlugs, universitySlugs }: { post?: PostFormValue; categories: { id: string; name_ar: string }[]; specialtySlugs: string[]; universitySlugs: string[] }) {
  const p = post ?? EMPTY;
  const [state, action] = useActionState(saveBlogPost, initial);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [md, setMd] = useState(p.content_md);
  return (
    <form action={action} className="grid gap-6">
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <section className="card grid gap-4">
        <h2 className="text-lg font-black">المحتوى</h2>
        <Field label="العنوان"><input name="title" required defaultValue={p.title} className="input" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="المعرّف (slug)" hint="لاتيني صغير بشرطات"><input name="slug" required dir="ltr" defaultValue={p.slug} className="input" /></Field>
          <Field label="الكاتب"><input name="author_name" defaultValue={p.author_name} className="input" /></Field>
        </div>
        <Field label="المقتطف" hint="حتى 400 حرف؛ يظهر في البطاقات والبحث"><textarea name="excerpt" rows={2} defaultValue={p.excerpt} className="input" /></Field>
        <div>
          <div className="mb-2 flex gap-2" role="tablist" aria-label="وضع المحرر">
            <button type="button" role="tab" aria-selected={tab === "write"} onClick={() => setTab("write")} className={`chip ${tab === "write" ? "chip-active" : ""}`}>كتابة</button>
            <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className={`chip ${tab === "preview" ? "chip-active" : ""}`}>معاينة</button>
          </div>
          <textarea name="content_md" value={md} onChange={(e) => setMd(e.target.value)} rows={18} className={`input font-mono text-sm leading-7 ${tab === "write" ? "" : "hidden"}`} placeholder={"## عنوان فرعي\n\nفقرة مع **نص عريض** و[رابط](/specialties)\n\n- نقطة\n- نقطة\n\n![وصف الصورة](https://…)"} />
          {tab === "preview" && <div className="card min-h-[12rem]">{md.trim() ? <MarkdownView md={md} /> : <p className="text-sm text-slate-500">لا محتوى للمعاينة.</p>}</div>}
          <p className="mt-2 text-xs text-slate-500">يدعم: ## عناوين، قوائم - و1.، اقتباس &gt;، صور ![وصف](رابط)، روابط [نص](رابط)، **عريض**، *مائل*. لا يُسمح بوسوم HTML.</p>
        </div>
      </section>

      <section className="card grid gap-4 md:grid-cols-2">
        <h2 className="text-lg font-black md:col-span-2">النشر والتصنيف</h2>
        <Field label="الحالة"><select name="status" defaultValue={p.status} className="input"><option value="draft">مسودة</option><option value="published">منشور</option></select></Field>
        <Field label="وقت النشر" hint="بتوقيت الجزائر؛ المستقبلي = مجدول"><input type="datetime-local" name="published_at" defaultValue={isoToAlgiersLocal(p.published_at)} className="input" /></Field>
        <Field label="التصنيف"><select name="category_id" defaultValue={p.category_id ?? ""} className="input"><option value="">بلا تصنيف</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></Field>
        <Field label="الوسوم" hint="مفصولة بفاصلة"><input name="tags" defaultValue={p.tags.join("، ")} className="input" /></Field>
      </section>

      <section className="card grid gap-4 md:grid-cols-2">
        <h2 className="text-lg font-black md:col-span-2">الصورة الرئيسية</h2>
        <Field label="رابط الصورة" hint="https:// أو مسار يبدأ بـ /"><input name="cover_image_url" dir="ltr" defaultValue={p.cover_image_url ?? ""} className="input" /></Field>
        <Field label="النص البديل (alt)"><input name="cover_image_alt" defaultValue={p.cover_image_alt ?? ""} className="input" /></Field>
      </section>

      <section className="card grid gap-4 md:grid-cols-2">
        <h2 className="text-lg font-black md:col-span-2">روابط داخلية ذات صلة</h2>
        <Field label="تخصصات (slug في كل سطر)"><textarea name="related_specialties" rows={3} dir="ltr" list="spec-list" defaultValue={p.related_specialties.join("\n")} className="input" /></Field>
        <Field label="جامعات (slug في كل سطر)"><textarea name="related_universities" rows={3} dir="ltr" defaultValue={p.related_universities.join("\n")} className="input" /></Field>
        <p className="text-xs text-slate-500 md:col-span-2">المتاح — تخصصات: {specialtySlugs.slice(0, 40).join("، ") || "لا شيء"} · جامعات: {universitySlugs.slice(0, 30).join("، ") || "لا شيء"}</p>
      </section>

      <details className="card" open={Boolean(p.seo_title || p.seo_description || p.canonical_url || p.og_image_url || p.keywords.length)}>
        <summary className="cursor-pointer text-lg font-black">SEO</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Meta Title" hint="يُستعمل العنوان إن تُرك فارغاً"><input name="seo_title" defaultValue={p.seo_title ?? ""} className="input" /></Field>
          <Field label="Open Graph Image"><input name="og_image_url" dir="ltr" defaultValue={p.og_image_url ?? ""} className="input" /></Field>
          <Field label="Meta Description"><textarea name="seo_description" rows={2} defaultValue={p.seo_description ?? ""} className="input md:col-span-2" /></Field>
          <Field label="Canonical URL" hint="عند الحاجة فقط (https:// كامل)"><input name="canonical_url" dir="ltr" defaultValue={p.canonical_url ?? ""} className="input" /></Field>
          <Field label="الكلمات المفتاحية" hint="عند الحاجة، مفصولة بفاصلة"><input name="keywords" defaultValue={p.keywords.join("، ")} className="input" /></Field>
        </div>
      </details>

      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{state.ok}</p>}
      <div className="sticky bottom-0 z-20 -mx-2 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/95 p-3 dark:border-slate-800 dark:bg-slate-900/95"><SubmitButton>حفظ المقال</SubmitButton></div>
    </form>
  );
}
