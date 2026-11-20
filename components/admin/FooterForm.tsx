"use client";
import { useActionState } from "react";
import { saveFooterSettings, type FormState } from "@/app/admin/content-actions";
import type { FooterSettings } from "@/lib/footer";
import SubmitButton from "./SubmitButton";

const initial: FormState = {};
const lines = (l: { label: string; href: string }[]) => l.map((x) => `${x.label} | ${x.href}`).join("\n");

export default function FooterForm({ value }: { value: FooterSettings }) {
  const [state, action] = useActionState(saveFooterSettings, initial);
  const chk = (name: string, label: string, on: boolean) => <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={on} />{label}</label>;
  return (
    <form action={action} className="grid gap-6">
      <section className="card grid gap-3"><h2 className="text-lg font-black">الأقسام الظاهرة</h2>
        <div className="flex flex-wrap gap-4">{chk("show_about", "عن المنصة", value.show.about)}{chk("show_quick", "روابط مهمة", value.show.quick)}{chk("show_help", "المساعدة", value.show.help)}{chk("show_contact", "التواصل", value.show.contact)}</div></section>
      <section className="card grid gap-3"><h2 className="text-lg font-black">عن المنصة</h2>
        <label className="text-sm font-bold">الوصف<textarea name="description" rows={3} defaultValue={value.about.description} className="input mt-1" /></label></section>
      <section className="card grid gap-3 md:grid-cols-2"><h2 className="text-lg font-black md:col-span-2">الروابط</h2>
        <label className="text-sm font-bold">روابط مهمة<small className="mr-2 font-normal text-slate-500">سطر لكل رابط: النص | الرابط</small><textarea name="quick" rows={7} defaultValue={lines(value.quick)} className="input mt-1 font-mono text-sm" /></label>
        <label className="text-sm font-bold">روابط المساعدة<small className="mr-2 font-normal text-slate-500">النص | الرابط</small><textarea name="help" rows={7} defaultValue={lines(value.help)} className="input mt-1 font-mono text-sm" /></label></section>
      <section className="card grid gap-3 md:grid-cols-3"><h2 className="text-lg font-black md:col-span-3">التواصل (اتركه فارغاً إن لم يتوفر)</h2>
        <label className="text-sm font-bold">البريد<input name="email" dir="ltr" defaultValue={value.contact.email} className="input mt-1" /></label>
        <label className="text-sm font-bold">الهاتف<input name="phone" dir="ltr" defaultValue={value.contact.phone} className="input mt-1" /></label>
        <label className="text-sm font-bold">العنوان<input name="address" defaultValue={value.contact.address} className="input mt-1" /></label></section>
      <section className="card grid gap-3 md:grid-cols-2"><h2 className="text-lg font-black md:col-span-2">التواصل الاجتماعي (https:// كامل)</h2>
        {(["facebook", "instagram", "telegram", "twitter", "youtube"] as const).map((k) => <label key={k} className="text-sm font-bold">{k}<input name={k} dir="ltr" defaultValue={value.social[k]} className="input mt-1" /></label>)}</section>
      <section className="card grid gap-3"><h2 className="text-lg font-black">حقوق النشر</h2><label className="text-sm font-bold">النص (اتركه فارغاً للنص الافتراضي)<input name="copyright" defaultValue={value.copyright} className="input mt-1" /></label></section>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{state.ok}</p>}
      <div><SubmitButton>حفظ الفوتر</SubmitButton></div>
    </form>
  );
}
