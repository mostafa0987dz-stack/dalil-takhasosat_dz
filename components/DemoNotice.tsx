import { TriangleAlert } from "lucide-react";

export default function DemoNotice() {
  return (
    <div role="note" className="mb-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <TriangleAlert size={20} className="mt-1 shrink-0" aria-hidden />
      <p>العتبات المعروضة تجريبية لأغراض العرض فقط، ولا تمثل بيانات قبول رسمية. راجع منشور التوجيه السنوي لوزارة التعليم العالي قبل أي قرار.</p>
    </div>
  );
}
