import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import UniversityForm from "@/components/admin/UniversityForm";

export const dynamic = "force-dynamic";

export default async function UniversitiesAdminPage() {
  await requireAdmin();
  const sb = adminClient();
  const [universitiesRes, ratesRes, linksRes] = await Promise.all([
    sb.from("universities").select("id,slug,name_ar,wilaya,city,is_published,updated_at").order("name_ar"),
    sb.from("acceptance_rates").select("id"),
    sb.from("university_specialties").select("id"),
  ]);
  const universities: any[] = universitiesRes.data ?? [];
  return <div className="space-y-6">
    <header><h1 className="section-title">إدارة الجامعات</h1><p className="mt-2 text-sm text-slate-500">أضف الجامعات، اربط كل جامعة بالتخصصات التي تدرّسها، ثم أدخل معدلات القبول حسب الشعبة والسنة مع المصدر. سجل السنوات مفتوح دون حد أقصى.</p></header>
    {universitiesRes.error ? <div role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">تعذر تحميل الجامعات. تأكد من تنفيذ migration الخاصة بالجامعات في Supabase. التفاصيل: {universitiesRes.error.message}</div> : null}
    <div className="grid gap-3 sm:grid-cols-3"><div className="card"><b className="text-2xl">{universities.length}</b><p className="text-sm text-slate-500">جامعة مسجلة</p></div><div className="card"><b className="text-2xl">{linksRes.data?.length ?? 0}</b><p className="text-sm text-slate-500">ربط جامعة بتخصص</p></div><div className="card"><b className="text-2xl">{ratesRes.data?.length ?? 0}</b><p className="text-sm text-slate-500">سجل معدل قبول</p></div></div>
    <section className="space-y-3"><h2 className="text-xl font-black">الجامعات المسجلة</h2>
      {universities.map((u) => <Link key={u.id} href={`/admin/universities/${u.id}`} className="card flex flex-wrap items-center justify-between gap-3 transition hover:border-blue-300"><span><b>{u.name_ar}</b><span className="mr-2 text-xs text-slate-500">{[u.wilaya,u.city].filter(Boolean).join(" · ")}</span><span className="mt-1 block text-xs text-slate-400" dir="ltr">{u.slug}</span></span><span className={`rounded-full px-3 py-1 text-xs font-bold ${u.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{u.is_published ? "منشورة" : "مسودة"}</span></Link>)}
      {!universities.length && !universitiesRes.error && <p className="card text-sm text-slate-500">لا توجد جامعات مسجلة بعد.</p>}
    </section>
    <section><h2 className="mb-3 text-xl font-black">إضافة جامعة</h2><UniversityForm/></section>
  </div>;
}
