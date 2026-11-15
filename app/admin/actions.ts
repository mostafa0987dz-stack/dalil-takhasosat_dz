"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { COOKIE, allowedEmails, requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { validateSpecialty, type SpecialtyInput } from "@/lib/validate";
import { csvToSpecialties } from "@/lib/csv";

export type FormState = { error?: string; ok?: string };

/* ---------- الدخول والخروج ---------- */
export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { error: "لم يتم ضبط متغيرات Supabase بعد." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 256) return { error: "تحقق من البريد الإلكتروني وكلمة المرور." };
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  // رسالة موحدة حتى لا نكشف هل البريد موجود أم لا
  if (error || !data.session || !allowedEmails().includes(email)) return { error: "بيانات الدخول غير صحيحة أو الحساب غير مصرّح له." };
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.min(data.session.expires_in || 3600, 60 * 60 * 24),
  });
  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
  redirect("/admin/login");
}

/* ---------- أدوات داخلية ---------- */
async function log(email: string, action: string, slug?: string) {
  await adminClient().from("audit_log").insert({ admin_email: email, action, slug: slug ?? null });
}

async function persist(v: SpecialtyInput): Promise<string | null> {
  const { seuils, ...row } = v;
  const { error } = await adminClient().rpc("save_specialty_bundle", {
    p_specialty: row,
    p_thresholds: seuils.map((t) => ({ ...t, specialty_slug: v.slug })),
  });
  return error?.message ?? null;
}

const refresh = () => revalidatePath("/", "layout");

