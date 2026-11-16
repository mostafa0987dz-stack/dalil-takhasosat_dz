import Link from "next/link";
import { FileUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import UniversityForm from "@/components/admin/UniversityForm";
import UniversitiesList, { type UniversityRowView } from "@/components/admin/UniversitiesList";

export const dynamic = "force-dynamic";

const count = (v: any): number => (Array.isArray(v) && typeof v[0]?.count === "number" ? v[0].count : 0);

export default async function UniversitiesAdminPage() {
  await requireAdmin();
  const { data, error } = await adminClient()
    .from("universities")
    .select("id,slug,name_ar,type,wilaya,city,is_published,university_specialties(count),acceptance_rates(count)")
    .order("name_ar");
  const rows: UniversityRowView[] = ((data ?? []) as any[]).map((u) => ({
    id: u.id, slug: u.slug, name_ar: u.name_ar, type: u.type, wilaya: u.wilaya, city: u.city, is_published: u.is_published,
    specialties: count(u.university_specialties), rates: count(u.acceptance_rates),
  }));
  const totalRates = rows.reduce((n, r) => n + r.rates, 0);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="section-title">الجامعات</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">تُرفع الجامعات ومعدلات القبول دفعة واحدة من ملف JSON. من هنا تعدّل بيانات كل جامعة وتربطها بالتخصصات.</p>
      </div>
      <Link href="/admin/import#universities" className="btn-primary"><FileUp size={16} />رفع ملف JSON</Link>
    </header>
    {error ? <div role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">تعذر تحميل الجامعات. تأكد من تنفيذ migration الخاصة بالجامعات في Supabase. التفاصيل: {error.message}</div> : null}
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="card"><b className="text-3xl">{rows.length}</b><p className="text-sm text-slate-500">جامعة مسجلة</p></div>
      <div className="card"><b className="text-3xl">{rows.filter((r) => r.is_published).length}</b><p className="text-sm text-slate-500">منشورة للزوار</p></div>
      <div className="card"><b className="text-3xl">{totalRates}</b><p className="text-sm text-slate-500">سجل معدل قبول</p></div>
    </div>
    {rows.length ? <UniversitiesList rows={rows} /> : !error && <p className="card text-sm text-slate-500">لا توجد جامعات بعد. ارفع ملف JSON أو أضف جامعة يدوياً.</p>}
    <details className="card">
      <summary className="cursor-pointer text-lg font-black">إضافة جامعة يدوياً</summary>
      <div className="mt-4"><UniversityForm/></div>
    </details>
  </div>;
}
