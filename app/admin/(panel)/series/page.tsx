import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { saveBacSeries, deleteBacSeries } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function BacSeriesAdminPage() {
  await requireAdmin();
  const { data, error } = await adminClient().from("bac_series").select("*").order("sort_order").order("name_ar");
  const series = data ?? [];
  return <div className="space-y-6">
    <div><h1 className="section-title">إدارة شعب البكالوريا</h1><p className="mt-2 text-sm text-slate-500">إضافة الشعب وتعديل أسمائها وترتيبها وتفعيلها. تعطيل الشعبة يحافظ على بيانات العتبات القديمة.</p></div>
    {error && <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">تعذر قراءة جدول الشعب. نفّذ ملف التحديث <code>supabase/migrations/20261116_admin_enhancements.sql</code> في Supabase. التفاصيل: {error.message}</div>}
    <form action={saveBacSeries} className="card grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <h2 className="text-lg font-black md:col-span-2 xl:col-span-5">إضافة شعبة جديدة</h2>
      <label className="text-sm font-bold">المعرّف <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="sciences-experimentales" className="input mt-1" /></label>
      <label className="text-sm font-bold">الاسم بالعربية <input name="name_ar" required className="input mt-1" /></label>
      <label className="text-sm font-bold">الاسم بالفرنسية <input name="name_fr" className="input mt-1" /></label>
      <label className="text-sm font-bold">الاسم بالإنجليزية <input name="name_en" className="input mt-1" /></label>
      <label className="text-sm font-bold">الترتيب <input name="sort_order" type="number" min="0" defaultValue="10" className="input mt-1" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked /> مفعّلة</label>
      <div className="md:col-span-2 xl:col-span-5"><button className="btn-primary">إضافة الشعبة</button></div>
    </form>
    <div className="space-y-4">
      {series.map((item: any) => <form action={saveBacSeries} key={item.slug} className="card grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input type="hidden" name="slug" value={item.slug}/>
        <label className="text-sm font-bold">المعرّف<input value={item.slug} readOnly className="input mt-1 opacity-70"/></label>
        <label className="text-sm font-bold">العربية<input name="name_ar" defaultValue={item.name_ar} required className="input mt-1"/></label>
        <label className="text-sm font-bold">Français<input name="name_fr" defaultValue={item.name_fr ?? ""} className="input mt-1"/></label>
        <label className="text-sm font-bold">English<input name="name_en" defaultValue={item.name_en ?? ""} className="input mt-1"/></label>
        <label className="text-sm font-bold">الترتيب<input name="sort_order" type="number" min="0" defaultValue={item.sort_order} className="input mt-1"/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={item.is_active}/> مفعّلة</label>
        <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-5"><button className="btn-primary !py-2">حفظ التعديلات</button>{item.is_active && <button formAction={deleteBacSeries} className="btn-danger">تعطيل الشعبة</button>}<span className="self-center text-xs text-slate-500">{item.is_active ? "نشطة" : "معطّلة"}</span></div>
      </form>)}
      {!series.length && !error && <p className="card text-center text-slate-500">لا توجد شعب بعد. أضف أول شعبة من النموذج أعلاه.</p>}
    </div>
  </div>;
}
