"use client";
import { useActionState } from "react";
import { saveUniversity, type FormState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

export default function UniversityForm({ initial }: { initial?: any }) {
  const [state, action] = useActionState(saveUniversity, {} as FormState);
  const item = initial ?? {};
  const field = (label: string, name: string, value: any, props: any = {}) => <label className="block text-sm font-bold">{label}<input name={name} defaultValue={value ?? ""} className="input mt-1" {...props}/></label>;
  return <form action={action} className="card space-y-4">
    {item.id && <input type="hidden" name="id" value={item.id}/>}
    <div className="grid gap-4 md:grid-cols-2">
      {field("المعرّف اللاتيني (slug)", "slug", item.slug, {required:true, readOnly:Boolean(item.id), dir:"ltr", placeholder:"universite-alger-1"})}
      {field("اسم الجامعة بالعربية", "name_ar", item.name_ar, {required:true})}
      {field("الاسم بالفرنسية", "name_fr", item.name_fr, {dir:"ltr"})}
      {field("نوع المؤسسة", "type", item.type, {placeholder:"جامعة / مركز جامعي / مدرسة عليا"})}
      {field("الولاية", "wilaya", item.wilaya)}
      {field("المدينة", "city", item.city)}
      {field("الموقع الرسمي", "website_url", item.website_url, {type:"url", dir:"ltr", placeholder:"https://..."})}
      {field("العنوان", "address", item.address)}
      {field("خط العرض", "latitude", item.latitude, {type:"number", step:"any", dir:"ltr"})}
      {field("خط الطول", "longitude", item.longitude, {type:"number", step:"any", dir:"ltr"})}
    </div>
    <label className="block text-sm font-bold">وصف الجامعة<textarea name="description_ar" rows={3} defaultValue={item.description_ar ?? ""} className="input mt-1"/></label>
    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="is_published" defaultChecked={Boolean(item.is_published)}/> نشر صفحة الجامعة للزوار</label>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <SubmitButton>{item.id ? "حفظ بيانات الجامعة" : "إنشاء الجامعة"}</SubmitButton>
  </form>;
}
