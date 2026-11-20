"use client";
import { useActionState } from "react";
import { saveBlogCategory, type FormState } from "@/app/admin/content-actions";
import SubmitButton from "./SubmitButton";

const initial: FormState = {};
export default function BlogCategoryForm({ cat }: { cat?: { id: string; slug: string; name_ar: string; description_ar: string | null; sort_order: number } }) {
  const [state, action] = useActionState(saveBlogCategory, initial);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_6rem_auto] md:items-end">
      {cat && <input type="hidden" name="id" value={cat.id} />}
      <label className="text-xs font-bold">الاسم<input name="name_ar" required defaultValue={cat?.name_ar} className="input mt-1" /></label>
      <label className="text-xs font-bold">المعرّف (slug)<input name="slug" required dir="ltr" defaultValue={cat?.slug} className="input mt-1" /></label>
      <label className="text-xs font-bold">الترتيب<input name="sort_order" type="number" min={0} max={999} defaultValue={cat?.sort_order ?? 0} className="input mt-1" /></label>
      <SubmitButton>{cat ? "حفظ" : "إضافة"}</SubmitButton>
      <label className="text-xs font-bold md:col-span-4">الوصف (اختياري)<input name="description_ar" defaultValue={cat?.description_ar ?? ""} className="input mt-1" /></label>
      {state.error && <p role="alert" className="text-sm font-bold text-red-600 md:col-span-4">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm font-bold text-emerald-700 md:col-span-4">{state.ok}</p>}
    </form>
  );
}
