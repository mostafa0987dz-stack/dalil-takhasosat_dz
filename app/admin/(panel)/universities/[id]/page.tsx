import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import UniversityForm from "@/components/admin/UniversityForm";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { deleteUniversity, deleteUniversitySpecialty, saveUniversitySpecialty } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{id:string}> };

export default async function UniversityAdminDetail({params}:Props) {
  await requireAdmin();
  const {id} = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = adminClient();
  const [uRes, specialtiesRes, linksRes, rateCountRes, latestRes] = await Promise.all([
    sb.from("universities").select("*").eq("id",id).maybeSingle(),
    sb.from("specialties").select("slug,nom_ar").order("nom_ar"),
    sb.from("university_specialties").select("id,specialty_slug,faculty_name,is_active,specialties(nom_ar)").eq("university_id",id).order("specialty_slug"),
    sb.from("acceptance_rates").select("id",{count:"exact",head:true}).eq("university_id",id),
    sb.from("acceptance_rates").select("year").eq("university_id",id).order("year",{ascending:false}).limit(1),
  ]);
  const university = uRes.data;
  if (!university) notFound();
  const specialties: any[] = specialtiesRes.data ?? [];
  const links: any[] = linksRes.data ?? [];
  const ratesTotal = rateCountRes.count ?? 0;
  const latestYear = (latestRes.data as any[] | null)?.[0]?.year ?? null;
  const linkedSlugs = new Set(links.map((l) => l.specialty_slug));

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Link href="/admin/universities" className="text-sm text-blue-600">← كل الجامعات</Link><h1 className="section-title mt-2">{university.name_ar}</h1></div>
      <form action={deleteUniversity}><input type="hidden" name="id" value={id}/><ConfirmSubmit message="حذف الجامعة نهائياً مع كل روابطها ومعدلات القبول المسجلة لها؟ لا يمكن التراجع.">حذف الجامعة</ConfirmSubmit></form>
    </div>

    <section className="card flex flex-wrap items-center justify-between gap-4" aria-label="ملخص معدلات القبول">
      <div className="flex flex-wrap gap-6">
        <div><b className="block text-3xl">{ratesTotal}</b><span className="text-sm text-slate-500">سجل معدل قبول</span></div>
        <div><b className="block text-3xl">{links.length}</b><span className="text-sm text-slate-500">تخصص مرتبط</span></div>
        <div><b className="block text-3xl">{latestYear ?? "—"}</b><span className="text-sm text-slate-500">آخر سنة مسجلة</span></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="btn-ghost" href={`/admin/export?type=universities&slug=${university.slug}`}><Download size={15}/>تصدير هذه الجامعة</a>
        <Link className="btn-ghost" href={`/admin/universities/${id}/rates`}>إدارة المعدلات يدوياً</Link>
        <Link className="btn-primary !py-2" href="/admin/import#universities"><FileUp size={15}/>رفع معدلات (JSON)</Link>
      </div>
      <p className="w-full text-xs leading-6 text-slate-500">يمكنك تعديل المعدلات يدوياً من «إدارة المعدلات يدوياً»، أو دفعة واحدة بالملف: صدّر هذه الجامعة، عدّل الملف، ثم ارفعه (خيار «استبدال معدلات القبول» يحذف القديم منها).</p>
    </section>

    <section><h2 className="mb-3 text-xl font-black">بيانات الجامعة</h2><UniversityForm initial={university}/></section>

    <section className="space-y-4"><div><h2 className="text-xl font-black">التخصصات المرتبطة</h2><p className="text-sm text-slate-500">يُنشأ الربط تلقائياً عند رفع الملف، ويمكنك إضافته أو إزالته يدوياً هنا.</p></div>
      <form action={saveUniversitySpecialty} className="card grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="university_id" value={id}/><label className="text-sm font-bold">التخصص<select name="specialty_slug" required className="input mt-1"><option value="">اختر التخصص</option>{specialties.filter((s)=>!linkedSlugs.has(s.slug)).map((s)=><option key={s.slug} value={s.slug}>{s.nom_ar}</option>)}</select></label><label className="text-sm font-bold">الكلية / المعهد (اختياري)<input name="faculty_name" className="input mt-1"/></label><label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="is_active" defaultChecked/> مفعل</label><button className="btn-primary md:col-span-3">ربط التخصص بالجامعة</button></form>
      <div className="grid gap-3 md:grid-cols-2">
        {links.map((link:any)=><div key={link.id} className="card flex flex-wrap items-center justify-between gap-3"><span><b>{link.specialties?.nom_ar ?? link.specialty_slug}</b>{link.faculty_name && <small className="mr-2 text-slate-500">{link.faculty_name}</small>}</span><div className="flex items-center gap-3 text-sm"><span className={link.is_active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}>{link.is_active ? "مفعل" : "معطل"}</span><form action={deleteUniversitySpecialty}><input type="hidden" name="id" value={link.id}/><input type="hidden" name="university_id" value={id}/><ConfirmSubmit className="text-red-600 underline" message="إزالة ربط التخصص بالجامعة؟ (تبقى سجلات المعدلات مخفية حتى إعادة الربط)">إزالة الربط</ConfirmSubmit></form></div></div>)}
      </div>
      {!links.length && <p className="text-sm text-slate-500">لم يتم ربط أي تخصص بعد.</p>}
    </section>
  </div>;
}
