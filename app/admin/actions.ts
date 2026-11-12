"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { COOKIE, allowedEmails, requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { validateSpecialty, type SpecialtyInput } from "@/lib/validate";

export type FormState = { error?: string; ok?: string };

/* ---------- الدخول والخروج ---------- */
export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { error: "لم يتم ضبط متغيرات Supabase بعد." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  // رسالة موحدة حتى لا نكشف هل البريد موجود أم لا
  if (error || !data.session || !allowedEmails().includes(email)) return { error: "بيانات الدخول غير صحيحة أو الحساب غير مصرّح له." };
  cookies().set(COOKIE, data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.session.expires_in,
  });
  redirect("/admin");
}

export async function logoutAction() {
  cookies().delete(COOKIE);
  redirect("/admin/login");
}

/* ---------- أدوات داخلية ---------- */
async function log(email: string, action: string, slug?: string) {
  await adminClient().from("audit_log").insert({ admin_email: email, action, slug: slug ?? null });
}

async function persist(v: SpecialtyInput): Promise<string | null> {
  const sb = adminClient();
  const { seuils, ...row } = v;
  const up = await sb.from("specialties").upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "slug" });
  if (up.error) return up.error.message;
  const del = await sb.from("thresholds").delete().eq("specialty_slug", v.slug);
  if (del.error) return del.error.message;
  if (seuils.length) {
    const ins = await sb.from("thresholds").insert(seuils.map((t) => ({ ...t, specialty_slug: v.slug })));
    if (ins.error) return ins.error.message;
  }
  return null;
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
  await adminClient().from("specialties").update({ published: publish, updated_at: new Date().toISOString() }).eq("slug", slug);
  await log(email, publish ? "publish" : "unpublish", slug);
  refresh();
  revalidatePath("/admin");
}

export async function deleteSpecialty(fd: FormData) {
  const email = await requireAdmin();
  const slug = String(fd.get("slug") ?? "");
  await adminClient().from("specialties").delete().eq("slug", slug);
  await log(email, "delete", slug);
  refresh();
  revalidatePath("/admin");
}

/* ---------- استيراد JSON ---------- */
export async function importJson(_: FormState, fd: FormData): Promise<FormState> {
  const email = await requireAdmin();
  let text = String(fd.get("json") ?? "").trim();
  const file = fd.get("file");
  if (file && typeof file !== "string" && file.size > 0) text = (await file.text()).trim();
  if (!text) return { error: "ألصق JSON أو اختر ملفاً." };

  let data: unknown;
  try { data = JSON.parse(text); } catch { return { error: "JSON غير صالح." }; }
  if (!Array.isArray(data) || !data.length) return { error: "يجب أن يكون الملف مصفوفة (Array) من التخصصات." };

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
