import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import UniversityForm from "@/components/admin/UniversityForm";
import { deleteAcceptanceRate, deleteUniversity, deleteUniversitySpecialty, saveAcceptanceRate, saveUniversitySpecialty } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{id:string}> };

export default async function UniversityAdminDetail({params}:Props) {
  await requireAdmin();
  const {id} = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = adminClient();
  const [uRes, specialtiesRes, linksRes, ratesRes, seriesRes] = await Promise.all([
    sb.from("universities").select("*").eq("id",id).maybeSingle(),
    sb.from("specialties").select("slug,nom_ar").order("nom_ar"),
    sb.from("university_specialties").select("id,specialty_slug,faculty_name,is_active,specialties(nom_ar)").eq("university_id",id).order("specialty_slug"),
    sb.from("acceptance_rates").select("id,specialty_slug,bac_branch,year,score,source_url,source_title,is_official,notes").eq("university_id",id).order("year",{ascending:false}).order("bac_branch"),
    sb.from("bac_series").select("name_ar").eq("is_active",true).order("sort_order"),
  ]);
  const university = uRes.data;
  if (!university) notFound();
  const specialties: any[] = specialtiesRes.data ?? [];
  const links: any[] = linksRes.data ?? [];
  const rates: any[] = ratesRes.data ?? [];
  const branches = (seriesRes.data ?? []).map((s:any)=>s.name_ar).filter(Boolean);
  const fallbackBranches = ["علوم تجريبية","رياضيات","تقني رياضي","آداب وفلسفة","لغات أجنبية","تسيير واقتصاد"];
  const options = branches.length ? branches : fallbackBranches;
  return <div className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/admin/universities" className="text-sm text-blue-600">← كل الجامعات</Link><h1 className="section-title mt-2">{university.name_ar}</h1></div><form action={deleteUniversity}><input type="hidden" name="id" value={id}/><button className="btn-danger">حذف الجامعة وكل روابطها ومعدلاتها</button></form></div>
    <section><h2 className="mb-3 text-xl font-black">بيانات الجامعة</h2><UniversityForm initial={university}/></section>
    <section className="space-y-4"><div><h2 className="text-xl font-black">التخصصات المرتبطة</h2><p className="text-sm text-slate-500">لا يمكن إدخال معدل قبول قبل ربط التخصص بهذه الجامعة.</p></div>
      <form action={saveUniversitySpecialty} className="card grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="university_id" value={id}/><label className="text-sm font-bold">التخصص<select name="specialty_slug" required className="input mt-1"><option value="">اختر التخصص</option>{specialties.map((s)=><option key={s.slug} value={s.slug}>{s.nom_ar}</option>)}</select></label><label className="text-sm font-bold">الكلية / المعهد (اختياري)<input name="faculty_name" className="input mt-1"/></label><label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="is_active" defaultChecked/> مفعل</label><button className="btn-primary md:col-span-3">ربط التخصص بالجامعة</button></form>
      {links.map((link:any)=><div key={link.id} className="card flex flex-wrap items-center justify-between gap-3"><span><b>{link.specialties?.nom_ar ?? link.specialty_slug}</b>{link.faculty_name && <small className="mr-2 text-slate-500">{link.faculty_name}</small>}</span><div className="flex items-center gap-3 text-sm"><span>{link.is_active ? "مفعل" : "معطل"}</span><form action={deleteUniversitySpecialty}><input type="hidden" name="id" value={link.id}/><input type="hidden" name="university_id" value={id}/><button className="text-red-600 underline">إزالة الربط</button></form></div></div>)}
      {!links.length && <p className="text-sm text-slate-500">لم يتم ربط أي تخصص بعد.</p>}
    </section>
    <section className="space-y-4"><div><h2 className="text-xl font-black">معدلات القبول</h2><p className="text-sm text-slate-500">كل سجل مرتبط بتخصص وشعبة وسنة. يمكنك إضافة أي عدد من السنوات. اترك المعدل فارغاً إذا لم تتوفر قيمة موثقة، وأضف رابط المصدر متى أمكن.</p></div>
      <form action={saveAcceptanceRate} className="card grid gap-3 md:grid-cols-2 xl:grid-cols-3"><input type="hidden" name="university_id" value={id}/>
        <label className="text-sm font-bold">التخصص<select name="specialty_slug" required className="input mt-1"><option value="">اختر تخصصاً مرتبطاً</option>{links.map((l:any)=><option key={l.specialty_slug} value={l.specialty_slug}>{l.specialties?.nom_ar ?? l.specialty_slug}</option>)}</select></label>
        <label className="text-sm font-bold">شعبة البكالوريا<select name="bac_branch" required className="input mt-1"><option value="">اختر الشعبة</option>{options.map((b)=><option key={b} value={b}>{b}</option>)}</select></label>
        <label className="text-sm font-bold">السنة<input name="year" type="number" min="2000" max="2100" required defaultValue={new Date().getFullYear()} className="input mt-1"/></label>
        <label className="text-sm font-bold">معدل القبول / 20<input name="score" type="number" min="0" max="20" step="0.01" placeholder="اتركه فارغاً إن لم يتوفر" className="input mt-1"/></label>
        <label className="text-sm font-bold">رابط المصدر<input name="source_url" type="url" dir="ltr" placeholder="https://..." className="input mt-1"/></label>
        <label className="text-sm font-bold">عنوان المصدر<input name="source_title" className="input mt-1" placeholder="المنشور أو الوثيقة الرسمية"/></label>
        <label className="text-sm font-bold md:col-span-2 xl:col-span-3">ملاحظات<textarea name="notes" rows={2} className="input mt-1"/></label>
        <label className="flex items-center gap-2 text-sm font-bold md:col-span-2 xl:col-span-3"><input type="checkbox" name="is_official"/> تم التحقق من أن المصدر رسمي</label>
        <button className="btn-primary md:col-span-2 xl:col-span-3">حفظ سجل معدل القبول</button>
      </form>
      <div className="space-y-2">{rates.map((rate:any)=><div key={rate.id} className="card flex flex-wrap items-center justify-between gap-3"><div><b>{specialties.find((s)=>s.slug===rate.specialty_slug)?.nom_ar ?? rate.specialty_slug}</b><p className="mt-1 text-sm">{rate.bac_branch} · {rate.year} · {rate.score === null ? "غير متوفر" : `${Number(rate.score).toFixed(2)} / 20`}</p><p className="text-xs text-slate-500">{rate.source_url ? <a href={rate.source_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{rate.source_title || "المصدر"}</a> : "لا يوجد رابط مصدر"}{rate.is_official ? " · مصدر رسمي موثق" : ""}</p></div><form action={deleteAcceptanceRate}><input type="hidden" name="id" value={rate.id}/><input type="hidden" name="specialty_slug" value={rate.specialty_slug}/><button className="text-sm text-red-600 underline">حذف السجل</button></form></div>)}
        {!rates.length && <p className="text-sm text-slate-500">لا توجد معدلات مسجلة لهذه الجامعة بعد.</p>}</div>
    </section>
  </div>;
}
