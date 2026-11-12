import { requireAdmin } from "@/lib/auth";
import ImportForm from "@/components/admin/ImportForm";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <h1 className="section-title mb-3">استيراد تخصصات (JSON)</h1>
      <p className="mb-6 text-sm leading-7 text-slate-600 dark:text-slate-400">
        ارفع ملف <code dir="ltr">data/specialties.json</code> لنقل البيانات الأولية إلى القاعدة، أو ألصق مصفوفة بنفس البنية.
        التخصصات الموجودة بنفس المعرّف تُحدَّث وتُستبدل عتباتها.
      </p>
      <ImportForm />
    </div>
  );
}
