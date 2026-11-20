"use client";
import { useActionState, useState } from "react";
import { commitImport, previewImport, type CommitResult, type ImportPreview } from "@/app/admin/import-actions";
import { DATASETS, DATASET_LABELS } from "@/lib/import/datasets";
import SubmitButton from "./SubmitButton";

const p0: ImportPreview = {};
const c0: CommitResult = {};

export default function ImportCenter() {
  const [mode, setMode] = useState<"specialized" | "general">("specialized");
  const [preview, previewAction] = useActionState(previewImport, p0);
  const [commit, commitAction] = useActionState(commitImport, c0);
  const done = Boolean(commit.report);
  return (
    <div className="space-y-6">
      <form action={previewAction} className="card grid gap-4">
        <fieldset>
          <legend className="mb-2 text-sm font-bold">نوع الرفع</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {([["specialized", "متخصص (نوع واحد، JSON)"], ["general", "عام (ZIP متكامل)"]] as const).map(([v, l]) => (
              <label key={v} className={`chip cursor-pointer ${mode === v ? "chip-active" : ""}`}><input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} className="sr-only" />{l}</label>
            ))}
          </div>
        </fieldset>
        {mode === "specialized" && (
          <label className="text-sm font-bold">نوع البيانات
            <select name="dataset" required className="input mt-1" defaultValue="">
              <option value="" disabled>اختر النوع</option>
              {DATASETS.map((d) => <option key={d} value={d}>{DATASET_LABELS[d]}</option>)}
            </select>
          </label>
        )}
        <label className="text-sm font-bold">{mode === "general" ? "ملف ZIP (manifest.json + ملفات JSON)" : "ملف JSON (مصفوفة أو كائن بمفتاح النوع)"}
          <input type="file" name="file" required accept={mode === "general" ? ".zip,application/zip" : ".json,application/json"} className="input mt-1" />
        </label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="skip_invalid" className="mt-1" /><span>تجاهل السجلات غير الصالحة ومتابعة الصالح منها<small className="block text-slate-500">وإلا يُمنع الاستيراد عند وجود أي خطأ. أخطاء بنية الأرشيف تمنع دائماً.</small></span></label>
        <div><SubmitButton>قراءة ومعاينة</SubmitButton></div>
      </form>

      {preview.error && (
        <div role="alert" className="card border-red-200 bg-red-50/70 dark:bg-red-950/30">
          <p className="font-bold text-red-700 dark:text-red-300">{preview.error}</p>
          {preview.issues && preview.issues.length > 0 && (
            <div className="table-wrap mt-3"><table className="w-full min-w-[28rem] text-right text-sm"><thead><tr><th className="th">النوع</th><th className="th">السجل</th><th className="th">المشكلة</th></tr></thead>
              <tbody>{preview.issues.map((i, k) => <tr key={k} className="border-t border-slate-200/60 dark:border-slate-700/60"><td className="p-2">{(DATASET_LABELS as Record<string, string>)[i.dataset] ?? i.dataset}</td><td className="p-2">{i.index ?? "—"}</td><td className="p-2">{i.message}</td></tr>)}</tbody></table></div>
          )}
        </div>
      )}

      {preview.runId && !preview.error && !done && (
        <section className="card space-y-4" aria-labelledby="preview-title">
          <h2 id="preview-title" className="text-lg font-black">المعاينة: {preview.fileName}</h2>
          <div className="table-wrap"><table className="w-full min-w-[30rem] text-right text-sm"><thead><tr><th className="th">النوع</th><th className="th">صالح</th><th className="th">جديد</th><th className="th">مكرر (موجود)</th><th className="th">غير صالح</th></tr></thead>
            <tbody>{preview.summary?.map((r) => <tr key={r.dataset} className="border-t border-slate-200/60 dark:border-slate-700/60"><td className="p-2 font-bold">{DATASET_LABELS[r.dataset]}</td><td className="p-2">{r.total}</td><td className="p-2">{r.added}</td><td className="p-2">{r.existing}</td><td className="p-2">{r.invalid}</td></tr>)}</tbody></table></div>
          {preview.warnings && preview.warnings.length > 0 && <ul className="list-disc space-y-1 pr-5 text-sm text-amber-800 dark:text-amber-300">{preview.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
          {preview.issues && preview.issues.length > 0 && <details className="text-sm"><summary className="cursor-pointer font-bold">سجلات سيتم تجاهلها ({preview.issues.length})</summary><ul className="mt-2 list-disc space-y-1 pr-5">{preview.issues.map((i, k) => <li key={k}>{(DATASET_LABELS as Record<string, string>)[i.dataset] ?? i.dataset} #{i.index ?? "—"}: {i.message}</li>)}</ul></details>}
          {preview.sources && preview.sources.length > 0 && <p className="text-xs text-slate-500">المصادر في الملف: {preview.sources.map((s) => s.title).join("، ")}</p>}
          <form action={commitAction} className="grid gap-3 rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-800/50">
            <input type="hidden" name="run_id" value={preview.runId} />
            <fieldset><legend className="mb-1 text-sm font-bold">عند وجود سجل مكرر</legend>
              <label className="flex items-start gap-2 text-sm"><input type="radio" name="policy" value="skip" defaultChecked className="mt-1" /><span>تخطّي الموجود (الأكثر أماناً)</span></label>
              <label className="flex items-start gap-2 text-sm"><input type="radio" name="policy" value="update" className="mt-1" /><span>تحديث الموجود بقيم الملف<small className="block text-slate-500">لا يغيّر حالة النشر، ولا يحذف سجلات غير موجودة في الملف.</small></span></label>
            </fieldset>
            <p className="text-xs leading-6 text-slate-600 dark:text-slate-400">السجلات الجديدة تُنشأ <b>غير منشورة</b> (جامعات وتخصصات ومقالات) وتراجعها من لوحاتها. أي خطأ أثناء الحفظ يُلغي العملية كلها.</p>
            <div><SubmitButton>تأكيد الاستيراد</SubmitButton></div>
          </form>
          {commit.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-300">{commit.error}</p>}
        </section>
      )}

      {commit.report && (
        <section className="card space-y-3" role="status" aria-labelledby="report-title">
          <h2 id="report-title" className="text-lg font-black text-emerald-700 dark:text-emerald-400">اكتمل الاستيراد</h2>
          <div className="table-wrap"><table className="w-full min-w-[30rem] text-right text-sm"><thead><tr><th className="th">النوع</th><th className="th">مضاف</th><th className="th">محدَّث</th><th className="th">متجاهَل</th><th className="th">فاشل</th></tr></thead>
            <tbody>{commit.report.map((r) => <tr key={r.dataset} className="border-t border-slate-200/60 dark:border-slate-700/60"><td className="p-2 font-bold">{DATASET_LABELS[r.dataset]}</td><td className="p-2">{r.added}</td><td className="p-2">{r.updated}</td><td className="p-2">{r.skipped}</td><td className="p-2">{r.failed}</td></tr>)}</tbody></table></div>
          <p className="text-xs text-slate-500">«فاشل» = سجلات غير صالحة استُبعدت في المعاينة. لم يُنشر أي سجل جديد تلقائياً.</p>
        </section>
      )}
    </div>
  );
}
