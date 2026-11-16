import { requireAdmin } from "@/lib/auth";
import ImportForm from "@/components/admin/ImportForm";
import UniversitiesImportForm from "@/components/admin/UniversitiesImportForm";
import { Download, FileJson } from "lucide-react";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl space-y-12">
      <header>
        <h1 className="section-title">استيراد وتصدير البيانات</h1>
        <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="أقسام الصفحة">
          <a href="#universities" className="chip">الجامعات ومعدلات القبول</a>
          <a href="#specialties" className="chip">التخصصات</a>
        </nav>
      </header>

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
