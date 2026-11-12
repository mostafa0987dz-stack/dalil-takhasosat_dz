"use client";
import { useFormState } from "react-dom";
import { importJson, type FormState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

const initial: FormState = {};

export default function ImportForm() {
  const [state, action] = useFormState(importJson, initial);
  return (
    <form action={action} className="card grid gap-4 p-6">
      <label className="text-sm font-bold">ملف JSON<input type="file" name="file" accept="application/json,.json" className="input mt-2" /></label>
      <label className="text-sm font-bold">أو ألصق المحتوى<textarea name="json" rows={8} dir="ltr" className="input mt-2 font-mono text-xs" placeholder="[ { ... } ]" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish" />نشر مباشرة (وإلا تُحفظ كمسودات)</label>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{state.ok}</p>}
      <div><SubmitButton>استيراد</SubmitButton></div>
    </form>
  );
}
