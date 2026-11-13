import { requireAdmin } from "@/lib/auth";
import ImportForm from "@/components/admin/ImportForm";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <h1 className="section-title mb-3">استيراد وتصدير التخصصات</h1>
      <p className="mb-6 text-sm leading-7 text-slate-600 dark:text-slate-400">
        ارفع ملف <code dir="ltr">JSON</code> أو <code dir="ltr">CSV</code> (بنفس أعمدة ملف التصدير)، أو ألصق المحتوى. للحصول على قالب جاهز صدّر البيانات الحالية أولاً.
        التخصصات الموجودة بنفس المعرّف تُحدَّث وتُستبدل عتباتها.
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/admin/export?format=json" className="btn-ghost">تصدير JSON</a>
        <a href="/admin/export?format=csv" className="btn-ghost">تصدير CSV</a>
      </div>
      <ImportForm />
    </div>
  );
}
