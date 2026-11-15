"use client";

import { useFormState } from "react-dom";
import { createAdCampaign, type FormState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

const initialState: FormState = {};

export default function AdCampaignForm() {
  const [state, action] = useFormState(createAdCampaign, initialState);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <input name="title" required minLength={3} maxLength={120} placeholder="عنوان الإعلان" className="input" />
      <input name="target_url" required type="url" placeholder="رابط الوجهة https://..." className="input" />
      <textarea name="description" maxLength={300} placeholder="وصف مختصر" className="input md:col-span-2" />
      <input name="image_url" type="url" placeholder="رابط صورة الإعلان (اختياري)" className="input" />
      <select name="source" className="input" defaultValue="direct">
        <option value="direct">إعلان مباشر</option>
        <option value="adsense">AdSense</option>
        <option value="sponsored">ممول تعليمي</option>
      </select>
      <select name="placement" className="input" defaultValue="inline">
        <option value="inline">داخل المحتوى</option>
        <option value="home">الرئيسية</option>
        <option value="specialty_top">أعلى صفحة التخصص</option>
        <option value="sidebar">الشريط الجانبي</option>
        <option value="footer">أسفل الصفحة</option>
      </select>
      <select name="locale" className="input" defaultValue="all">
        <option value="all">كل اللغات</option>
        <option value="ar">العربية</option>
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
      <input name="monthly_price" type="number" min="0" step="0.01" defaultValue="0" placeholder="السعر الشهري بالدينار" className="input" />
      {state.error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-600 md:col-span-2">{state.ok}</p>}
      <SubmitButton>إرسال للمراجعة</SubmitButton>
    </form>
  );
}
