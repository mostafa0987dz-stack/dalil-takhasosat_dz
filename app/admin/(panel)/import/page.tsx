import { requireAdmin } from "@/lib/auth";
import ImportForm from "@/components/admin/ImportForm";
import ImportCenter from "@/components/admin/ImportCenter";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { adminClient } from "@/lib/supabase";
import { undoImport } from "@/app/admin/import-actions";
import { DATASET_LABELS } from "@/lib/import/datasets";
import UniversitiesImportForm from "@/components/admin/UniversitiesImportForm";
import { Download, FileJson } from "lucide-react";

const STATUS: Record<string, string> = { previewed: "معاينة", committed: "منفّذ", failed: "فشل (تراجع كامل)", undone: "تم التراجع" };

export default async function ImportPage() {
  await requireAdmin();
  const { data: runs, error: runsError } = await adminClient().from("import_runs").select("id,kind,dataset,status,file_name,created_at,created_by,report,error").order("created_at", { ascending: false }).limit(15);
  return (
    <div className="max-w-4xl space-y-12">
      <header>
        <h1 className="section-title">استيراد وتصدير البيانات</h1>
        <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="أقسام الصفحة">
          <a href="#center" className="chip">مركز الاستيراد</a>
          <a href="#history" className="chip">سجل الاستيراد</a>
          <a href="#universities" className="chip">الجامعات ومعدلات القبول (سريع)</a>
          <a href="#specialties" className="chip">التخصصات</a>
        </nav>
      </header>

      <section id="center" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-black">مركز الاستيراد</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">رفع متخصص (نوع واحد) أو عام (ZIP متكامل) مع معاينة وكشف التكرار وسياسة التعامل معه. الجديد يُنشأ غير منشور، وأي خطأ يُلغي العملية بالكامل. صيغة الأرشيف: <code dir="ltr">docs/IMPORT_V2.md</code>.</p>
          <p className="mt-2 flex flex-wrap gap-2 text-sm"><a href="/templates/university-data-sample.zip" download className="btn-ghost">نموذج ZIP</a></p>
        </div>
        <ImportCenter />
      </section>

      <section id="history" className="scroll-mt-6 space-y-3">
        <h2 className="text-xl font-black">سجل الاستيراد</h2>
        {runsError ? <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">جداول الاستيراد غير موجودة: نفّذ migration 20261121_import_v2.sql. ({runsError.message})</p> : (
          <div className="table-wrap"><table className="w-full min-w-[34rem] text-right text-sm"><thead><tr><th className="th">التاريخ</th><th className="th">النوع</th><th className="th">الملف</th><th className="th">الحالة</th><th className="th">إجراء</th></tr></thead>
            <tbody>{((runs ?? []) as any[]).map((r) => (
              <tr key={r.id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                <td className="p-2">{new Date(r.created_at).toLocaleString("ar-DZ", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Algiers" })}</td>
                <td className="p-2">{r.kind === "general" ? "عام (ZIP)" : `متخصص: ${(DATASET_LABELS as Record<string, string>)[r.dataset] ?? r.dataset ?? ""}`}</td>
                <td dir="ltr" className="p-2 text-left">{r.file_name}</td>
                <td className="p-2" title={r.error ?? undefined}>{STATUS[r.status] ?? r.status}</td>
                <td className="p-2">{r.status === "committed" ? (
                  <form action={undoImport}><input type="hidden" name="run_id" value={r.id} /><ConfirmSubmit message="التراجع يحذف فقط السجلات التي أنشأها هذا الاستيراد (لا يُعيد قيم السجلات المحدَّثة). متابعة؟" className="text-xs text-red-600 underline">تراجع</ConfirmSubmit></form>
                ) : "—"}</td>
              </tr>
            ))}</tbody></table>
            {!(runs ?? []).length && <p className="p-6 text-center text-slate-500">لا عمليات استيراد بعد.</p>}
          </div>
        )}
      </section>

      <section id="universities" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-black">رفع الجامعات ومعدلات القبول (JSON)</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">ملف واحد يحوي الجامعات، والتخصصات التي تدرّسها كل جامعة، ومعدلات القبول لكل شعبة وسنة. أعد رفع الملف نفسه بأمان: السجلات المتطابقة تُحدَّث ولا تتكرر.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/templates/universities-template.json" download className="btn-ghost"><FileJson size={15} />قالب جاهز</a>
          <a href="/admin/export?type=universities" className="btn-ghost"><Download size={15} />تصدير كل الجامعات</a>
        </div>
        <UniversitiesImportForm />
      </section>

      <section id="specialties" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-black">استيراد وتصدير التخصصات</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
            ارفع ملف <code dir="ltr">JSON</code> أو <code dir="ltr">CSV</code> (بنفس أعمدة ملف التصدير)، أو ألصق المحتوى. التخصصات الموجودة بنفس المعرّف تُحدَّث وتُستبدل عتباتها.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/export?format=json" className="btn-ghost"><Download size={15} />تصدير JSON</a>
          <a href="/admin/export?format=csv" className="btn-ghost"><Download size={15} />تصدير CSV</a>
        </div>
        <ImportForm />
      </section>
    </div>
  );
}