/* ---------- إضافة وتعديل تخصص ---------- */
export async function saveSpecialty(_: FormState, fd: FormData): Promise<FormState> {
  const email = await requireAdmin();
  const isNew = fd.get("isNew") === "1";
  const lines = (k: string) => String(fd.get(k) ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const isDemo = fd.get("is_demo") === "on";

  // سطر العتبة: الشعبة | السنة | المعدل | ملاحظة
  const seuils = lines("seuils").map((l) => {
    const p = l.split("|").map((s) => s.trim());
    const m = (p[2] ?? "").replace(",", ".");
    return { serie: p[0], annee: Number(p[1]), moyenne: m === "" ? null : Number(m), remarque: p[3] || null, is_demo: isDemo };
  });

  const res = validateSpecialty({
    slug: fd.get("slug"), nom_ar: fd.get("nom_ar"), nom_fr: fd.get("nom_fr"), domaine: fd.get("domaine"),
    diplome: fd.get("diplome"), duree: fd.get("duree"), description_ar: fd.get("description_ar"),
    filiere: fd.getAll("filiere"), competences: lines("competences"), debouches: lines("debouches"),
    universites: lines("universites"), tags: String(fd.get("tags") ?? "").split(/[,،]/),
    published: fd.get("published") === "on", seuils,
  });
  if (!res.ok) return { error: res.error };

  if (isNew) {
    const { data } = await adminClient().from("specialties").select("slug").eq("slug", res.value.slug).maybeSingle();
    if (data) return { error: "هذا المعرّف مستخدم مسبقاً، اختر معرّفاً آخر." };
  }
  const err = await persist(res.value);
  if (err) return { error: err };
  await log(email, isNew ? "create" : "update", res.value.slug);
  refresh();
  redirect("/admin");
}

/* ---------- نشر / إلغاء نشر / حذف ---------- */
export async function togglePublish(fd: FormData) {
  const email = await requireAdmin();
  const slug = String(fd.get("slug") ?? "");
  const publish = fd.get("publish") === "1";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;
  const { error } = await adminClient().from("specialties").update({ published: publish, updated_at: new Date().toISOString() }).eq("slug", slug);
  if (error) throw new Error(`تعذر تحديث حالة النشر: ${error.message}`);
  await log(email, publish ? "publish" : "unpublish", slug);
  refresh();
  revalidatePath("/admin");
}

export async function deleteSpecialty(fd: FormData) {
  const email = await requireAdmin();
  const slug = String(fd.get("slug") ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;
  const { error } = await adminClient().from("specialties").delete().eq("slug", slug);
  if (error) throw new Error(`تعذر حذف التخصص: ${error.message}`);
  await log(email, "delete", slug);
  refresh();
  revalidatePath("/admin");
}

/* ---------- استيراد JSON ---------- */
export async function importJson(_: FormState, fd: FormData): Promise<FormState> {
  const email = await requireAdmin();
  let text = String(fd.get("json") ?? "").trim();
  const file = fd.get("file");
  if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "حجم الملف يتجاوز 5 ميغابايت." };
    text = (await file.text()).trim();
  }
  if (text.length > 5 * 1024 * 1024) return { error: "حجم البيانات يتجاوز 5 ميغابايت." };
  if (!text) return { error: "ألصق JSON/CSV أو اختر ملفاً." };

  const isCsv = (file && typeof file !== "string" && /\.csv$/i.test(file.name)) || !/^[\[{]/.test(text);
  let data: unknown;
  if (isCsv) {
    try { data = csvToSpecialties(text); } catch { return { error: "CSV غير صالح." }; }
  } else {
    try { data = JSON.parse(text); } catch { return { error: "JSON غير صالح." }; }
  }
  if (!Array.isArray(data) || !data.length) return { error: "يجب أن يكون الملف مصفوفة (Array) من التخصصات أو CSV بالأعمدة المطلوبة." };

  if (data.length > 1000) return { error: "يمكن استيراد 1000 تخصص كحد أقصى في العملية الواحدة." };
  const publish = fd.get("publish") === "on";
  const values: SpecialtyInput[] = [];
  for (let i = 0; i < data.length; i++) {
    const res = validateSpecialty({ ...data[i], published: publish });
    if (!res.ok) return { error: `العنصر رقم ${i + 1}: ${res.error}` };
    values.push(res.value);
  }
  for (const v of values) {
    const err = await persist(v);
    if (err) return { error: `${v.slug}: ${err}` };
  }
  await log(email, "import", `${values.length} items`);
  refresh();
  revalidatePath("/admin");
  return { ok: `تم استيراد ${values.length} تخصص ${publish ? "ونُشرت مباشرة" : "كمسودات (راجعها ثم انشرها)"}.` };
}

/* ---------- نسخ تخصص (Duplicate) ---------- */
export async function duplicateSpecialty(fd: FormData) {
  const email = await requireAdmin();
  const slug = String(fd.get("slug") ?? "");
  const sb = adminClient();
  const { data } = await sb.from("specialties").select("*, thresholds(*)").eq("slug", slug).maybeSingle();
  if (!data) return;

  // معرّف جديد غير مستخدم: slug-copy ثم slug-copy-2 ...
  let next = `${slug}-copy`;
  for (let n = 2; n < 50; n++) {
    const { data: hit } = await sb.from("specialties").select("slug").eq("slug", next).maybeSingle();
    if (!hit) break;
    next = `${slug}-copy-${n}`;
  }
  const { thresholds, updated_at, ...row } = data as any;
  const err = await persist({
    ...row,
    slug: next,
    nom_ar: `${row.nom_ar} (نسخة)`,
    published: false,
    seuils: (thresholds ?? []).map((t: any) => ({ serie: t.serie, annee: t.annee, moyenne: t.moyenne === null ? null : Number(t.moyenne), remarque: t.remarque, is_demo: t.is_demo })),
  });
  if (err) return;
  await log(email, "duplicate", `${slug} → ${next}`);
  refresh();
  redirect(`/admin/specialties/${next}`);
}

/* ---------- الإعلانات والإعدادات ---------- */
export async function createAdCampaign(_: FormState, fd: FormData): Promise<FormState> {
  const email = await requireAdmin();
  const title = String(fd.get("title") ?? "").trim();
  const target = String(fd.get("target_url") ?? "").trim();
  const source = String(fd.get("source") ?? "direct");
  const placement = String(fd.get("placement") ?? "inline");
  const price = Number(fd.get("monthly_price") ?? 0);
  if (title.length < 3 || title.length > 120) return { error: "عنوان الإعلان يجب أن يكون بين 3 و120 حرفاً." };
  try { const u = new URL(target); if (!['http:','https:'].includes(u.protocol)) throw new Error(); } catch { return { error: "أدخل رابطاً صحيحاً يبدأ بـ https:// أو http://." }; }
  if (!["direct", "adsense", "sponsored"].includes(source) || !["home", "specialty_top", "inline", "sidebar", "footer"].includes(placement) || !Number.isFinite(price) || price < 0) return { error: "تحقق من بيانات الحملة." };
  const locale = String(fd.get("locale") ?? "all");
  const imageUrl = String(fd.get("image_url") ?? "").trim();
  if (!["all", "ar", "fr", "en"].includes(locale)) return { error: "لغة الإعلان غير صالحة." };
  if (imageUrl) { try { const image = new URL(imageUrl); if (!["http:", "https:"].includes(image.protocol)) throw new Error(); } catch { return { error: "رابط صورة الإعلان غير صالح." }; } }
  const sb = adminClient();
  const { data: campaignId, error } = await sb.rpc("create_ad_campaign_bundle", {
    p_campaign: { name: title, source, monthly_price: price },
    p_ad: {
      title,
      target_url: target,
      placement,
      description: String(fd.get("description") ?? "").slice(0, 300),
      image_url: imageUrl || null,
      locale,
    },
  });
  if (error || !campaignId) return { error: error?.message ?? "تعذر إنشاء الحملة والإعلان." };
  await log(email, "ad_campaign_create", campaignId);
  revalidatePath("/admin/ads");
  return { ok: "تم إرسال الإعلان للمراجعة. لن يظهر قبل الموافقة عليه." };
}

export async function reviewAdCampaign(fd: FormData) {
  const email = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["active", "rejected", "paused"].includes(status)) return;
  const sb = adminClient();
  const { error } = await sb.from("ad_campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  const approval = status === "active"
    ? { approved_by: email, approved_at: new Date().toISOString() }
    : { approved_by: null, approved_at: null };
  const { error: adError } = await sb.from("ads").update(approval).eq("campaign_id", id);
  if (adError) throw new Error(`تم تحديث الحملة لكن تعذر تحديث اعتماد الإعلان: ${adError.message}`);
  await log(email, `ad_campaign_${status}`, id);
  revalidatePath("/admin/ads");
}

export async function saveSiteSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const languages = fd.getAll("languages").map(String).filter(x => ["ar", "fr", "en"].includes(x));
  if (!languages.includes("ar")) return { error: "يجب إبقاء اللغة العربية مفعّلة." };
  const value = { site_name: String(fd.get("site_name") ?? "").slice(0, 100), default_locale: String(fd.get("default_locale") ?? "ar"), enabled_locales: languages, ad_density: "balanced", ad_approval: "manual" };
  const { error } = await adminClient().from("site_settings").upsert({ key: "general", value, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { ok: "تم حفظ الإعدادات." };
}

/* ---------- إدارة شعب البكالوريا ---------- */
export async function saveBacSeries(fd: FormData) {
  const email = await requireAdmin();
  const slug = String(fd.get("slug") ?? "").trim().toLowerCase();
  const name_ar = String(fd.get("name_ar") ?? "").trim();
  const name_fr = String(fd.get("name_fr") ?? "").trim();
  const name_en = String(fd.get("name_en") ?? "").trim();
  const sort_order = Number(fd.get("sort_order") ?? 0);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || name_ar.length < 2 || name_ar.length > 100 || !Number.isInteger(sort_order) || sort_order < 0 || sort_order > 999) {
    throw new Error("تحقق من المعرّف والاسم العربي والترتيب.");
  }
  const { error } = await adminClient().from("bac_series").upsert({ slug, name_ar, name_fr, name_en, sort_order, is_active: fd.get("is_active") === "on", updated_at: new Date().toISOString() });
  if (error) throw new Error(`تعذر حفظ الشعبة: ${error.message}`);
  await log(email, "bac_series_save", slug);
  revalidatePath("/admin/series");
  revalidatePath("/bac");
}

export async function deleteBacSeries(fd: FormData) {
  const email = await requireAdmin();
  const slug = String(fd.get("slug") ?? "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;
  // لا نحذف الشعبة فعلياً حتى لا نفقد تاريخ العتبات المرتبط بها؛ نعطّلها فقط.
  const { error } = await adminClient().from("bac_series").update({ is_active: false, updated_at: new Date().toISOString() }).eq("slug", slug);
  if (error) throw new Error(`تعذر تعطيل الشعبة: ${error.message}`);
  await log(email, "bac_series_disable", slug);
  revalidatePath("/admin/series");
  revalidatePath("/bac");
}
