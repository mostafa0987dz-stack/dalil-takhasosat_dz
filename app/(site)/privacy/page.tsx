import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = { title: "سياسة الخصوصية", alternates: { canonical: `${SITE_URL}/privacy` } };

export default function Privacy() {
  return (
    <section className="container-page max-w-3xl py-14">
      <h1 className="section-title mb-6">سياسة الخصوصية</h1>
      <div className="space-y-4 leading-8 text-slate-700 dark:text-slate-300">
        <p>لا يطلب الموقع إنشاء حساب للزوار، وحسابات المعدل تتم داخل المتصفح فقط؛ فلا تُرسل علاماتك إلى أي خادم.</p>
        <p>يستخدم الموقع التخزين المحلي في المتصفح لحفظ تفضيل الوضع الليلي وقائمة التخصصات المفضلة فقط، ويحفظ ملف تعريف ارتباط (Cookie) باسم <code dir="ltr">site_locale</code> لتذكّر لغة الواجهة التي اخترتها. يمكنك مسحها في أي وقت من إعدادات المتصفح.</p>
        <p>قد تعرض بعض الصفحات إعلاناً معتمداً. عند عرض الإعلان أو النقر عليه يُسجَّل حدث مجهول الهوية (نوع الحدث ومعرّف الإعلان والتاريخ) لأغراض الإحصاء فقط، دون تخزين اسمك أو عنوان IP أو أي معرّف شخصي ضمن هذه السجلات.</p>
        <p>عند إضافة خدمات تحليل أو حسابات في المستقبل سيتم تحديث هذه السياسة بوضوح.</p>
      </div>
    </section>
  );
}
